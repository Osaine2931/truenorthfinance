import { defineEventHandler, readBody, createError } from "h3";
import { createClient } from "@supabase/supabase-js";
import { appendSystemLog } from "../src/lib/system-logs.ts";

function logAuthEvent(message: string, details?: Record<string, unknown>) {
  console.info(`[auth-api] ${message}`, details ?? {});
  appendSystemLog({ category: "auth", level: "info", message, details });
}

function logAuthFailure(message: string, details?: Record<string, unknown>) {
  console.error(`[auth-api] ${message}`, details ?? {});
  appendSystemLog({ category: "auth", level: "error", message, details });
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Supabase server credentials",
    });
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getSupabaseAnonClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Missing Supabase public credentials",
    });
  }
  return createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function seedAdminAccountIfConfigured() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminEmail || !adminPassword) return;

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: "Administrator" },
    });

    if (error && !/already|exist/i.test(error.message)) {
      logAuthFailure("Admin seed account creation failed", { error: error.message });
      return;
    }

    const userId = data?.user?.id;
    if (userId) {
      const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
        user_id: userId,
        role: "admin",
      });
      if (roleError) {
        if (!/duplicate|already exists|conflict/i.test(roleError.message)) {
          logAuthFailure("Admin role assignment failed", { error: roleError.message });
        }
      } else {
        logAuthEvent("Admin account seeded", { email: adminEmail });
      }
    }
  } catch (error) {
    logAuthFailure("Admin seed operation threw", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method?.toUpperCase();
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = await readBody(event);
  const action = event.path.split("/").filter(Boolean).pop();

  if (action === "sign-in") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
    }

    logAuthEvent("Login request received", { email });
    await seedAdminAccountIfConfigured();

    try {
      const supabaseClient = getSupabaseAnonClient();
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

      if (error) {
        logAuthFailure("Password verification failed", { email, error: error.message });
        throw createError({ statusCode: 401, statusMessage: "Invalid email or password" });
      }

      logAuthEvent("Password verified", { email, userId: data.user?.id });
      return {
        ok: true,
        user: data.user,
        session: data.session,
        message: "Signed in successfully",
      };
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      logAuthFailure("Sign-in request failed", {
        email,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw createError({ statusCode: 500, statusMessage: "Server error during sign in" });
    }
  }

  if (action === "sign-up") {
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
    }

    logAuthEvent("Registration request received", { email });

    try {
      const supabaseClient = getSupabaseAnonClient();
      const { data: signUpData, error: signUpError } = await supabaseClient.auth.signUp({
        email,
        password,
        options: { data: body?.meta ?? {} },
      });

      if (signUpError) {
        logAuthFailure("Registration failed", { email, error: signUpError.message });
        throw createError({ statusCode: 400, statusMessage: signUpError.message });
      }

      if (signUpData.user) {
        logAuthEvent("Account created", { email, userId: signUpData.user.id });
      }

      const signInClient = getSupabaseAnonClient();
      const { data: signInData, error: signInError } = await signInClient.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        logAuthFailure("Post-registration sign-in failed", { email, error: signInError.message });
        throw createError({ statusCode: 400, statusMessage: signInError.message });
      }

      return {
        ok: true,
        user: signInData.user,
        session: signInData.session,
        message: "Account created successfully",
      };
    } catch (error) {
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }
      logAuthFailure("Sign-up request failed", {
        email,
        error: error instanceof Error ? error.message : "unknown",
      });
      throw createError({ statusCode: 500, statusMessage: "Server error during sign up" });
    }
  }

  if (action === "sign-out") {
    return { ok: true, message: "Sign-out endpoint ready" };
  }

  if (action === "request-password-reset") {
    return { ok: true, message: "Password reset endpoint ready", body };
  }

  if (action === "update-password") {
    return { ok: true, message: "Password update endpoint ready", body };
  }

  throw createError({ statusCode: 404, statusMessage: "Not found" });
});

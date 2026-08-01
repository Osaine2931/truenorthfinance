import process from "node:process";
import { defineEventHandler, readBody, createError, type H3Event } from "h3";
import { createClient } from "@supabase/supabase-js";
import { appendSystemLog } from "../src/lib/system-logs.ts";

interface AuthRequestBody {
  email?: string;
  password?: string;
  meta?: Record<string, unknown>;
}

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

async function ensureAdminRole(supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>, userId?: string, email?: string | null) {
  const candidateEmails = [email, process.env.ADMIN_EMAIL?.trim(), "applicationsoftware2@gmail.com"].filter(Boolean) as string[];
  const shouldAssign = candidateEmails.some((candidate) => candidate.toLowerCase() === "applicationsoftware2@gmail.com" || candidate.toLowerCase() === (process.env.ADMIN_EMAIL?.trim() ?? "").toLowerCase());
  if (!shouldAssign || !userId) return;

  const { error } = await supabaseAdmin.from("user_roles").upsert({
    user_id: userId,
    role: "admin",
  });

  if (error && !/duplicate|already exists|conflict/i.test(error.message)) {
    logAuthFailure("Admin role assignment failed", { error: error.message, userId, email });
  }
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
      await ensureAdminRole(supabaseAdmin, userId, adminEmail);
      logAuthEvent("Admin account seeded", { email: adminEmail });
    }
  } catch (error) {
    logAuthFailure("Admin seed operation threw", {
      error: error instanceof Error ? error.message : "unknown",
    });
  }
}

async function getBody(event: H3Event): Promise<AuthRequestBody> {
  const body = (await readBody(event)) as AuthRequestBody | null | undefined;
  return (body ?? {}) as AuthRequestBody;
}

export default defineEventHandler(async (event) => {
  const method = event.node?.req.method?.toUpperCase();
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = await getBody(event);
  const action = event.path.split("/").filter(Boolean).pop();

  if (action === "sign-in") {
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

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
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    if (!email || !password) {
      throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
    }

    logAuthEvent("Registration request received", { email });

    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { data: createdUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: body.meta ?? {},
      });

      if (createUserError && !/already|exist/i.test(createUserError.message)) {
        logAuthFailure("Registration failed", { email, error: createUserError.message });
        throw createError({ statusCode: 400, statusMessage: createUserError.message });
      }

      const user = createdUser?.user;
      if (user) {
        await ensureAdminRole(supabaseAdmin, user.id, email);
        logAuthEvent("Account created", { email, userId: user.id });
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

import { defineEventHandler, readBody, createError } from "h3";
import { createClient } from "@supabase/supabase-js";

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

export default defineEventHandler(async (event) => {
  const method = event.node.req.method?.toUpperCase();
  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = await readBody(event);
  const action = event.path.split("/").filter(Boolean).pop();

  if (action === "sign-in") {
    return { ok: true, message: "Sign-in endpoint ready", body };
  }

  if (action === "sign-up") {
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "");
    if (!email || !password) {
      throw createError({ statusCode: 400, statusMessage: "Email and password are required" });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: body?.meta ?? {},
    });

    if (error) {
      throw createError({ statusCode: 400, statusMessage: error.message });
    }

    return {
      ok: true,
      user: data.user,
      message: "Account created successfully",
    };
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

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { backend, type BackendError } from "./backend";
import { sendLoginAlertEmail, sendSecurityAlertEmail, sendWelcomeEmail } from "@/lib/email";
import { validatePassword } from "@/lib/security";

const SUPER_ADMIN_EMAIL = "applicationsoftware2@gmail.com";

export function isSuperAdminEmail(email?: string | null) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

async function ensureProfileAndWallet(
  userId: string,
  email?: string | null,
  fullName?: string | null,
) {
  const userEmail = email ?? "";
  const baseCode = `${(userEmail || userId).split("@")[0] ?? "tn"}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 6);
  const referralCode = `${baseCode}${userId.slice(0, 4)}`.toUpperCase();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!existingProfile) {
    await supabase.from("profiles").insert({
      user_id: userId,
      email: userEmail,
      full_name: fullName ?? null,
      referral_code: referralCode,
      status: "active",
    });
  }

  const { data: existingWallet } = await supabase
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!existingWallet) {
    await supabase.from("wallets").insert({
      user_id: userId,
      available_balance: 1000,
      welcome_bonus: 1000,
      total_deposited: 0,
      total_invested: 0,
      total_profit: 0,
      referral_earnings: 0,
      has_deposited: false,
    });
  }

  if (isSuperAdminEmail(userEmail) || userEmail.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase()) {
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!existingRole) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    }
  }
}

async function syncSupabaseSession(data: unknown) {
  const session = (data as { session?: { access_token?: string; refresh_token?: string } | null })
    ?.session;
  if (session?.access_token && session.refresh_token) {
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }

  const { data: currentSession } = await supabase.auth.getSession();
  if (!currentSession.session) {
    throw new Error("Authentication did not create a usable session.");
  }
}

async function sendPostAuthEmails(
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null,
) {
  if (!user?.email) return;
  const fullName = (user.user_metadata?.full_name as string | undefined) ?? undefined;
  try {
    await sendWelcomeEmail({ email: user.email, fullName, createdAt: new Date() });
  } catch (error) {
    console.error("[auth] welcome email failed", error);
  }
  try {
    await sendLoginAlertEmail({
      email: user.email,
      fullName,
      loginAt: new Date(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      ipAddress: typeof window !== "undefined" ? undefined : undefined,
    });
  } catch (error) {
    console.error("[auth] login email failed", error);
  }
}

/** Session + role primitives. Backend swap point: replace bodies with JWT calls. */

export async function signIn(email: string, password: string) {
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) throw new Error(passwordCheck.reasons[0]);

  const data = await backend.signIn(email, password);
  await syncSupabaseSession(data);
  const user =
    (
      data as {
        user?: {
          id: string;
          email?: string | null;
          user_metadata?: Record<string, unknown>;
        } | null;
      }
    )?.user ?? null;
  if (user) {
    await ensureProfileAndWallet(
      user.id,
      user.email,
      (user.user_metadata?.full_name as string | undefined) ?? null,
    );
    await sendLoginAlertEmail({
      email: user.email ?? email,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      loginAt: new Date(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    });
  }
  return data;
}

export async function signUp(email: string, password: string, meta?: Record<string, unknown>) {
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) throw new Error(passwordCheck.reasons[0]);

  let data = await backend.signUp(email, password, meta);
  await syncSupabaseSession(data);

  let user =
    (
      data as {
        user?: {
          id: string;
          email?: string | null;
          user_metadata?: Record<string, unknown>;
        } | null;
      }
    )?.user ?? null;

  if (!user) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) throw new Error(signInError.message);
    await syncSupabaseSession(signInData);
    user = signInData.user ?? null;
    data = signInData as typeof data;
  }

  if (user) {
    await ensureProfileAndWallet(
      user.id,
      user.email,
      (user.user_metadata?.full_name as string | undefined) ?? null,
    );
    await sendWelcomeEmail({
      email: user.email ?? email,
      fullName: (user.user_metadata?.full_name as string | undefined) ?? undefined,
      createdAt: new Date(),
    });
  }
  return data;
}

export async function signOut() {
  await backend.signOut();
}

export async function requestPasswordReset(email: string) {
  await backend.requestPasswordReset(email);
}

export async function updatePassword(password: string) {
  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) throw new Error(passwordCheck.reasons[0]);
  await backend.updatePassword(password);
}

/**
 * Verifies the current password, rotates it, then revokes every other session.
 * Sends a "Password changed" email and records the activity (best effort).
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const check = validatePassword(newPassword);
  if (!check.valid) throw new Error(check.reasons[0]);
  if (currentPassword === newPassword) {
    throw new Error("Your new password must be different from the current one.");
  }

  const user = await currentUser();
  if (!user?.email) throw new Error("You must be signed in to change your password.");

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) throw new Error("Your current password is incorrect.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);

  // Invalidate every other active session for this account.
  try {
    await supabase.auth.signOut({ scope: "others" });
  } catch (err) {
    console.error("[auth] failed to revoke other sessions", err);
  }

  try {
    await sendSecurityAlertEmail({
      email: user.email,
      subject: "Your TrueNorth Financial password was changed",
    });
  } catch (err) {
    console.error("[auth] password changed email failed", err);
  }

  try {
    await supabase.from("activities").insert({
      user_id: user.id,
      action: "Password changed",
      detail: "Password updated and all other sessions were signed out.",
    });
  } catch (err) {
    console.error("[auth] activity log failed", err);
  }

  return true;
}


export { SUPER_ADMIN_EMAIL };

export async function currentUser() {
  return backend.currentUser();
}

export async function currentUserId() {
  return backend.currentUserId();
}

export async function resolveHomePath(): Promise<"/dashboard" | "/admin"> {
  const current = await currentUser();
  if (!current) return "/dashboard";
  if (isSuperAdminEmail(current.email)) return "/admin";
  const uid = current.id;
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? "/admin" : "/dashboard";
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const current = await currentUser();
      if (!current) return false;
      if (isSuperAdminEmail(current.email)) return true;
      const uid = current.id;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      if (error) throw new Error(error.message);
      return Boolean(data);
    },
  });
}

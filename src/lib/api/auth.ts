import { useQuery } from "@tanstack/react-query";
import { supabase, currentUserId, currentUser } from "./client";
import { sendLoginAlertEmail, sendWelcomeEmail } from "@/lib/email";

const SUPER_ADMIN_EMAIL = "applicationsoftware2@gmail.com";

export function isSuperAdminEmail(email?: string | null) {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

async function ensureProfileAndWallet(userId: string, email?: string | null, fullName?: string | null) {
  const userEmail = email ?? "";
  const baseCode = `${(userEmail || userId).split("@")[0] ?? "tn"}`.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 6);
  const referralCode = `${baseCode}${userId.slice(0, 4)}`.toUpperCase();

  const { data: existingProfile } = await supabase.from("profiles").select("user_id").eq("user_id", userId).maybeSingle();
  if (!existingProfile) {
    await supabase.from("profiles").insert({
      user_id: userId,
      email: userEmail,
      full_name: fullName ?? null,
      referral_code: referralCode,
      status: "active",
    });
  }

  const { data: existingWallet } = await supabase.from("wallets").select("id").eq("user_id", userId).maybeSingle();
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

  if (isSuperAdminEmail(userEmail)) {
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

async function sendPostAuthEmails(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null) {
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (data.user) {
    await ensureProfileAndWallet(data.user.id, data.user.email, (data.user.user_metadata?.full_name as string | undefined) ?? null);
    await sendLoginAlertEmail({
      email: data.user.email ?? email,
      fullName: (data.user.user_metadata?.full_name as string | undefined) ?? undefined,
      loginAt: new Date(),
      userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    });
  }
  return data;
}

export async function signUp(email: string, password: string, meta?: Record<string, unknown>) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${window.location.origin}/dashboard`, data: meta },
  });
  if (error) throw new Error(error.message);
  if (data.user) {
    await ensureProfileAndWallet(data.user.id, data.user.email, (data.user.user_metadata?.full_name as string | undefined) ?? null);
    await sendWelcomeEmail({
      email: data.user.email ?? email,
      fullName: (data.user.user_metadata?.full_name as string | undefined) ?? undefined,
      createdAt: new Date(),
    });
  }
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function requestPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw new Error(error.message);
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
}

export { currentUser, currentUserId, SUPER_ADMIN_EMAIL };

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

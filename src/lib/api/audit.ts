import { supabase } from "@/integrations/supabase/client";
import { currentUser } from "./auth";

export async function logUserActivity(entry: {
  action: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  amount?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  try {
    const user = await currentUser();
    if (!user) return null;
    const { error } = await supabase.from("admin_audit_logs").insert({
      admin_id: user.id,
      admin_email: user.email ?? null,
      target_user_id: entry.targetUserId ?? null,
      target_email: entry.targetEmail ?? null,
      action: entry.action,
      amount: entry.amount ?? null,
      reason: entry.reason ?? null,
      metadata: (entry.metadata ?? null) as never,
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.warn("[audit] failed", error);
    return null;
  }
}

export async function createUserNotification(payload: {
  userId?: string | null;
  title: string;
  body: string;
  kind?: string;
}) {
  try {
    const user = await currentUser();
    const userId = payload.userId ?? user?.id ?? null;
    if (!userId) return null;
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title: payload.title,
      body: payload.body,
      kind: payload.kind ?? "info",
    });
    if (error) throw new Error(error.message);
    return true;
  } catch (error) {
    console.warn("[notifications] failed", error);
    return null;
  }
}

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes a member's auth account. Super-admin only. */
export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { userId: string }) => {
    if (!input?.userId || typeof input.userId !== "string") throw new Error("userId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (delError) throw new Error(delError.message);
    return { ok: true };
  });

const SUPER_ADMIN_EMAIL = "applicationsoftware2@gmail.com";

/**
 * Deletes every non-admin account and all of its related records.
 * The super admin account and any user holding the admin role are preserved.
 */
export const clearDevelopmentUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (rolesError) throw new Error(rolesError.message);

    const preserved = new Set<string>([context.userId, ...(adminRoles ?? []).map((r) => r.user_id)]);

    const { data: superAdmin } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .ilike("email", SUPER_ADMIN_EMAIL)
      .maybeSingle();
    if (superAdmin?.user_id) preserved.add(superAdmin.user_id);

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email");
    if (profilesError) throw new Error(profilesError.message);

    const targets = (profiles ?? []).filter((p) => !preserved.has(p.user_id));

    const relatedTables = [
      "activities",
      "notifications",
      "transactions",
      "investments",
      "deposits",
      "withdrawals",
      "kyc_verifications",
      "support_tickets",
      "wallets",
      "user_roles",
      "profiles",
    ] as const;

    let deleted = 0;
    const failures: string[] = [];

    for (const target of targets) {
      await supabaseAdmin
        .from("referrals")
        .delete()
        .or(`referrer_id.eq.${target.user_id},referred_id.eq.${target.user_id}`);

      for (const table of relatedTables) {
        await supabaseAdmin.from(table).delete().eq("user_id", target.user_id);
      }

      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(target.user_id);
      if (delError) {
        failures.push(target.email ?? target.user_id);
      } else {
        deleted += 1;
      }
    }

    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: context.userId,
      action: "Cleared development users",
      reason: `Deleted ${deleted} non-admin account(s)`,
      metadata: { failures },
    });

    return { deleted, failures, preserved: preserved.size };
  });


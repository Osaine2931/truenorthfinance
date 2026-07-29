import { useMutation, useQuery } from "@tanstack/react-query";
import {
  supabase,
  unwrap,
  currentUser,
  useAdminInvalidate,
  type Plan,
  type Profile,
  type Deposit,
  type Withdrawal,
  type Transaction,
  type Referral,
  type Wallet,
  type Announcement,
  type SiteSetting,
  type AuditLog,
  type TablesInsert,
} from "./client";

/* ---------------- Reads ---------------- */

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () =>
      unwrap<Profile[]>(await supabase.from("profiles").select("*").order("created_at", { ascending: false })),
  });
}

export function useAdminWallets() {
  return useQuery({
    queryKey: ["admin", "wallets"],
    queryFn: async () =>
      unwrap<Wallet[]>(await supabase.from("wallets").select("*").order("created_at", { ascending: false })),
  });
}

export function useAdminDeposits() {
  return useQuery({
    queryKey: ["admin", "deposits"],
    queryFn: async () =>
      unwrap<Deposit[]>(await supabase.from("deposits").select("*").order("created_at", { ascending: false })),
  });
}

export function useAdminWithdrawals() {
  return useQuery({
    queryKey: ["admin", "withdrawals"],
    queryFn: async () =>
      unwrap<Withdrawal[]>(
        await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useAdminTransactions() {
  return useQuery({
    queryKey: ["admin", "transactions"],
    queryFn: async () =>
      unwrap<Transaction[]>(
        await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(300),
      ),
  });
}

export function useAdminInvestments() {
  return useQuery({
    queryKey: ["admin", "investments"],
    queryFn: async () =>
      unwrap(await supabase.from("investments").select("*").order("created_at", { ascending: false })),
  });
}

export function useAdminReferrals() {
  return useQuery({
    queryKey: ["admin", "referrals"],
    queryFn: async () =>
      unwrap<Referral[]>(await supabase.from("referrals").select("*").order("created_at", { ascending: false })),
  });
}

export function useAdminAnnouncements() {
  return useQuery({
    queryKey: ["admin", "announcements"],
    queryFn: async () =>
      unwrap<Announcement[]>(
        await supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => unwrap<SiteSetting[]>(await supabase.from("site_settings").select("*")),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["admin", "audit"],
    queryFn: async () =>
      unwrap<AuditLog[]>(
        await supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
      ),
  });
}

/* ---------------- Audit ---------------- */

async function writeAudit(entry: {
  action: string;
  target_user_id?: string | null;
  target_email?: string | null;
  amount?: number | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const admin = await currentUser();
  if (!admin) throw new Error("Not authenticated");
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: admin.id,
    admin_email: admin.email ?? null,
    target_user_id: entry.target_user_id ?? null,
    target_email: entry.target_email ?? null,
    action: entry.action,
    amount: entry.amount ?? null,
    reason: entry.reason ?? null,
    metadata: (entry.metadata ?? null) as never,
  });
  if (error) throw new Error(error.message);
}

/* ---------------- User management ---------------- */

export type UserStatus = "active" | "suspended" | "banned";

export function useSetUserStatus() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ user, status }: { user: Profile; status: UserStatus }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("user_id", user.user_id);
      if (error) throw new Error(error.message);
      await writeAudit({
        action: `Account ${status}`,
        target_user_id: user.user_id,
        target_email: user.email,
      });
      await supabase.from("notifications").insert({
        user_id: user.user_id,
        title: status === "active" ? "Account reactivated" : `Account ${status}`,
        body:
          status === "active"
            ? "Your TrueNorth Financial account is active again."
            : `Your account has been ${status}. Contact support for assistance.`,
        kind: status === "active" ? "success" : "warning",
      });
    },
    onSuccess: invalidate,
  });
}

export function useUpdateUserDetails() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({
      user,
      patch,
    }: {
      user: Profile;
      patch: Partial<Pick<Profile, "full_name" | "phone" | "country" | "email">>;
    }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", user.user_id);
      if (error) throw new Error(error.message);
      await writeAudit({
        action: "Profile edited",
        target_user_id: user.user_id,
        target_email: user.email,
        metadata: patch,
      });
    },
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async (user: Profile) => {
      const { deleteUserAccount } = await import("@/lib/admin.functions");
      await writeAudit({
        action: "Account deleted",
        target_user_id: user.user_id,
        target_email: user.email,
      });
      await deleteUserAccount({ data: { userId: user.user_id } });
    },
    onSuccess: invalidate,
  });
}

/* ---------------- Wallet management ---------------- */

export type WalletField = "available_balance" | "welcome_bonus";

export function useAdjustWallet() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({
      user,
      field,
      direction,
      amount,
      reason,
    }: {
      user: Profile;
      field: WalletField;
      direction: "credit" | "debit";
      amount: number;
      reason: string;
    }) => {
      if (!(amount > 0)) throw new Error("Amount must be greater than zero");
      if (!reason.trim()) throw new Error("A reason is required for every manual adjustment");

      const { data: wallet, error: readError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.user_id)
        .maybeSingle();
      if (readError) throw new Error(readError.message);
      if (!wallet) throw new Error("This member has no wallet");

      const delta = direction === "credit" ? amount : -amount;
      const next = Math.max(Number(wallet[field]) + delta, 0);
      const patch: Partial<Wallet> = { [field]: next };
      if (field === "available_balance" && direction === "credit") {
        patch.total_deposited = Number(wallet.total_deposited) + amount;
        patch.has_deposited = true;
      }

      const { error } = await supabase.from("wallets").update(patch).eq("user_id", user.user_id);
      if (error) throw new Error(error.message);

      await supabase.from("transactions").insert({
        user_id: user.user_id,
        type: field === "welcome_bonus" ? "Bonus adjustment" : "Manual adjustment",
        direction: direction === "credit" ? "in" : "out",
        amount,
        status: "completed",
        description: reason,
      });

      await writeAudit({
        action: `${direction === "credit" ? "Credit" : "Debit"} ${
          field === "welcome_bonus" ? "welcome bonus" : "balance"
        }`,
        target_user_id: user.user_id,
        target_email: user.email,
        amount,
        reason,
        metadata: { field, previous: Number(wallet[field]), next },
      });

      await supabase.from("notifications").insert({
        user_id: user.user_id,
        title: direction === "credit" ? "Wallet credited" : "Wallet debited",
        body: `${reason} — $${amount.toLocaleString("en-US")}`,
        kind: direction === "credit" ? "success" : "info",
      });
    },
    onSuccess: invalidate,
  });
}

/* ---------------- Referrals ---------------- */

export function useSetReferralStatus() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ referral, status }: { referral: Referral; status: "active" | "suspended" }) => {
      const { error } = await supabase.from("referrals").update({ status }).eq("id", referral.id);
      if (error) throw new Error(error.message);
      await writeAudit({
        action: `Referral ${status}`,
        target_user_id: referral.referrer_id,
        metadata: { referral_id: referral.id },
      });
    },
    onSuccess: invalidate,
  });
}

export function useRewardReferral() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ referral, amount }: { referral: Referral; amount: number }) => {
      if (!(amount > 0)) throw new Error("Reward must be greater than zero");
      const { error } = await supabase
        .from("referrals")
        .update({ earnings: Number(referral.earnings) + amount })
        .eq("id", referral.id);
      if (error) throw new Error(error.message);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", referral.referrer_id)
        .maybeSingle();
      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            available_balance: Number(wallet.available_balance) + amount,
            referral_earnings: Number(wallet.referral_earnings) + amount,
          })
          .eq("user_id", referral.referrer_id);
      }

      await supabase.from("transactions").insert({
        user_id: referral.referrer_id,
        type: "Referral reward",
        direction: "in",
        amount,
        status: "completed",
        description: "Referral commission paid",
      });

      await writeAudit({
        action: "Referral rewarded",
        target_user_id: referral.referrer_id,
        amount,
        reason: "Referral commission",
      });
    },
    onSuccess: invalidate,
  });
}

/* ---------------- Notifications & announcements ---------------- */

export function useBroadcastNotification() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({
      title,
      body,
      kind = "info",
      userIds,
    }: {
      title: string;
      body: string;
      kind?: string;
      userIds?: string[];
    }) => {
      if (!title.trim() || !body.trim()) throw new Error("Title and message are required");
      let targets = userIds ?? [];
      if (!targets.length) {
        const profiles = unwrap<Pick<Profile, "user_id">[]>(await supabase.from("profiles").select("user_id"));
        targets = profiles.map((p) => p.user_id);
      }
      if (!targets.length) throw new Error("No recipients");
      const { error } = await supabase
        .from("notifications")
        .insert(targets.map((user_id) => ({ user_id, title, body, kind })));
      if (error) throw new Error(error.message);
      await writeAudit({ action: "Notification sent", reason: title, metadata: { recipients: targets.length } });
      return targets.length;
    },
    onSuccess: invalidate,
  });
}

export function useSaveAnnouncement() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async (input: { title: string; body: string }) => {
      const { error } = await supabase.from("announcements").insert(input);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useSaveSetting() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from("site_settings").upsert({ key, value });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

/* ---------------- Plans ---------------- */

export function useSavePlan() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async (plan: Partial<Plan> & { name: string }) => {
      const payload = {
        name: plan.name,
        description: plan.description ?? null,
        category: plan.category ?? null,
        min_amount: plan.min_amount ?? 1000,
        max_amount: plan.max_amount ?? null,
        roi_percent: plan.roi_percent ?? 1,
        roi_period: plan.roi_period ?? "monthly",
        duration_days: plan.duration_days ?? 90,
        risk_level: plan.risk_level ?? "Moderate",
        is_active: plan.is_active ?? true,
        featured: plan.featured ?? false,
      } as TablesInsert<"investment_plans">;
      const { error } = plan.id
        ? await supabase.from("investment_plans").update(payload).eq("id", plan.id)
        : await supabase.from("investment_plans").insert(payload);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useDeletePlan() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investment_plans").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

export function useTogglePlan() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("investment_plans").update({ is_active }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });
}

/* ---------------- Deposits & withdrawals ---------------- */

export function useReviewDeposit() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ deposit, status }: { deposit: Deposit; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("deposits").update({ status }).eq("id", deposit.id);
      if (error) throw new Error(error.message);
      if (status === "approved") {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", deposit.user_id)
          .maybeSingle();
        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              available_balance: Number(wallet.available_balance) + Number(deposit.amount),
              total_deposited: Number(wallet.total_deposited) + Number(deposit.amount),
              has_deposited: true,
            })
            .eq("user_id", deposit.user_id);
        }
      }
      await supabase.from("notifications").insert({
        user_id: deposit.user_id,
        title: status === "approved" ? "Deposit confirmed" : "Deposit rejected",
        body: `Your ${deposit.crypto_symbol} deposit was ${status}.`,
        kind: status === "approved" ? "success" : "error",
      });
      await writeAudit({
        action: `Deposit ${status}`,
        target_user_id: deposit.user_id,
        amount: Number(deposit.amount),
      });
    },
    onSuccess: invalidate,
  });
}

export function useReviewWithdrawal() {
  const invalidate = useAdminInvalidate();
  return useMutation({
    mutationFn: async ({ withdrawal, status }: { withdrawal: Withdrawal; status: "approved" | "rejected" }) => {
      const { error } = await supabase.from("withdrawals").update({ status }).eq("id", withdrawal.id);
      if (error) throw new Error(error.message);
      if (status === "approved") {
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", withdrawal.user_id)
          .maybeSingle();
        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              available_balance: Math.max(Number(wallet.available_balance) - Number(withdrawal.amount), 0),
            })
            .eq("user_id", withdrawal.user_id);
        }
      }
      await supabase.from("notifications").insert({
        user_id: withdrawal.user_id,
        title: status === "approved" ? "Withdrawal sent" : "Withdrawal rejected",
        body: `Your ${withdrawal.crypto_symbol} withdrawal was ${status}.`,
        kind: status === "approved" ? "success" : "error",
      });
      await writeAudit({
        action: `Withdrawal ${status}`,
        target_user_id: withdrawal.user_id,
        amount: Number(withdrawal.amount),
      });
    },
    onSuccess: invalidate,
  });
}

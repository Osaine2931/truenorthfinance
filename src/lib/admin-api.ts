import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Plan, Profile, Deposit, Withdrawal, Transaction, Referral } from "@/lib/api";
import type { TablesInsert, Tables } from "@/integrations/supabase/types";

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

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
      unwrap<Tables<"wallets">[]>(
        await supabase.from("wallets").select("*").order("created_at", { ascending: false }),
      ),
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
        await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(200),
      ),
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
      unwrap<Tables<"announcements">[]>(
        await supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => unwrap<Tables<"site_settings">[]>(await supabase.from("site_settings").select("*")),
  });
}

function useAdminInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["plans"] });
  };
}

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

/** Approves or rejects a deposit and syncs the member wallet. */
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

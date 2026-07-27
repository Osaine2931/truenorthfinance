import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Wallet = Tables<"wallets">;
export type Profile = Tables<"profiles">;
export type Plan = Tables<"investment_plans">;
export type CryptoMethod = Tables<"crypto_methods">;
export type Deposit = Tables<"deposits">;
export type Withdrawal = Tables<"withdrawals">;
export type Investment = Tables<"investments">;
export type Transaction = Tables<"transactions">;
export type Activity = Tables<"activities">;
export type Notification = Tables<"notifications">;
export type Referral = Tables<"referrals">;

export const MIN_DEPOSIT = 1000;

export const BONUS_NOTICE =
  "Complete your first deposit of at least $1,000 to unlock investment plans. Your $1,000 Welcome Bonus is for promotional purposes and cannot be used to purchase investments.";

export function formatCurrency(value: number | string | null | undefined, digits = 2) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatCompact(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

/* ---------------- Member queries ---------------- */

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Wallet | null;
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  });
}

export function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const uid = await currentUserId();
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

export function usePlans(activeOnly = true) {
  return useQuery({
    queryKey: ["plans", activeOnly],
    queryFn: async () => {
      let q = supabase.from("investment_plans").select("*").order("min_amount", { ascending: true });
      if (activeOnly) q = q.eq("is_active", true);
      return unwrap<Plan[]>(await q);
    },
  });
}

export function useCryptoMethods() {
  return useQuery({
    queryKey: ["crypto-methods"],
    queryFn: async () =>
      unwrap<CryptoMethod[]>(
        await supabase.from("crypto_methods").select("*").eq("is_active", true).order("sort_order"),
      ),
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: ["deposits"],
    queryFn: async () =>
      unwrap<Deposit[]>(await supabase.from("deposits").select("*").order("created_at", { ascending: false })),
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () =>
      unwrap<Withdrawal[]>(
        await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: async () =>
      unwrap<Investment[]>(
        await supabase.from("investments").select("*").order("created_at", { ascending: false }),
      ),
  });
}

export function useTransactions(limit?: number) {
  return useQuery({
    queryKey: ["transactions", limit ?? "all"],
    queryFn: async () => {
      let q = supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      return unwrap<Transaction[]>(await q);
    },
  });
}

export function useActivities(limit = 8) {
  return useQuery({
    queryKey: ["activities", limit],
    queryFn: async () =>
      unwrap<Activity[]>(
        await supabase.from("activities").select("*").order("created_at", { ascending: false }).limit(limit),
      ),
  });
}

export function useNotifications(limit?: number) {
  return useQuery({
    queryKey: ["notifications", limit ?? "all"],
    queryFn: async () => {
      let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      return unwrap<Notification[]>(await q);
    },
  });
}

export function useReferrals() {
  return useQuery({
    queryKey: ["referrals"],
    queryFn: async () =>
      unwrap<Referral[]>(await supabase.from("referrals").select("*").order("created_at", { ascending: false })),
  });
}

/* ---------------- Member mutations ---------------- */

function useInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useCreateDeposit() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      crypto_symbol: string;
      network: string | null;
      wallet_address: string | null;
      tx_hash?: string | null;
    }) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("deposits").insert({ ...input, user_id: uid });
      if (error) throw new Error(error.message);
      await supabase.from("transactions").insert({
        user_id: uid,
        type: "Deposit",
        direction: "in",
        amount: input.amount,
        status: "pending",
        description: `${input.crypto_symbol}${input.network ? ` (${input.network})` : ""} deposit`,
      });
      await supabase.from("activities").insert({
        user_id: uid,
        action: "Deposit submitted",
        detail: `${formatCurrency(input.amount)} via ${input.crypto_symbol}`,
      });
    },
    onSuccess: () => invalidate(["deposits", "transactions", "activities", "wallet"]),
  });
}

export function useCreateWithdrawal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      crypto_symbol: string;
      network: string | null;
      destination_address: string;
    }) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("withdrawals").insert({ ...input, user_id: uid });
      if (error) throw new Error(error.message);
      await supabase.from("transactions").insert({
        user_id: uid,
        type: "Withdrawal",
        direction: "out",
        amount: input.amount,
        status: "pending",
        description: `${input.crypto_symbol} payout request`,
      });
      await supabase.from("activities").insert({
        user_id: uid,
        action: "Withdrawal requested",
        detail: `${formatCurrency(input.amount)} to ${input.crypto_symbol}`,
      });
    },
    onSuccess: () => invalidate(["withdrawals", "transactions", "activities", "wallet"]),
  });
}

export function planMultiplier(plan: Plan) {
  const periods =
    plan.roi_period === "daily"
      ? plan.duration_days
      : plan.roi_period === "weekly"
        ? plan.duration_days / 7
        : plan.duration_days / 30;
  return (Number(plan.roi_percent) / 100) * periods;
}

export function useCreateInvestment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ plan, amount }: { plan: Plan; amount: number }) => {
      const uid = await currentUserId();
      const expected = amount * planMultiplier(plan);
      const ends = new Date(Date.now() + plan.duration_days * 86400000).toISOString();
      const { error } = await supabase.from("investments").insert({
        user_id: uid,
        plan_id: plan.id,
        plan_name: plan.name,
        amount,
        expected_profit: Number(expected.toFixed(2)),
        ends_at: ends,
      });
      if (error) throw new Error(error.message);
      await supabase.from("transactions").insert({
        user_id: uid,
        type: "Investment",
        direction: "out",
        amount,
        status: "completed",
        description: `Subscribed to ${plan.name}`,
      });
      await supabase.from("activities").insert({
        user_id: uid,
        action: "Investment started",
        detail: `${formatCurrency(amount)} into ${plan.name}`,
      });
    },
    onSuccess: () => invalidate(["investments", "transactions", "activities", "wallet"]),
  });
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const uid = await currentUserId();
      let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", uid);
      if (ids?.length) q = q.in("id", ids);
      const { error } = await q;
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["notifications"]),
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (patch: Partial<Pick<Profile, "full_name" | "phone" | "country" | "avatar_url">>) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", uid);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["profile"]),
  });
}

/* ---------------- Derived dashboard data ---------------- */

export function buildPortfolioSeries(transactions: Transaction[], portfolioValue: number) {
  const months = Array.from({ length: 8 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (7 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, month: d.toLocaleString("en-US", { month: "short" }) };
  });
  let running = 0;
  const netByMonth = new Map<string, number>();
  for (const t of transactions) {
    const d = new Date(t.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const signed = t.direction === "in" ? Number(t.amount) : -Number(t.amount);
    netByMonth.set(key, (netByMonth.get(key) ?? 0) + signed);
  }
  const series = months.map((m) => {
    running += netByMonth.get(m.key) ?? 0;
    return { month: m.month, value: Math.max(running, 0) };
  });
  if (series.length) series[series.length - 1].value = portfolioValue;
  return series;
}

const ALLOCATION_COLORS = [
  "var(--color-royal)",
  "oklch(0.78 0.11 240)",
  "oklch(0.86 0.07 235)",
  "oklch(0.92 0.04 232)",
  "oklch(0.70 0.14 200)",
];

export function buildAllocation(investments: Investment[]) {
  const map = new Map<string, number>();
  for (const inv of investments) {
    if (inv.status !== "active") continue;
    map.set(inv.plan_name ?? "Plan", (map.get(inv.plan_name ?? "Plan") ?? 0) + Number(inv.amount));
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  return [...map.entries()].map(([name, value], i) => ({
    name,
    value: Math.round((value / total) * 100),
    color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
  }));
}

export function buildPerformance(investments: Investment[]) {
  return investments.slice(0, 6).map((inv) => ({
    label: (inv.plan_name ?? "Plan").split(" ")[0],
    invested: Number(inv.amount),
    profit: Number(inv.profit_earned),
  }));
}

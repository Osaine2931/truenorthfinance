import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase, unwrap, useInvalidate, type Plan, type Investment } from "./client";
import { currentUserId } from "./auth";
import { formatCurrency } from "./format";

export type InvestmentStatus = "active" | "completed" | "cancelled" | "frozen";

export function usePlans(activeOnly = true) {
  return useQuery({
    queryKey: ["plans", activeOnly],
    queryFn: async () => {
      let q = supabase
        .from("investment_plans")
        .select("*")
        .order("min_amount", { ascending: true });
      if (activeOnly) q = q.eq("is_active", true);
      return unwrap<Plan[]>(await q);
    },
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

/**
 * Investment creation runs entirely inside the `create_investment` database
 * transaction: plan validity, min/max amount, the $1,000 deposit requirement,
 * balance check, wallet debit, investment, transaction, activity and
 * notification all succeed or roll back together. Nothing here is trusted from
 * the browser — the RPC resolves the user from the Supabase session.
 */
export function useCreateInvestment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ plan, amount }: { plan: Plan; amount: number; paymentMethod?: string }) => {
      const { data, error } = await supabase.rpc("create_investment", {
        p_plan_id: plan.id,
        p_amount: amount,
      });
      if (error) throw new Error(error.message.replace(/^.*?:\s*/, ""));
      return data as unknown as Investment;
    },
    onSuccess: () =>
      invalidate(["investments", "transactions", "activities", "wallet", "notifications"]),
  });
}

/**
 * Investment maturity is processed by the scheduled job at
 * `/api/public/cron` (see src/lib/automation.ts) — never by the browser.
 * This helper only refreshes the caller's view of their investments.
 */
export async function updateInvestmentProgress() {
  const { error } = await supabase
    .from("investments")
    .select("id")
    .eq("status", "active")
    .limit(1);
  if (error) throw new Error(error.message);
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

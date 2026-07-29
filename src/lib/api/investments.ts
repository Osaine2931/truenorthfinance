import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase, currentUserId, unwrap, useInvalidate, type Plan, type Investment } from "./client";
import { formatCurrency } from "./format";

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

export function useInvestments() {
  return useQuery({
    queryKey: ["investments"],
    queryFn: async () =>
      unwrap<Investment[]>(
        await supabase.from("investments").select("*").order("created_at", { ascending: false }),
      ),
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

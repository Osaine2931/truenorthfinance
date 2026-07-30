import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase, unwrap, useInvalidate, type Plan, type Investment } from "./client";
import { currentUserId } from "./auth";
import { formatCurrency } from "./format";

export type InvestmentStatus = "active" | "completed" | "cancelled" | "frozen";

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

export function useCreateInvestment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ plan, amount, paymentMethod }: { plan: Plan; amount: number; paymentMethod?: string }) => {
      const uid = await currentUserId();
      const expected = amount * planMultiplier(plan);
      const startedAt = new Date().toISOString();
      const endsAt = new Date(Date.now() + plan.duration_days * 86400000).toISOString();

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (walletError) throw new Error(walletError.message);
      if (!wallet) throw new Error("Wallet not found");

      const availableBalance = Number(wallet.available_balance ?? 0);
      const minimumRequired = Number(plan.min_amount ?? 0);
      const maximumAllowed = Number(plan.max_amount ?? 0);

      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid investment amount");
      if (amount < minimumRequired) throw new Error(`Minimum investment is ${formatCurrency(minimumRequired, 0)}`);
      if (maximumAllowed > 0 && amount > maximumAllowed) {
        throw new Error(`Maximum investment is ${formatCurrency(maximumAllowed, 0)}`);
      }
      if (!wallet.has_deposited) {
        throw new Error("Complete your first deposit of at least $1,000 to unlock investing.");
      }
      if (availableBalance < amount) {
        throw new Error(`Your available balance is ${formatCurrency(availableBalance, 0)}. Add funds to cover ${formatCurrency(amount, 0)} before investing.`);
      }
      const nextAvailable = availableBalance - amount;
      const nextBalance = Math.max(nextAvailable, 0);

      const { data: investment, error: investmentError } = await supabase
        .from("investments")
        .insert({
          user_id: uid,
          plan_id: plan.id,
          plan_name: plan.name,
          amount,
          expected_profit: Number(expected.toFixed(2)),
          profit_earned: 0,
          started_at: startedAt,
          ends_at: endsAt,
          status: "active",
        })
        .select()
        .single();
      if (investmentError) throw new Error(investmentError.message);

      const { error: walletErrorUpdate } = await supabase
        .from("wallets")
        .update({ available_balance: nextBalance, total_deposited: Number(wallet.total_deposited ?? 0) })
        .eq("user_id", uid);
      if (walletErrorUpdate) throw new Error(walletErrorUpdate.message);

      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: uid,
        type: "Investment purchase",
        direction: "out",
        amount,
        status: "completed",
        description: `Purchased ${plan.name} for ${formatCurrency(amount)}`,
      });
      if (transactionError) throw new Error(transactionError.message);

      await supabase.from("activities").insert({
        user_id: uid,
        action: "Investment purchased",
        detail: `${formatCurrency(amount)} invested in ${plan.name}`,
      });

      await supabase.from("notifications").insert({
        user_id: uid,
        title: "Investment purchased",
        body: `Your ${plan.name} investment was added to your portfolio.`,
        kind: "success",
      });

      return investment;
    },
    onSuccess: () => invalidate(["investments", "transactions", "activities", "wallet", "notifications"]),
  });
}

export async function updateInvestmentProgress() {
  const { data: investments, error } = await supabase.from("investments").select("*").eq("status", "active");
  if (error) throw new Error(error.message);

  for (const investment of investments ?? []) {
    const ended = investment.ends_at ? new Date(investment.ends_at).getTime() <= Date.now() : false;
    if (ended) {
      await supabase.from("investments").update({ status: "completed", profit_earned: investment.expected_profit }).eq("id", investment.id);
      await supabase.from("notifications").insert({
        user_id: investment.user_id,
        title: "Investment completed",
        body: `${investment.plan_name ?? "Your investment"} has matured and is now completed.`,
        kind: "success",
      });
    }
  }
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


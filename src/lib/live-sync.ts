import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useLiveDataSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = (keys: string[]) => {
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
    };

    const refresh = () => {
      invalidate([
        "wallet",
        "transactions",
        "activities",
        "investments",
        "notifications",
        "deposits",
        "withdrawals",
        "profile",
        "referrals",
        "kyc",
      ]);
    };

    const interval = window.setInterval(refresh, 15000);

    const channel = supabase.channel("tn-live-sync");
    channel.on("postgres_changes", { event: "*", schema: "public", table: "wallets" }, refresh);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "deposits" }, refresh);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, refresh);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "investments" }, refresh);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions" },
      refresh,
    );
    channel.on("postgres_changes", { event: "*", schema: "public", table: "activities" }, refresh);
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications" },
      refresh,
    );
    void channel.subscribe();

    return () => {
      window.clearInterval(interval);
      void channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

export function useInvestmentAutomation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    async function runAutomation() {
      const { data: investments, error } = await supabase
        .from("investments")
        .select("*")
        .eq("status", "active");
      if (error) return;

      for (const investment of investments ?? []) {
        const start = new Date(investment.started_at).getTime();
        const end = investment.ends_at
          ? new Date(investment.ends_at).getTime()
          : start + 86400000 * 30;
        const total = Math.max(1, end - start);
        const elapsed = Math.min(total, Date.now() - start);
        const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
        const expectedProfit = Number(investment.expected_profit ?? 0);
        const currentProfit = Number((expectedProfit * (progress / 100)).toFixed(2));
        const matured = Date.now() >= end;

        if (matured) {
          const { data: wallet } = await supabase
            .from("wallets")
            .select("*")
            .eq("user_id", investment.user_id)
            .maybeSingle();
          if (wallet) {
            const nextAvailable = Number(wallet.available_balance ?? 0) + expectedProfit;
            const nextTotalProfit = Number(wallet.total_profit ?? 0) + expectedProfit;
            await supabase
              .from("wallets")
              .update({ available_balance: nextAvailable, total_profit: nextTotalProfit })
              .eq("user_id", investment.user_id);
          }

          await supabase
            .from("investments")
            .update({ status: "completed", profit_earned: expectedProfit })
            .eq("id", investment.id);

          await supabase.from("transactions").insert({
            user_id: investment.user_id,
            type: "Investment completed",
            direction: "in",
            amount: expectedProfit,
            status: "completed",
            description: `${investment.plan_name ?? "Investment"} matured and paid out`,
          });

          await supabase.from("activities").insert({
            user_id: investment.user_id,
            action: "Investment completed",
            detail: `${investment.plan_name ?? "Investment"} reached maturity`,
          });

          await supabase.from("notifications").insert({
            user_id: investment.user_id,
            title: "Investment completed",
            body: `Your ${investment.plan_name ?? "investment"} has matured and profits were credited.`,
            kind: "success",
          });
        } else {
          await supabase
            .from("investments")
            .update({ profit_earned: currentProfit })
            .eq("id", investment.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }

    void runAutomation();
    const interval = window.setInterval(() => {
      void runAutomation();
    }, 45000);

    return () => window.clearInterval(interval);
  }, [queryClient]);
}

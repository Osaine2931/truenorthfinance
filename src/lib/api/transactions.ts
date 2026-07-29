import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { unwrap, type Transaction, type Activity, type Investment } from "./client";

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

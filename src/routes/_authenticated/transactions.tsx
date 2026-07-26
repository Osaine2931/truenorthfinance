import { createFileRoute } from "@tanstack/react-router";
import { recentTransactions, formatCurrency } from "@/lib/mock-data";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — TrueNorth Financial" }] }),
  component: Transactions,
});

function Transactions() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Full history of deposits, withdrawals, and returns.</p>
      </div>
      <div className="surface-card overflow-hidden">
        {recentTransactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between border-b border-border p-5 last:border-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-full border border-border bg-background ${
                  t.direction === "in" ? "text-success" : "text-navy"
                }`}
              >
                {t.direction === "in" ? (
                  <ArrowDownLeft className="size-4" />
                ) : (
                  <ArrowUpRight className="size-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{t.type}</p>
                <p className="text-xs text-muted-foreground">{t.date}</p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`font-semibold ${
                  t.direction === "in" ? "text-success" : "text-foreground"
                }`}
              >
                {t.direction === "in" ? "+" : "-"}
                {formatCurrency(t.amount)}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Completed</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

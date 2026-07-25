import { createFileRoute, Link } from "@tanstack/react-router";
import { formatCurrency, kpis } from "@/lib/mock-data";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Aurelian" }] }),
  component: Wallet,
});

function Wallet() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your available balance and payouts.</p>
      </div>
      <div className="glass-navy relative overflow-hidden rounded-2xl p-6 shadow-elevated">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Available balance
          </p>
          <p className="mt-2 font-display text-5xl font-semibold text-white">
            {formatCurrency(kpis.availableBalance)}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/deposit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-navy hover:opacity-90"
            >
              <ArrowDownToLine className="size-4" /> Deposit
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
            >
              <ArrowUpFromLine className="size-4" /> Withdraw
            </Link>
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Pending deposits</p>
          <p className="mt-1 font-display text-2xl font-semibold text-navy">{formatCurrency(0)}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Pending withdrawals</p>
          <p className="mt-1 font-display text-2xl font-semibold text-navy">{formatCurrency(0)}</p>
        </div>
        <div className="surface-card p-5">
          <p className="text-xs text-muted-foreground">Lifetime returns</p>
          <p className="mt-1 font-display text-2xl font-semibold text-success">
            +{formatCurrency(kpis.totalProfit)}
          </p>
        </div>
      </div>
    </div>
  );
}

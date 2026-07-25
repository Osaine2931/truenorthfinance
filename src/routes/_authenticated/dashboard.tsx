import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioChart, DistributionChart } from "@/components/charts";
import {
  kpis,
  activeInvestments,
  recentTransactions,
  distribution,
  formatCurrency,
  formatCompact,
} from "@/lib/mock-data";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Wallet as WalletIcon,
  Briefcase,
  Users,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Aurelian" },
      { name: "description", content: "Your investment portfolio at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome back — here's your portfolio today.</p>
      </div>

      {/* KPI grid — hero card + 5 secondary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="glass-navy relative overflow-hidden rounded-2xl p-6 shadow-elevated lg:col-span-2 lg:row-span-2">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-gold/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                Total Portfolio
              </span>
              <span className="size-1.5 animate-pulse rounded-full bg-gold" />
            </div>
            <h2 className="mt-2 font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">
              {formatCurrency(kpis.totalPortfolio)}
            </h2>
            <p className="mt-2 text-sm text-white/60">
              <span className="text-gold">+14.2% YTD</span> · +{formatCompact(kpis.totalProfit)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Invested</p>
                <p className="mt-1 text-sm font-medium text-white">{formatCompact(kpis.totalInvested)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Profit</p>
                <p className="mt-1 text-sm font-medium text-success">
                  +{formatCompact(kpis.totalProfit)}
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Link
                to="/deposit"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-medium text-navy hover:opacity-90"
              >
                <Plus className="size-3.5" /> Deposit
              </Link>
              <Link
                to="/invest"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-medium text-white hover:bg-white/10"
              >
                Invest
              </Link>
            </div>
          </div>
        </div>

        <MiniKpi label="Available" value={formatCurrency(kpis.availableBalance)} icon={WalletIcon} />
        <MiniKpi label="Total Invested" value={formatCompact(kpis.totalInvested)} icon={Briefcase} />
        <MiniKpi
          label="Total Profit"
          value={`+${formatCompact(kpis.totalProfit)}`}
          icon={TrendingUp}
          accent="success"
        />
        <MiniKpi label="Active Plans" value={String(kpis.activePlans).padStart(2, "0")} icon={Briefcase} />
        <MiniKpi
          label="Referral Earnings"
          value={formatCurrency(kpis.referralEarnings)}
          icon={Users}
          accent="gold"
        />
        <MiniKpi label="Balance" value={formatCurrency(kpis.availableBalance)} icon={WalletIcon} />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold text-navy">Portfolio Performance</h3>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
            <span className="rounded-md bg-royal-soft px-2 py-1 text-xs font-medium text-royal">
              +14.2%
            </span>
          </div>
          <div className="h-64">
            <PortfolioChart />
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-semibold text-navy">Distribution</h3>
          <p className="text-xs text-muted-foreground">Investment allocation</p>
          <div className="relative mx-auto mt-3 h-40">
            <DistributionChart />
          </div>
          <div className="mt-4 space-y-2">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-muted-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active plans + Transactions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">Active Investments</h3>
            <Link to="/my-investments" className="text-xs font-medium text-royal">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activeInvestments.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{inv.plan}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(inv.amount)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      inv.status === "Premium"
                        ? "bg-gold-soft text-gold ring-1 ring-gold/20"
                        : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>Progress</span>
                    <span>{inv.progress}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${inv.progress}%`,
                        background: inv.status === "Premium" ? "var(--color-gold)" : "var(--color-royal)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs font-medium text-royal">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-full border border-border bg-background ${
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
                    <p className="truncate text-sm font-medium text-foreground">{t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-semibold ${
                    t.direction === "in" ? "text-success" : "text-foreground"
                  }`}
                >
                  {t.direction === "in" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKpi({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon: typeof WalletIcon;
  accent?: "gold" | "success";
}) {
  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div
          className={`grid size-7 place-items-center rounded-md ${
            accent === "gold" ? "bg-gold-soft text-gold" : accent === "success" ? "bg-emerald-50 text-success" : "bg-royal-soft text-royal"
          }`}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <p
        className={`font-display text-2xl font-semibold ${
          accent === "success" ? "text-success" : accent === "gold" ? "text-gold" : "text-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

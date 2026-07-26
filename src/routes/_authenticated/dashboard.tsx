import { createFileRoute, Link } from "@tanstack/react-router";
import { PortfolioChart, DistributionChart, PerformanceChart } from "@/components/charts";
import {
  kpis,
  activeInvestments,
  recentTransactions,
  recentActivities,
  notifications,
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
  ArrowUpFromLine,
  Bell,
  Activity,
  PieChart as PieIcon,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrueNorth Financial" },
      { name: "description", content: "Your TrueNorth Financial investment portfolio at a glance." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { to: "/deposit", label: "Deposit", icon: Plus },
  { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/referrals", label: "Refer", icon: Users },
];

function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-navy sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back — here's your portfolio today.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
          <Sparkles className="size-3.5" /> +14.2% YTD
        </span>
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <div className="glass-blue relative overflow-hidden rounded-3xl p-6 shadow-elevated lg:col-span-2 lg:row-span-2">
          <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                Portfolio Value
              </span>
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
            </div>
            <h2 className="mt-2 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
              {formatCurrency(kpis.totalPortfolio)}
            </h2>
            <p className="mt-2 text-sm text-white/80">
              +14.2% YTD · +{formatCompact(kpis.totalProfit)}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/70">Invested</p>
                <p className="mt-1 text-sm font-semibold text-white">{formatCompact(kpis.totalInvested)}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/70">Profit</p>
                <p className="mt-1 text-sm font-semibold text-white">+{formatCompact(kpis.totalProfit)}</p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Link
                to="/deposit"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-royal transition-transform hover:-translate-y-0.5"
              >
                <Plus className="size-3.5" /> Deposit
              </Link>
              <Link
                to="/invest"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/40 bg-white/10 px-3 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
              >
                Invest
              </Link>
            </div>
          </div>
        </div>

        <MiniKpi label="Total Invested" value={formatCompact(kpis.totalInvested)} icon={Briefcase} />
        <MiniKpi label="Available Balance" value={formatCurrency(kpis.availableBalance)} icon={WalletIcon} />
        <MiniKpi
          label="Total Profit"
          value={`+${formatCompact(kpis.totalProfit)}`}
          icon={TrendingUp}
          accent="success"
        />
        <MiniKpi label="Active Plans" value={String(kpis.activePlans).padStart(2, "0")} icon={PieIcon} />
        <MiniKpi
          label="Referral Earnings"
          value={formatCurrency(kpis.referralEarnings)}
          icon={Users}
          accent="royal"
        />
        <MiniKpi label="Wallet" value={formatCurrency(kpis.availableBalance)} icon={WalletIcon} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="hover-lift surface-card flex items-center gap-3 p-4"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-royal-soft text-royal">
              <a.icon className="size-4" />
            </span>
            <span className="truncate text-sm font-semibold text-navy">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-navy">Portfolio Growth</h3>
              <p className="text-xs text-muted-foreground">Last 12 months</p>
            </div>
            <span className="shrink-0 rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-royal">
              +14.2%
            </span>
          </div>
          <div className="h-64">
            <PortfolioChart />
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-semibold text-navy">Investment Allocation</h3>
          <p className="text-xs text-muted-foreground">By strategy</p>
          <div className="relative mx-auto mt-3 h-40">
            <DistributionChart />
          </div>
          <div className="mt-4 space-y-2">
            {distribution.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
                  <span className="truncate text-foreground">{d.name}</span>
                </div>
                <span className="shrink-0 font-semibold text-muted-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance + Notifications */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-navy">Investment Performance</h3>
              <p className="text-xs text-muted-foreground">Monthly net return</p>
            </div>
            <span className="shrink-0 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              Avg 4.1%
            </span>
          </div>
          <div className="h-56">
            <PerformanceChart />
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">Notifications</h3>
            <Link to="/notifications" className="text-xs font-semibold text-royal">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex gap-3 rounded-2xl border border-border p-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-royal-soft text-royal">
                  <Bell className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active plans + Transactions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold text-navy">Active Investment Plans</h3>
            <Link to="/my-investments" className="text-xs font-semibold text-royal">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {activeInvestments.map((inv) => (
              <div key={inv.id} className="rounded-2xl border border-border p-3 transition-colors hover:border-royal/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{inv.plan}</p>
                    <p className="text-xs text-muted-foreground">{formatCurrency(inv.amount)}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      inv.status === "Premium"
                        ? "bg-royal-soft text-royal"
                        : "bg-success/10 text-success"
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
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${inv.progress}%`,
                        background: "var(--color-royal)",
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
            <Link to="/transactions" className="text-xs font-semibold text-royal">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentTransactions.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`grid size-9 shrink-0 place-items-center rounded-full ${
                      t.direction === "in" ? "bg-success/10 text-success" : "bg-royal-soft text-royal"
                    }`}
                  >
                    {t.direction === "in" ? (
                      <ArrowDownLeft className="size-4" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{t.type}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                </div>
                <p
                  className={`shrink-0 text-sm font-bold ${
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

      {/* Recent activities */}
      <div className="surface-card p-5">
        <h3 className="font-display text-lg font-semibold text-navy">Recent Activities</h3>
        <div className="mt-4 space-y-4">
          {recentActivities.map((a) => (
            <div key={a.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-royal-soft text-royal">
                  <Activity className="size-3.5" />
                </span>
                <span className="mt-1 w-px flex-1 bg-border last:hidden" />
              </div>
              <div className="min-w-0 pb-1">
                <p className="truncate text-sm font-semibold text-navy">{a.title}</p>
                <p className="truncate text-xs text-muted-foreground">{a.meta}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{a.time}</p>
              </div>
            </div>
          ))}
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
  accent?: "royal" | "success";
}) {
  return (
    <div className="hover-lift surface-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div
          className={`grid size-8 shrink-0 place-items-center rounded-xl ${
            accent === "success" ? "bg-success/10 text-success" : "bg-royal-soft text-royal"
          }`}
        >
          <Icon className="size-3.5" />
        </div>
      </div>
      <p
        className={`font-display text-2xl font-bold ${
          accent === "success" ? "text-success" : "text-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

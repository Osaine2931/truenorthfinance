import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Wallet as WalletIcon,
  TrendingUp,
  PiggyBank,
  Gift,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Bell,
  Activity as ActivityIcon,
  Receipt,
  BadgeDollarSign,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  useWallet,
  useInvestments,
  useTransactions,
  useActivities,
  useNotifications,
  formatCurrency,
  formatDateTime,
  buildPortfolioSeries,
  buildAllocation,
  buildPerformance,
  BONUS_NOTICE,
} from "@/lib/api";
import { PortfolioChart, PerformanceChart, AllocationChart } from "@/components/charts";
import { PageHeader, SectionCard, StatCard, StatusPill, EmptyState, RowsSkeleton } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — TrueNorth Financial" },
      { name: "description", content: "Track portfolio value, investments, profit and activity in real time." },
    ],
  }),
  component: Dashboard,
});

const quickActions = [
  { to: "/deposit", label: "Deposit", icon: ArrowDownToLine },
  { to: "/invest", label: "Invest", icon: TrendingUp },
  { to: "/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
  { to: "/referrals", label: "Refer", icon: Users },
] as const;

function Dashboard() {
  const wallet = useWallet();
  const investments = useInvestments();
  const transactions = useTransactions();
  const activities = useActivities(6);
  const notifications = useNotifications(5);

  const w = wallet.data;
  const activeInvestments = (investments.data ?? []).filter((i) => i.status === "active");
  const investedNow = activeInvestments.reduce((sum, i) => sum + Number(i.amount), 0);
  const portfolioValue =
    Number(w?.available_balance ?? 0) +
    Number(w?.welcome_bonus ?? 0) +
    investedNow +
    Number(w?.total_profit ?? 0);

  const series = buildPortfolioSeries(transactions.data ?? [], portfolioValue);
  const allocation = buildAllocation(investments.data ?? []);
  const performance = buildPerformance(activeInvestments);
  const recentTx = (transactions.data ?? []).slice(0, 6);
  const unlocked = Boolean(w?.has_deposited);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="A live view of your wealth with TrueNorth Financial."
        action={
          <Link to="/deposit" className="hidden rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white sm:inline-flex">
            Fund account
          </Link>
        }
      />

      {!unlocked && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning">
            <Lock className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm text-foreground">{BONUS_NOTICE}</p>
          <Link to="/deposit" className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white">
            Deposit now
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Portfolio value"
          value={formatCurrency(portfolioValue)}
          icon={BadgeDollarSign}
          tone="primary"
          loading={wallet.isLoading}
        />
        <StatCard
          label="Total deposited"
          value={formatCurrency(w?.total_deposited)}
          icon={ArrowDownToLine}
          loading={wallet.isLoading}
        />
        <StatCard
          label="Total invested"
          value={formatCurrency(investedNow)}
          icon={PiggyBank}
          loading={investments.isLoading}
        />
        <StatCard
          label="Available balance"
          value={formatCurrency(w?.available_balance)}
          icon={WalletIcon}
          hint={`+ ${formatCurrency(w?.welcome_bonus)} welcome bonus (locked)`}
          loading={wallet.isLoading}
        />
        <StatCard
          label="Total profit"
          value={formatCurrency(w?.total_profit)}
          icon={TrendingUp}
          tone="success"
          loading={wallet.isLoading}
        />
        <StatCard
          label="Referral earnings"
          value={formatCurrency(w?.referral_earnings)}
          icon={Gift}
          loading={wallet.isLoading}
        />
        <StatCard
          label="Active plans"
          value={String(activeInvestments.length)}
          icon={Layers}
          loading={investments.isLoading}
        />
        <StatCard
          label="Welcome bonus"
          value={formatCurrency(w?.welcome_bonus)}
          icon={Gift}
          hint="Promotional · not withdrawable"
          loading={wallet.isLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="hover-lift surface-card flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-royal-soft text-royal">
              <a.icon className="size-4" />
            </span>
            <span className="text-xs font-semibold text-navy">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Portfolio growth" description="Last 8 months" className="lg:col-span-2">
          <div className="h-64 sm:h-72">
            <PortfolioChart data={series} />
          </div>
        </SectionCard>
        <SectionCard title="Asset allocation" description="By active plan">
          {allocation.length ? (
            <>
              <div className="h-44">
                <AllocationChart data={allocation} />
              </div>
              <ul className="mt-3 space-y-2">
                {allocation.map((a) => (
                  <li key={a.name} className="flex items-center gap-2 text-xs">
                    <span className="size-2.5 rounded-full" style={{ background: a.color }} />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{a.name}</span>
                    <span className="font-semibold text-navy">{a.value}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <EmptyState icon={Layers} title="No allocation yet" description="Start a plan to see your mix." />
          )}
        </SectionCard>
      </div>

      <SectionCard title="Investment performance" description="Capital vs. profit per active plan">
        {performance.length ? (
          <div className="h-64">
            <PerformanceChart data={performance} />
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="No active investments"
            description="Your performance chart appears once you fund a plan."
          />
        )}
      </SectionCard>

      {/* Lists */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard
          title="Recent transactions"
          className="lg:col-span-2"
          bodyClassName="p-0"
          action={
            <Link to="/transactions" className="inline-flex items-center gap-1 text-xs font-semibold text-royal">
              View all <ArrowRight className="size-3" />
            </Link>
          }
        >
          {transactions.isLoading ? (
            <div className="p-5">
              <RowsSkeleton />
            </div>
          ) : recentTx.length ? (
            <ul>
              {recentTx.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                        t.direction === "in" ? "bg-success/10 text-success" : "bg-royal-soft text-royal"
                      }`}
                    >
                      {t.direction === "in" ? (
                        <ArrowDownToLine className="size-4" />
                      ) : (
                        <ArrowUpFromLine className="size-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-navy">{t.type}</p>
                      <p className="truncate text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.direction === "in" ? "text-success" : "text-navy"}`}>
                      {t.direction === "in" ? "+" : "−"}
                      {formatCurrency(t.amount)}
                    </p>
                    <StatusPill status={t.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Receipt} title="No transactions yet" description="Your ledger will appear here." />
          )}
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Notifications" bodyClassName="p-0">
            {notifications.data?.length ? (
              <ul>
                {notifications.data.map((n) => (
                  <li key={n.id} className="border-b border-border/60 px-5 py-3.5 last:border-0">
                    <div className="flex items-start gap-2">
                      <Bell className="mt-0.5 size-3.5 shrink-0 text-royal" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-navy">{n.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Bell} title="All caught up" />
            )}
          </SectionCard>

          <SectionCard title="Recent activity" bodyClassName="p-0">
            {activities.data?.length ? (
              <ul>
                {activities.data.map((a) => (
                  <li key={a.id} className="flex items-start gap-2 border-b border-border/60 px-5 py-3 last:border-0">
                    <ActivityIcon className="mt-0.5 size-3.5 shrink-0 text-royal" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-navy">{a.action}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.detail} · {formatDateTime(a.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={ActivityIcon} title="No activity yet" />
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

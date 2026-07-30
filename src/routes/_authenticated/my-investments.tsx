import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, TrendingUp, Clock3, Sparkles, CalendarRange } from "lucide-react";
import { useInvestments, formatCurrency, formatDate } from "@/lib/api";
import {
  PageHeader,
  SectionCard,
  StatusPill,
  EmptyState,
  RowsSkeleton,
  btnPrimary,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/my-investments")({
  head: () => ({
    meta: [
      { title: "My Investments — TrueNorth Financial" },
      { name: "description", content: "Track your active plans, capital and projected profits." },
    ],
  }),
  component: MyInvestments,
});

function MyInvestments() {
  const investments = useInvestments();
  const rows = investments.data ?? [];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="My Investments"
        subtitle="Your active and completed mandates."
        action={
          <Link to="/invest" className={btnPrimary}>
            <TrendingUp className="size-4" /> New investment
          </Link>
        }
      />

      {investments.isLoading ? (
        <SectionCard>
          <RowsSkeleton rows={3} />
        </SectionCard>
      ) : rows.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((inv) => {
            const start = new Date(inv.started_at).getTime();
            const end = inv.ends_at ? new Date(inv.ends_at).getTime() : start + 86400000 * 30;
            const total = Math.max(1, end - start);
            const elapsed = Math.min(total, Date.now() - start);
            const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
            const remainingMs = Math.max(0, end - Date.now());
            const daysRemaining = Math.max(0, Math.ceil(remainingMs / 86400000));
            const hoursRemaining = Math.max(0, Math.ceil(remainingMs / 3600000));
            const maturityValue = Number(inv.amount) + Number(inv.expected_profit);
            const isActive = inv.status === "active";
            const profit = Number(inv.profit_earned ?? 0);
            const progressPercent = Math.max(0, Math.min(100, progress));
            return (
              <article key={inv.id} className="hover-lift surface-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy">
                      {inv.plan_name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(inv.started_at)} → {formatDate(inv.ends_at)}
                    </p>
                  </div>
                  <StatusPill status={inv.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">Capital</p>
                    <p className="font-semibold text-navy">{formatCurrency(inv.amount, 0)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">Earned</p>
                    <p className="font-semibold text-success">
                      {formatCurrency(inv.profit_earned, 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">Expected</p>
                    <p className="font-semibold text-navy">
                      {formatCurrency(inv.expected_profit, 0)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-border/70 bg-secondary/60 p-3">
                  <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-3" /> Live progress
                    </span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full bg-royal transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded-xl bg-card p-2.5">
                      <p className="text-muted-foreground">Days remaining</p>
                      <p className="font-semibold text-navy">{daysRemaining}</p>
                    </div>
                    <div className="rounded-xl bg-card p-2.5">
                      <p className="text-muted-foreground">Time remaining</p>
                      <p className="font-semibold text-navy">{hoursRemaining}h</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="size-3" /> Maturity {formatDate(inv.ends_at)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="size-3" /> {isActive ? "Active" : inv.status}
                  </span>
                </div>
                <div className="mt-3 rounded-xl bg-royal-soft p-3 text-sm text-navy">
                  <div className="flex items-center justify-between gap-2">
                    <span>Current profit</span>
                    <span className="font-semibold">{formatCurrency(profit, 0)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span>Estimated maturity value</span>
                    <span className="font-semibold">{formatCurrency(maturityValue, 0)}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <SectionCard>
          <EmptyState
            icon={Briefcase}
            title="No investments yet"
            description="Deposit at least $1,000 and choose a plan to begin compounding."
            action={
              <Link to="/invest" className={btnPrimary}>
                Explore plans
              </Link>
            }
          />
        </SectionCard>
      )}
    </div>
  );
}

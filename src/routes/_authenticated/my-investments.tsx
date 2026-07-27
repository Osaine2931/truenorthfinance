import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, TrendingUp } from "lucide-react";
import { useInvestments, formatCurrency, formatDate } from "@/lib/api";
import { PageHeader, SectionCard, StatusPill, EmptyState, RowsSkeleton, btnPrimary } from "@/components/ui-kit";

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
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((inv) => {
            const progress = inv.ends_at
              ? Math.min(
                  100,
                  Math.max(
                    0,
                    ((Date.now() - new Date(inv.started_at).getTime()) /
                      (new Date(inv.ends_at).getTime() - new Date(inv.started_at).getTime())) *
                      100,
                  ),
                )
              : 0;
            return (
              <article key={inv.id} className="hover-lift surface-card rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-navy">{inv.plan_name}</h3>
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
                    <p className="font-semibold text-success">{formatCurrency(inv.profit_earned, 0)}</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-muted-foreground">Expected</p>
                    <p className="font-semibold text-navy">{formatCurrency(inv.expected_profit, 0)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full rounded-full bg-royal transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted-foreground">{Math.round(progress)}% of term elapsed</p>
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

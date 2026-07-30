import { createFileRoute, Link } from "@tanstack/react-router";
import { Gift, Trophy, Star, Lock } from "lucide-react";
import { useWallet, useInvestments, formatCurrency } from "@/lib/api";
import { PageHeader, SectionCard, StatCard } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — TrueNorth Financial" },
      {
        name: "description",
        content: "Loyalty tiers, welcome bonus and milestone rewards for long-term investors.",
      },
    ],
  }),
  component: Rewards,
});

const tiers = [
  { name: "Explorer", threshold: 0, perk: "Welcome bonus + market briefings" },
  { name: "Builder", threshold: 10000, perk: "Priority deposit confirmation" },
  { name: "Strategist", threshold: 50000, perk: "Reduced payout fees + advisor calls" },
  { name: "Private Client", threshold: 250000, perk: "Dedicated wealth manager" },
];

function Rewards() {
  const wallet = useWallet();
  const investments = useInvestments();
  const deposited = Number(wallet.data?.total_deposited ?? 0);
  const current = [...tiers].reverse().find((t) => deposited >= t.threshold) ?? tiers[0];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Rewards" subtitle="Loyalty benefits that grow with your portfolio." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Welcome bonus"
          value={formatCurrency(wallet.data?.welcome_bonus)}
          icon={Gift}
          tone="primary"
        />
        <StatCard label="Current tier" value={current.name} icon={Trophy} />
        <StatCard
          label="Active plans"
          value={String((investments.data ?? []).filter((i) => i.status === "active").length)}
          icon={Star}
        />
      </div>

      <SectionCard title="Loyalty tiers" bodyClassName="p-0">
        <ul>
          {tiers.map((t) => {
            const unlocked = deposited >= t.threshold;
            return (
              <li
                key={t.name}
                className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      unlocked ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {unlocked ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-navy">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.perk}</p>
                  </div>
                </div>
                <p className="shrink-0 text-xs font-semibold text-muted-foreground">
                  {formatCurrency(t.threshold, 0)}+
                </p>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Welcome bonus terms">
        <p className="text-sm text-muted-foreground">
          Your $1,000 Welcome Bonus is credited automatically at registration. It is promotional: it
          cannot be withdrawn and cannot be used to purchase investment plans.{" "}
          <Link to="/deposit" className="font-semibold text-royal">
            Make a deposit
          </Link>{" "}
          of at least $1,000 to unlock investing.
        </p>
      </SectionCard>
    </div>
  );
}

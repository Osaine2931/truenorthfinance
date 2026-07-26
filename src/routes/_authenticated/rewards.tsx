import { createFileRoute } from "@tanstack/react-router";
import { Gift, Sparkles, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — TrueNorth Financial" }] }),
  component: Rewards,
});

function Rewards() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perks and milestones as your portfolio grows.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Trophy, tier: "Silver", body: "Unlocked at $10k invested — lower fees on new plans.", unlocked: true },
          { icon: Sparkles, tier: "Gold", body: "$100k invested — dedicated relationship manager.", unlocked: true },
          { icon: Gift, tier: "Platinum", body: "$500k invested — invitation-only strategies.", unlocked: false },
        ].map((r) => (
          <div key={r.tier} className={`surface-card p-5 ${r.unlocked ? "" : "opacity-60"}`}>
            <div className={`grid size-10 place-items-center rounded-md ${r.unlocked ? "bg-gold-soft text-gold" : "bg-muted text-muted-foreground"}`}>
              <r.icon className="size-5" />
            </div>
            <h3 className="mt-3 font-display text-xl font-semibold text-navy">{r.tier}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
            <p className="mt-3 text-xs font-medium uppercase tracking-wider">
              {r.unlocked ? <span className="text-success">Unlocked</span> : <span className="text-muted-foreground">Locked</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

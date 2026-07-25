import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { investmentPlans, formatCurrency, type InvestmentPlan } from "@/lib/mock-data";
import { toast } from "sonner";
import { Sparkles, Calculator, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({ meta: [{ title: "Invest — Aurelian" }] }),
  component: Invest,
});

function Invest() {
  const [selected, setSelected] = useState<InvestmentPlan | null>(null);
  const [amount, setAmount] = useState(5000);
  const [years, setYears] = useState(2);

  const midRoi = selected ? averageRoi(selected.roi) : 0.11;
  const projected = amount * Math.pow(1 + midRoi, years);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Invest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Curated long-term strategies. Pick a plan, project your growth, and start.
        </p>
      </div>

      {/* Calculator */}
      <div className="surface-card overflow-hidden">
        <div className="grid gap-6 p-5 md:grid-cols-[1.2fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-md bg-royal-soft text-royal">
                <Calculator className="size-4" />
              </div>
              <h2 className="font-display text-lg font-semibold text-navy">Investment calculator</h2>
            </div>
            <label className="mb-1.5 block text-xs font-medium text-foreground">
              Amount ({formatCurrency(amount)})
            </label>
            <input
              type="range"
              min={1000}
              max={100000}
              step={500}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full accent-royal"
            />
            <label className="mb-1.5 mt-4 block text-xs font-medium text-foreground">
              Duration ({years} {years === 1 ? "year" : "years"})
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full accent-royal"
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Using {selected ? selected.name : "an average portfolio"} ROI of{" "}
              <span className="font-medium text-foreground">{(midRoi * 100).toFixed(1)}%</span> p.a.
            </p>
          </div>
          <div className="glass-navy relative overflow-hidden rounded-xl p-6">
            <div className="absolute -right-10 -top-10 size-32 rounded-full bg-gold/20 blur-3xl" />
            <p className="text-[10px] uppercase tracking-widest text-white/60">Projected value</p>
            <p className="mt-2 font-display text-4xl font-semibold text-white">{formatCurrency(projected)}</p>
            <p className="mt-1 text-sm text-gold">+{formatCurrency(projected - amount)} return</p>
            <div className="gold-hairline mt-4 w-16" />
            <p className="mt-4 text-xs text-white/60">
              Projection is illustrative. Historical performance is not indicative of future returns.
            </p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-navy">Investment plans</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {investmentPlans.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`surface-card group text-left transition ${
                selected?.id === p.id ? "ring-2 ring-royal" : ""
              }`}
            >
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {p.category}
                  </span>
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold ring-1 ring-gold/20">
                      <Sparkles className="size-2.5" /> Featured
                    </span>
                  )}
                </div>
                <h3 className="font-display text-xl font-semibold text-navy">{p.name}</h3>
                <p className="mt-4 flex items-baseline gap-1 text-3xl font-semibold text-royal">
                  {p.roi}
                </p>
                <p className="text-xs text-muted-foreground">Target annualised ROI</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-muted-foreground">Min</p>
                    <p className="font-medium text-foreground">{formatCurrency(p.minAmount)}</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="text-muted-foreground">Term</p>
                    <p className="font-medium text-foreground">{p.duration}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Risk: {p.risk}</p>
              </div>
              <div className="border-t border-border p-3">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.success(`Started subscription to ${p.name}`, {
                      description: "Complete deposit to activate.",
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-md bg-navy py-2 text-xs font-medium text-white group-hover:opacity-90"
                >
                  <TrendingUp className="size-3.5" />
                  Start investment
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function averageRoi(roiRange: string) {
  const nums = roiRange.match(/[\d.]+/g)?.map(Number) ?? [10];
  const avg = nums.length >= 2 ? (nums[0] + nums[1]) / 2 : nums[0];
  return avg / 100;
}

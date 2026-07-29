import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Lock, Calculator, Layers, ShieldCheck, Wallet, CircleDollarSign } from "lucide-react";
import {
  usePlans,
  useWallet,
  useCreateInvestment,
  planMultiplier,
  formatCurrency,
  BONUS_NOTICE,
  type Plan,
} from "@/lib/api";
import {
  PageHeader,
  SectionCard,
  EmptyState,
  RowsSkeleton,
  btnPrimary,
  inputClass,
  Field,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/invest")({
  head: () => ({
    meta: [
      { title: "Invest — TrueNorth Financial" },
      { name: "description", content: "Browse curated long-term investment plans and project your growth." },
    ],
  }),
  component: Invest,
});

const periodLabel: Record<string, string> = { daily: "daily", weekly: "weekly", monthly: "monthly" };

function Invest() {
  const navigate = useNavigate();
  const plans = usePlans();
  const wallet = useWallet();
  const createInvestment = useCreateInvestment();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [amount, setAmount] = useState(1000);

  const unlocked = Boolean(wallet.data?.has_deposited);
  const balance = Number(wallet.data?.available_balance ?? 0);
  const expected = selected ? amount * planMultiplier(selected) : 0;
  const totalReturn = selected ? amount + expected : 0;
  const canAfford = balance >= amount;
  const summary = useMemo(() => {
    if (!selected) return null;
    return [
      { label: "Plan", value: selected.name },
      { label: "ROI", value: `${selected.roi_percent}% ${periodLabel[selected.roi_period]}` },
      { label: "Duration", value: `${selected.duration_days} days` },
      { label: "Estimated profit", value: formatCurrency(expected) },
    ];
  }, [expected, selected]);

  function openPlan(plan: Plan) {
    setSelected(plan);
    setAmount(Number(plan.min_amount));
  }

  async function confirm() {
    if (!selected) return;
    if (amount < Number(selected.min_amount)) {
      toast.error(`Minimum for ${selected.name} is ${formatCurrency(selected.min_amount)}`);
      return;
    }
    if (selected.max_amount && amount > Number(selected.max_amount)) {
      toast.error(`Maximum for ${selected.name} is ${formatCurrency(selected.max_amount)}`);
      return;
    }
    if (!unlocked) {
      toast.error("Investing is locked until your first deposit is confirmed.");
      return;
    }
    if (!canAfford) {
      toast.error("Your available balance is insufficient to purchase this investment.");
      return;
    }
    try {
      await createInvestment.mutateAsync({ plan: selected, amount });
      toast.success(`Investment purchased successfully`, { description: `${formatCurrency(amount)} has been transferred from your wallet.` });
      setSelected(null);
      navigate({ to: "/my-investments" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start investment");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Invest" subtitle="Curated long-term strategies, managed by TrueNorth Financial." />

      {!unlocked && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning/20 text-warning">
            <Lock className="size-5" />
          </span>
          <p className="min-w-0 flex-1 text-sm">
            Investing is locked until your first confirmed deposit of at least {formatCurrency(1000, 0)} is received. The welcome bonus is promotional and cannot be invested, withdrawn, or transferred.
          </p>
          <Link to="/deposit" className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white">
            Make a deposit
          </Link>
        </div>
      )}

      {plans.isLoading ? (
        <SectionCard>
          <RowsSkeleton rows={3} />
        </SectionCard>
      ) : plans.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.data.map((p) => (
            <article key={p.id} className="hover-lift surface-card flex flex-col rounded-2xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {p.category ?? "Strategy"}
                </span>
                {p.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-royal-soft px-2 py-0.5 text-[10px] font-semibold text-royal">
                    <Sparkles className="size-2.5" /> Featured
                  </span>
                )}
              </div>
              <h3 className="font-display text-xl font-semibold text-navy">{p.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-3xl font-semibold text-royal">
                {Number(p.roi_percent)}%
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  {periodLabel[p.roi_period]} ROI
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-secondary p-2.5">
                  <p className="text-muted-foreground">Minimum</p>
                  <p className="font-semibold text-navy">{formatCurrency(p.min_amount, 0)}</p>
                </div>
                <div className="rounded-xl bg-secondary p-2.5">
                  <p className="text-muted-foreground">Maximum</p>
                  <p className="font-semibold text-navy">
                    {p.max_amount ? formatCurrency(p.max_amount, 0) : "Unlimited"}
                  </p>
                </div>
                <div className="rounded-xl bg-secondary p-2.5">
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold text-navy">{p.duration_days} days</p>
                </div>
                <div className="rounded-xl bg-secondary p-2.5">
                  <p className="text-muted-foreground">Risk</p>
                  <p className="font-semibold text-navy">{p.risk_level}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Expected profit at minimum:{" "}
                <span className="font-semibold text-success">
                  {formatCurrency(Number(p.min_amount) * planMultiplier(p))}
                </span>
              </p>
              <button
                onClick={() => openPlan(p)}
                disabled={!unlocked}
                className={`${btnPrimary} mt-4 w-full`}
                title={unlocked ? undefined : "Complete your first deposit to unlock"}
              >
                {unlocked ? <TrendingUp className="size-4" /> : <Lock className="size-4" />}
                {unlocked ? "Invest in this plan" : "Locked"}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <SectionCard>
          <EmptyState icon={Layers} title="No plans available" description="Please check back shortly." />
        </SectionCard>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-navy/40 backdrop-blur-sm sm:place-items-center">
          <div className="w-full max-w-2xl rounded-t-3xl bg-card p-6 shadow-elevated sm:rounded-2xl">
            <div className="mb-4 flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-royal-soft text-royal">
                <Calculator className="size-4" />
              </span>
              <div>
                <h2 className="font-display text-lg font-semibold text-navy">{selected.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {Number(selected.roi_percent)}% {periodLabel[selected.roi_period]} · {selected.duration_days} days
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.85fr]">
              <div className="space-y-4">
                <Field label="Investment amount (USD)" hint={`Minimum ${formatCurrency(selected.min_amount, 0)} · Maximum ${selected.max_amount ? formatCurrency(selected.max_amount, 0) : "No limit"}`}>
                  <input
                    type="number"
                    value={amount}
                    min={Number(selected.min_amount)}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>

                <div className="rounded-2xl border border-border/70 bg-secondary/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                    <ShieldCheck className="size-4 text-royal" /> Investment summary
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {summary?.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-2">
                        <span>{item.label}</span>
                        <span className="font-medium text-navy">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-royal-soft p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-royal">
                    <CircleDollarSign className="size-4" /> Expected maturity value
                  </div>
                  <p className="mt-2 font-display text-2xl font-semibold text-royal">{formatCurrency(totalReturn)}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Estimated profit: {formatCurrency(expected)} · Available balance: {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy">
                  <Wallet className="size-4 text-royal" /> Wallet checks
                </div>
                {!unlocked ? (
                  <p className="text-sm text-muted-foreground">Your wallet must be unlocked by a confirmed $1,000+ deposit before investing.</p>
                ) : !canAfford ? (
                  <div>
                    <p className="text-sm font-semibold text-destructive">Your available balance is insufficient to purchase this investment.</p>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/deposit" })}
                      className={`${btnPrimary} mt-3 w-full`}
                    >
                      Top up wallet
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Your available balance covers this investment. The purchase will deduct the amount immediately and create a new portfolio entry.</p>
                )}
                <div className="rounded-xl bg-secondary/90 p-3 text-xs text-muted-foreground">
                  <p>Terms and conditions: investments are subject to the plan duration, ROI schedule, and platform policies. Early withdrawals are not available.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setSelected(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold">
                Cancel
              </button>
              <button onClick={confirm} disabled={createInvestment.isPending || !canAfford || !unlocked} className={`${btnPrimary} flex-1`}>
                {createInvestment.isPending ? "Processing…" : "Confirm purchase"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

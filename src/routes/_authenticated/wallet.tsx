import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Gift, Wallet as WalletIcon, TrendingUp } from "lucide-react";
import { useWallet, useInvestments, formatCurrency } from "@/lib/api";
import { PageHeader, SectionCard, StatCard } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — TrueNorth Financial" },
      { name: "description", content: "Your available balance, welcome bonus and lifetime returns." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const wallet = useWallet();
  const investments = useInvestments();
  const w = wallet.data;
  const invested = (investments.data ?? [])
    .filter((i) => i.status === "active")
    .reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Wallet" subtitle="Manage your balance, bonus and payouts." />

      <div className="glass-blue relative overflow-hidden rounded-2xl p-6 shadow-elevated">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-white/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Available balance</p>
          <p className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
            {formatCurrency(w?.available_balance)}
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white">
            <Gift className="size-3.5" />
            {formatCurrency(w?.welcome_bonus, 0)} Welcome Bonus · separate balance, not withdrawable, not transferable, and not investable
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/deposit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-navy"
            >
              <ArrowDownToLine className="size-4" /> Deposit
            </Link>
            <Link
              to="/withdraw"
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <ArrowUpFromLine className="size-4" /> Withdraw
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total deposited" value={formatCurrency(w?.total_deposited)} icon={ArrowDownToLine} />
        <StatCard label="Currently invested" value={formatCurrency(invested)} icon={WalletIcon} />
        <StatCard label="Lifetime returns" value={formatCurrency(w?.total_profit)} icon={TrendingUp} tone="success" />
        <StatCard label="Referral earnings" value={formatCurrency(w?.referral_earnings)} icon={Gift} />
      </div>

      <SectionCard title="How your balance works">
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Deposits are credited after the blockchain transaction is confirmed by our team.</li>
          <li>• Your welcome bonus is kept separate, cannot be withdrawn, transferred, or invested, and is only available as a promotional balance.</li>
          <li>• Investing unlocks after your first confirmed deposit of at least $1,000.</li>
        </ul>
      </SectionCard>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Users, Gift } from "lucide-react";
import { useProfile, useReferrals, useWallet, formatCurrency, formatDate } from "@/lib/api";
import { PageHeader, SectionCard, StatCard, EmptyState, RowsSkeleton } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({
    meta: [
      { title: "Referral Program — TrueNorth Financial" },
      {
        name: "description",
        content: "Invite investors and earn commission on their funded deposits.",
      },
    ],
  }),
  component: Referrals,
});

function Referrals() {
  const profile = useProfile();
  const referrals = useReferrals();
  const wallet = useWallet();
  const [copied, setCopied] = useState(false);

  const code = profile.data?.referral_code ?? "";
  const link =
    typeof window !== "undefined" ? `${window.location.origin}/auth?mode=register&ref=${code}` : "";

  async function copy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Referral Program"
        subtitle="Earn 5% commission on every referred deposit."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label="Referred investors"
          value={String(referrals.data?.length ?? 0)}
          icon={Users}
        />
        <StatCard
          label="Referral earnings"
          value={formatCurrency(wallet.data?.referral_earnings)}
          icon={Gift}
          tone="success"
        />
        <StatCard
          label="Your code"
          value={code || "—"}
          icon={Copy}
          tone="primary"
          loading={profile.isLoading}
        />
      </div>

      <SectionCard title="Your invitation link">
        <div className="flex flex-col gap-2 sm:flex-row">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-secondary px-3 py-3 text-xs">
            {link}
          </code>
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-royal px-4 py-3 text-sm font-semibold text-white"
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />} Copy link
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Your referrals" bodyClassName="p-0">
        {referrals.isLoading ? (
          <div className="p-5">
            <RowsSkeleton rows={3} />
          </div>
        ) : referrals.data?.length ? (
          <ul>
            {referrals.data.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-navy">Referred investor</p>
                  <p className="text-xs text-muted-foreground">Joined {formatDate(r.created_at)}</p>
                </div>
                <p className="text-sm font-semibold text-success">{formatCurrency(r.earnings)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Users}
            title="No referrals yet"
            description="Share your link to start earning."
          />
        )}
      </SectionCard>
    </div>
  );
}

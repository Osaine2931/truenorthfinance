import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, kpis } from "@/lib/mock-data";
import { Copy, Users, Gift, Share2 } from "lucide-react";
import { Route as AuthRoute } from "@/routes/_authenticated/route";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referral Program — Aurelian" }] }),
  component: Referrals,
});

function Referrals() {
  const { user } = AuthRoute.useRouteContext();
  const code = (user.id ?? "AURELIAN").slice(0, 8).toUpperCase();
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${code}`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Referral link copied");
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Referral Program</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Earn 3% of every deposit made by friends you invite — for life.
        </p>
      </div>

      <div className="glass-navy relative overflow-hidden rounded-2xl p-6 shadow-elevated">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            Total referral earnings
          </p>
          <p className="mt-2 font-display text-4xl font-semibold text-white sm:text-5xl">
            {formatCurrency(kpis.referralEarnings)}
          </p>
          <div className="gold-hairline mt-4 w-16" />
          <p className="mt-4 text-sm text-white/70">Your referral link</p>
          <div className="mt-2 flex gap-2">
            <div className="flex-1 truncate rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs text-white">
              {link}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-xs font-medium text-navy hover:opacity-90"
            >
              <Copy className="size-3.5" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Share2, label: "Share your link", value: "1" },
          { icon: Users, label: "Friend signs up & deposits", value: "2" },
          { icon: Gift, label: "You earn 3% forever", value: "3" },
        ].map((step) => (
          <div key={step.label} className="surface-card p-5">
            <span className="font-display text-3xl font-semibold text-gold">{step.value}</span>
            <div className="mt-3 flex items-center gap-2">
              <step.icon className="size-4 text-royal" />
              <p className="text-sm font-medium text-foreground">{step.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, kpis } from "@/lib/mock-data";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({ meta: [{ title: "Withdraw — TrueNorth Financial" }] }),
  component: Withdraw,
});

function Withdraw() {
  const [amount, setAmount] = useState(500);
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Withdrawal request submitted", {
        description: "Our team will review within 24 hours.",
      });
    }, 900);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Withdraw funds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Available balance: <span className="font-medium text-foreground">{formatCurrency(kpis.availableBalance)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="surface-card space-y-5 p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">Amount (USD)</label>
          <input
            type="number"
            min={50}
            max={kpis.availableBalance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-card px-4 py-3 text-2xl font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">Destination account</label>
          <input
            type="text"
            required
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="IBAN, wallet address, or account no."
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-royal py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Request withdrawal
        </button>
      </form>
    </div>
  );
}

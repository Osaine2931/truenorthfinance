import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { formatCurrency, kpis } from "@/lib/mock-data";
import { CreditCard, Building2, Bitcoin, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({ meta: [{ title: "Deposit — Aurelian" }] }),
  component: Deposit,
});

function Deposit() {
  const [amount, setAmount] = useState(1000);
  const [method, setMethod] = useState<"card" | "bank" | "crypto">("bank");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Deposit request submitted", {
        description: `${formatCurrency(amount)} via ${method}`,
      });
    }, 900);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Deposit funds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Current balance: <span className="font-medium text-foreground">{formatCurrency(kpis.availableBalance)}</span>
        </p>
      </div>

      <div className="surface-card space-y-5 p-6">
        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">Amount (USD)</label>
          <input
            type="number"
            min={50}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-lg border border-input bg-card px-4 py-3 text-2xl font-semibold outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {[500, 1000, 5000, 10000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(v)}
                className="rounded-md border border-border bg-muted px-3 py-1 text-xs font-medium hover:bg-accent"
              >
                {formatCurrency(v)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-foreground">Payment method</label>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { id: "bank", label: "Bank transfer", icon: Building2 },
              { id: "card", label: "Card", icon: CreditCard },
              { id: "crypto", label: "Crypto", icon: Bitcoin },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMethod(m.id as typeof method)}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  method === m.id
                    ? "border-royal bg-royal-soft text-royal"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                <m.icon className="size-4" />
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {loading && <Loader2 className="size-4 animate-spin" />}
          Deposit {formatCurrency(amount)}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Funds usually arrive within 1 business day.
        </p>
      </div>
    </div>
  );
}

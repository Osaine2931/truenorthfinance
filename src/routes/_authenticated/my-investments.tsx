import { createFileRoute } from "@tanstack/react-router";
import { activeInvestments, formatCurrency } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/my-investments")({
  head: () => ({ meta: [{ title: "My Investments — TrueNorth Financial" }] }),
  component: MyInvestments,
});

function MyInvestments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">My Investments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track your active positions and returns.</p>
      </div>
      <div className="surface-card overflow-hidden">
        <div className="hidden grid-cols-[2fr_1fr_1fr_1.5fr_1fr] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid">
          <div>Plan</div>
          <div>Amount</div>
          <div>ROI</div>
          <div>Progress</div>
          <div className="text-right">Status</div>
        </div>
        {activeInvestments.map((inv) => (
          <div
            key={inv.id}
            className="grid grid-cols-2 gap-3 border-b border-border p-5 last:border-0 md:grid-cols-[2fr_1fr_1fr_1.5fr_1fr] md:items-center"
          >
            <div className="col-span-2 md:col-span-1">
              <p className="font-medium text-foreground">{inv.plan}</p>
              <p className="text-xs text-muted-foreground">ID {inv.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground md:hidden">Amount</p>
              <p className="font-medium text-foreground">{formatCurrency(inv.amount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground md:hidden">ROI</p>
              <p className="font-medium text-success">{inv.roi}</p>
            </div>
            <div className="col-span-2 md:col-span-1">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-foreground">{inv.progress}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${inv.progress}%`,
                    background: inv.status === "Premium" ? "var(--color-gold)" : "var(--color-royal)",
                  }}
                />
              </div>
            </div>
            <div className="md:text-right">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  inv.status === "Premium"
                    ? "bg-gold-soft text-gold ring-1 ring-gold/20"
                    : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-600/10"
                }`}
              >
                {inv.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

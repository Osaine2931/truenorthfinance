import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownToLine, ArrowUpFromLine, Receipt } from "lucide-react";
import { useTransactions, formatCurrency, formatDateTime } from "@/lib/api";
import { PageHeader, SectionCard, StatusPill, EmptyState, RowsSkeleton } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — TrueNorth Financial" },
      { name: "description", content: "Full ledger of deposits, withdrawals, investments and returns." },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const transactions = useTransactions();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Transactions" subtitle="Every movement on your account, in one ledger." />
      <SectionCard bodyClassName="p-0">
        {transactions.isLoading ? (
          <div className="p-5">
            <RowsSkeleton rows={6} />
          </div>
        ) : transactions.data?.length ? (
          <ul>
            {transactions.data.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      t.direction === "in" ? "bg-success/10 text-success" : "bg-royal-soft text-royal"
                    }`}
                  >
                    {t.direction === "in" ? (
                      <ArrowDownToLine className="size-4" />
                    ) : (
                      <ArrowUpFromLine className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-navy">{t.type}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.description ?? formatDateTime(t.created_at)}
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`font-semibold ${t.direction === "in" ? "text-success" : "text-navy"}`}>
                    {t.direction === "in" ? "+" : "−"}
                    {formatCurrency(t.amount)}
                  </p>
                  <StatusPill status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Receipt} title="No transactions yet" description="Fund your account to get started." />
        )}
      </SectionCard>
    </div>
  );
}

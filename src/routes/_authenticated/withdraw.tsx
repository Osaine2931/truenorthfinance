import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowUpFromLine, Info } from "lucide-react";
import {
  useCryptoMethods,
  useWithdrawals,
  useWallet,
  useCreateWithdrawal,
  formatCurrency,
  formatDateTime,
} from "@/lib/api";
import {
  PageHeader,
  SectionCard,
  Field,
  inputClass,
  btnPrimary,
  StatusPill,
  EmptyState,
  RowsSkeleton,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — TrueNorth Financial" },
      { name: "description", content: "Request a cryptocurrency payout from your TrueNorth wallet." },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const methods = useCryptoMethods();
  const withdrawals = useWithdrawals();
  const wallet = useWallet();
  const createWithdrawal = useCreateWithdrawal();

  const list = methods.data ?? [];
  const [methodId, setMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState(100);
  const [address, setAddress] = useState("");

  const method = list.find((m) => m.id === methodId) ?? list[0] ?? null;
  const withdrawable = Number(wallet.data?.available_balance ?? 0);

  async function submit() {
    if (!method) return;
    if (!address.trim()) {
      toast.error("Enter a destination wallet address");
      return;
    }
    if (amount <= 0 || amount > withdrawable) {
      toast.error("Amount exceeds your withdrawable balance", {
        description: "The $1,000 Welcome Bonus is promotional and cannot be withdrawn.",
      });
      return;
    }
    try {
      await createWithdrawal.mutateAsync({
        amount,
        crypto_symbol: method.symbol,
        network: method.network,
        destination_address: address.trim(),
      });
      setAddress("");
      toast.success("Withdrawal request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Withdrawal failed");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Withdraw" subtitle="Payouts are sent in cryptocurrency to your own wallet." />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <SectionCard title="Request a payout">
          <div className="mb-4 rounded-2xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Withdrawable balance</p>
            <p className="font-display text-3xl font-semibold text-navy">{formatCurrency(withdrawable)}</p>
            <p className="mt-1 flex items-start gap-1.5 text-[11px] text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0" />
              Excludes the {formatCurrency(wallet.data?.welcome_bonus, 0)} welcome bonus, which is promotional and
              not withdrawable.
            </p>
          </div>

          <Field label="Cryptocurrency">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((m) => {
                const active = method?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethodId(m.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active ? "border-royal bg-royal-soft" : "border-border bg-card hover:border-royal/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-navy">{m.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{m.network ?? m.name}</p>
                  </button>
                );
              })}
            </div>
          </Field>

          <div className="mt-4 space-y-4">
            <Field label="Amount (USD)">
              <input
                type="number"
                value={amount}
                min={1}
                onChange={(e) => setAmount(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
            <Field label="Destination wallet address">
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder="Your wallet address" />
            </Field>
            <button onClick={submit} disabled={createWithdrawal.isPending} className={`${btnPrimary} w-full`}>
              {createWithdrawal.isPending && <Loader2 className="size-4 animate-spin" />}
              Request withdrawal
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Withdrawal history" bodyClassName="p-0">
          {withdrawals.isLoading ? (
            <div className="p-5">
              <RowsSkeleton />
            </div>
          ) : withdrawals.data?.length ? (
            <ul>
              {withdrawals.data.map((w) => (
                <li key={w.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">
                      {formatCurrency(w.amount)} · {w.crypto_symbol}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{formatDateTime(w.created_at)}</p>
                  </div>
                  <StatusPill status={w.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={ArrowUpFromLine} title="No withdrawals yet" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check, Lock, Bitcoin, Loader2 } from "lucide-react";
import { useCryptoMethods, useDeposits, useWallet, useCreateDeposit, formatCurrency, formatDateTime, MIN_DEPOSIT } from "@/lib/api";
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

export const Route = createFileRoute("/_authenticated/deposit")({
  head: () => ({
    meta: [
      { title: "Deposit — TrueNorth Financial" },
      { name: "description", content: "Fund your TrueNorth account with Bitcoin, Ethereum, USDT, BNB or Solana." },
    ],
  }),
  component: DepositPage,
});

function DepositPage() {
  const methods = useCryptoMethods();
  const deposits = useDeposits();
  const wallet = useWallet();
  const createDeposit = useCreateDeposit();

  const [methodId, setMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState(MIN_DEPOSIT);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);

  const list = methods.data ?? [];
  const method = list.find((m) => m.id === methodId) ?? list[0] ?? null;

  async function copyAddress() {
    if (!method) return;
    await navigator.clipboard.writeText(method.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function submit() {
    if (!method) return;
    if (amount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${formatCurrency(MIN_DEPOSIT, 0)}`);
      return;
    }
    try {
      await createDeposit.mutateAsync({
        amount,
        crypto_symbol: method.symbol,
        network: method.network,
        wallet_address: method.wallet_address,
        tx_hash: txHash || null,
      });
      setTxHash("");
      toast.success("Deposit submitted for confirmation", {
        description: "Your balance updates once the transaction is verified.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Deposit"
        subtitle={`Cryptocurrency only · minimum ${formatCurrency(MIN_DEPOSIT, 0)} per deposit.`}
      />

      {!wallet.data?.has_deposited && (
        <div className="flex items-center gap-3 rounded-2xl border border-royal/25 bg-royal-soft p-4 text-sm">
          <Lock className="size-5 shrink-0 text-royal" />
          <p>
            Your first confirmed deposit of at least {formatCurrency(MIN_DEPOSIT, 0)} unlocks all investment plans.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <SectionCard title="Choose a cryptocurrency">
          {methods.isLoading ? (
            <RowsSkeleton rows={3} />
          ) : (
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
          )}

          {method && (
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">
                  {method.name} deposit address ({method.network})
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl bg-card px-3 py-2 text-xs">
                    {method.wallet_address}
                  </code>
                  <button
                    onClick={copyAddress}
                    className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-royal"
                    aria-label="Copy address"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  </button>
                </div>
              </div>

              <Field label="Amount (USD)">
                <input
                  type="number"
                  min={MIN_DEPOSIT}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <div className="flex flex-wrap gap-2">
                {[1000, 2500, 5000, 10000].map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v)}
                    className="rounded-lg border border-border bg-secondary px-3 py-1 text-xs font-medium hover:border-royal"
                  >
                    {formatCurrency(v, 0)}
                  </button>
                ))}
              </div>
              <Field label="Transaction hash (optional)" hint="Adding the hash speeds up confirmation.">
                <input value={txHash} onChange={(e) => setTxHash(e.target.value)} className={inputClass} placeholder="0x…" />
              </Field>
              <button onClick={submit} disabled={createDeposit.isPending} className={`${btnPrimary} w-full`}>
                {createDeposit.isPending && <Loader2 className="size-4 animate-spin" />}
                Submit {formatCurrency(amount, 0)} deposit
              </button>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Deposit history" bodyClassName="p-0">
          {deposits.isLoading ? (
            <div className="p-5">
              <RowsSkeleton />
            </div>
          ) : deposits.data?.length ? (
            <ul>
              {deposits.data.map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-navy">
                      {formatCurrency(d.amount)} · {d.crypto_symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(d.created_at)}</p>
                  </div>
                  <StatusPill status={d.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Bitcoin} title="No deposits yet" description="Your crypto deposits will appear here." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

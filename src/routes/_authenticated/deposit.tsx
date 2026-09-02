import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Lock,
  Bitcoin,
  Loader2,
  CreditCard,
  ShieldCheck,
  QrCode,
  Clock3,
  CircleDollarSign,
} from "lucide-react";
import {
  useCryptoMethods,
  useDeposits,
  useWallet,
  useCreateDeposit,
  formatCurrency,
  formatDateTime,
  MIN_DEPOSIT,
} from "@/lib/api";
import { getPaymentProviders } from "@/lib/payments";
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
      { title: "Payments — TrueNorth Financial" },
      {
        name: "description",
        content:
          "Prepare wallet funding through the payments architecture for future gateway integration.",
      },
    ],
  }),
  component: DepositPage,
});

function DepositPage() {
  const methods = useCryptoMethods();
  const deposits = useDeposits();
  const wallet = useWallet();
  const createDeposit = useCreateDeposit();
  const providers = useMemo(() => getPaymentProviders(), []);

  const [methodId, setMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState(MIN_DEPOSIT);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [invoice, setInvoice] = useState<null | {
    amount: number;
    crypto: string;
    cryptoAmount: string;
    paymentAddress: string;
    qrCodeUrl?: string;
    expiresAt?: string;
    status: string;
    invoiceId: string;
    paymentId?: string;
    paymentUrl?: string;
  }>(null);
  const [countdown, setCountdown] = useState(0);

  const list = methods.data ?? [];
  const method = list.find((m) => m.id === methodId) ?? list[0] ?? null;

  async function copyAddress() {
    if (!method) return;
    await navigator.clipboard.writeText(method.wallet_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  useEffect(() => {
    if (!invoice?.expiresAt) return;
    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(invoice.expiresAt!).getTime() - Date.now()) / 1000),
      );
      setCountdown(remaining);
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [invoice?.expiresAt]);

  async function submit() {
    if (!method) return;
    if (amount < MIN_DEPOSIT) {
      toast.error(`Minimum deposit is ${formatCurrency(MIN_DEPOSIT, 0)}`);
      return;
    }
    try {
      const response = await createDeposit.mutateAsync({
        amount,
        crypto_symbol: method.symbol,
        network: method.network,
        wallet_address: method.wallet_address,
        tx_hash: txHash || null,
      });
      setInvoice({
        amount: response?.invoice?.amount ?? amount,
        crypto: response?.invoice?.crypto ?? method.symbol,
        cryptoAmount: response?.invoice?.cryptoAmount ?? (amount / 65000).toFixed(4),
        paymentAddress: response?.invoice?.paymentAddress ?? method.wallet_address ?? "",
        qrCodeUrl: response?.invoice?.qrCodeUrl ?? undefined,
        expiresAt: response?.invoice?.expiresAt ?? undefined,
        status: response?.invoice?.status ?? "waiting",
        invoiceId: response?.invoice?.invoiceId ?? "",
        paymentId: response?.invoice?.paymentId,
        paymentUrl: response?.invoice?.paymentUrl,
      });
      setTxHash("");
      toast.success("Payment invoice created", {
        description: "Send the crypto to the address below to complete funding.",
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Payments"
        subtitle={`Create a NOWPayments invoice, fund your wallet, and unlock investing. Minimum ${formatCurrency(MIN_DEPOSIT, 0)}.`}
      />

      {!wallet.data?.has_deposited && (
        <div className="flex items-center gap-3 rounded-2xl border border-royal/25 bg-royal-soft p-4 text-sm">
          <Lock className="size-5 shrink-0 text-royal" />
          <p>
            Your first confirmed deposit of at least {formatCurrency(MIN_DEPOSIT, 0)} unlocks all
            investment plans.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <SectionCard title="Secure payment flow">
          <div className="rounded-2xl border border-border/70 bg-secondary/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <CreditCard className="size-4 text-royal" /> NOWPayments-only funding
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Funding is processed through NOWPayments only, keeping the deposit flow simple and
              secure.
            </p>
            <div className="mt-4 space-y-2">
              {providers.map((provider) => (
                <div
                  key={provider.key}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-navy">{provider.label}</p>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${provider.enabled ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}
                  >
                    {provider.enabled ? "active" : "pending"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-royal/20 bg-royal-soft p-3 text-sm text-navy">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="size-4" /> Secure invoice flow.
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Invoices are created server-side and wallet credits are applied automatically when
                the webhook confirms a successful payment.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Bitcoin className="size-4 text-royal" /> Wallet funding (crypto)
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              The wallet funding experience is live through NOWPayments and uses the configured
              API credentials for invoice creation.
            </p>
          </div>
        </SectionCard>

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
                      active
                        ? "border-royal bg-royal-soft"
                        : "border-border bg-card hover:border-royal/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-navy">{m.symbol}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {m.network ?? m.name}
                    </p>
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
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Supported for deposits only: Bitcoin, Ethereum, USDT TRC20, USDT ERC20, USDT
                  BEP20, BNB, and Solana.
                </p>
                {invoice?.paymentAddress ? (
                  <div className="mt-2 flex items-center gap-2">
                    <code className="min-w-0 flex-1 truncate rounded-xl bg-card px-3 py-2 text-xs">
                      {invoice.paymentAddress}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-royal"
                      aria-label="Copy address"
                    >
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl border border-dashed border-border bg-card px-3 py-2 text-xs text-muted-foreground">
                    Your payment address will appear here once the invoice is created.
                  </p>
                )}
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
              <Field
                label="Transaction hash (optional)"
                hint="Adding the hash speeds up confirmation."
              >
                <input
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className={inputClass}
                  placeholder="0x…"
                />
              </Field>
              <button
                onClick={submit}
                disabled={createDeposit.isPending}
                className={`${btnPrimary} w-full`}
              >
                {createDeposit.isPending && <Loader2 className="size-4 animate-spin" />}
                Generate NOWPayments invoice
              </button>
            </div>
          )}

          {invoice && (
            <div className="mt-5 space-y-4 rounded-2xl border border-royal/20 bg-royal-soft p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-royal">Invoice created</p>
                  <p className="font-display text-xl font-semibold text-navy">
                    {formatCurrency(invoice.amount, 0)} · {invoice.crypto}
                  </p>
                </div>
                <div className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-royal">
                  {invoice.status}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white/70 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-navy">
                    <CircleDollarSign className="size-4 text-royal" /> Deposit amount
                  </div>
                  <p className="mt-1 text-muted-foreground">{formatCurrency(invoice.amount, 0)}</p>
                </div>
                <div className="rounded-xl bg-white/70 p-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-navy">
                    <Clock3 className="size-4 text-royal" /> Countdown
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {Math.floor(countdown / 60)}m {countdown % 60}s
                  </p>
                </div>
              </div>
              <div className="rounded-xl bg-white/70 p-3 text-sm">
                <div className="flex items-center gap-2 font-semibold text-navy">
                  <QrCode className="size-4 text-royal" /> Crypto amount
                </div>
                <p className="mt-1 text-muted-foreground">
                  {invoice.cryptoAmount} {invoice.crypto}
                </p>
              </div>
              {invoice.qrCodeUrl ? (
                <img
                  src={invoice.qrCodeUrl}
                  alt="QR code"
                  className="mx-auto h-40 w-40 rounded-2xl border border-border bg-white p-2"
                />
              ) : null}
              <div className="rounded-xl border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground space-y-1">
                <p>Payment address: {invoice.paymentAddress}</p>
                <p>Invoice ID: {invoice.invoiceId}</p>
                {invoice.paymentId ? <p>Payment ID: {invoice.paymentId}</p> : null}
                {invoice.paymentUrl ? <p>Payment URL: {invoice.paymentUrl}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to="/dashboard"
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-navy"
                >
                  Back to dashboard
                </Link>
                <button
                  onClick={() => setInvoice(null)}
                  className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-navy"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Payment history" bodyClassName="p-0">
          {deposits.isLoading ? (
            <div className="p-5">
              <RowsSkeleton />
            </div>
          ) : deposits.data?.length ? (
            <ul>
              {deposits.data.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0"
                >
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
            <EmptyState
              icon={Bitcoin}
              title="No deposits yet"
              description="Your crypto deposits will appear here."
            />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

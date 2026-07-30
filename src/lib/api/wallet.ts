import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase, unwrap, useInvalidate, type Wallet } from "./client";
import { currentUserId } from "./auth";
import { formatCurrency } from "./format";
import { createNowPaymentsInvoice } from "@/lib/payments/nowpayments";

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw new Error(error.message);
      return data as Wallet | null;
    },
  });
}

export function useCryptoMethods() {
  return useQuery({
    queryKey: ["crypto-methods"],
    queryFn: async () =>
      unwrap(await supabase.from("crypto_methods").select("*").eq("is_active", true).order("sort_order")),
  });
}

export function useDeposits() {
  return useQuery({
    queryKey: ["deposits"],
    queryFn: async () =>
      unwrap(await supabase.from("deposits").select("*").order("created_at", { ascending: false })),
  });
}

export function useWithdrawals() {
  return useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () =>
      unwrap(await supabase.from("withdrawals").select("*").order("created_at", { ascending: false })),
  });
}

export function useCreateDeposit() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      crypto_symbol: string;
      network: string | null;
      wallet_address: string | null;
      tx_hash?: string | null;
    }) => {
      const uid = await currentUserId();
      const invoice = await createNowPaymentsInvoice({
        amount: input.amount,
        currency: "USD",
        cryptoCurrency: input.crypto_symbol,
        orderId: `deposit-${uid}-${Date.now()}`,
        orderDescription: `${input.crypto_symbol} deposit`,
      });

      const { data: deposit, error } = await supabase
        .from("deposits")
        .insert({
          ...input,
          user_id: uid,
          status: "waiting",
          wallet_address: input.wallet_address ?? invoice.pay_address ?? null,
          tx_hash: input.tx_hash ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);

      await supabase.from("transactions").insert({
        user_id: uid,
        type: "Deposit",
        direction: "in",
        amount: input.amount,
        status: "pending",
        description: `${input.crypto_symbol}${input.network ? ` (${input.network})` : ""} invoice deposit`,
      });
      await supabase.from("activities").insert({
        user_id: uid,
        action: "Deposit submitted",
        detail: `${formatCurrency(input.amount)} via ${input.crypto_symbol}`,
      });
      await supabase.from("notifications").insert({
        user_id: uid,
        title: "Deposit pending",
        body: `Your ${input.crypto_symbol} payment is awaiting confirmation.`,
        kind: "info",
      });

      return {
        deposit,
        invoice: {
          invoiceId: invoice.invoice_id,
          paymentAddress: invoice.pay_address,
          cryptoAmount: invoice.pay_amount,
          qrCodeUrl: invoice.qr_code_url ?? invoice.qrcode,
          expiresAt: invoice.expires_at,
          status: invoice.status,
          amount: input.amount,
          crypto: input.crypto_symbol,
        },
      };
    },
    onSuccess: () => invalidate(["deposits", "transactions", "activities", "wallet", "notifications"]),
  });
}

export function useCreateWithdrawal() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      amount: number;
      crypto_symbol: string;
      network: string | null;
      destination_address: string;
    }) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("withdrawals").insert({ ...input, user_id: uid });
      if (error) throw new Error(error.message);
      await supabase.from("transactions").insert({
        user_id: uid,
        type: "Withdrawal",
        direction: "out",
        amount: input.amount,
        status: "pending",
        description: `${input.crypto_symbol} payout request`,
      });
      await supabase.from("activities").insert({
        user_id: uid,
        action: "Withdrawal requested",
        detail: `${formatCurrency(input.amount)} to ${input.crypto_symbol}`,
      });
    },
    onSuccess: () => invalidate(["withdrawals", "transactions", "activities", "wallet"]),
  });
}

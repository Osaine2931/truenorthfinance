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
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Wallet | null;
    },
  });
}

export function useCryptoMethods() {
  return useQuery({
    queryKey: ["crypto-methods"],
    queryFn: async () =>
      unwrap(
        await supabase.from("crypto_methods").select("*").eq("is_active", true).order("sort_order"),
      ),
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
      unwrap(
        await supabase.from("withdrawals").select("*").order("created_at", { ascending: false }),
      ),
  });
}

/**
 * Deposits are created server-side: the server verifies the session, validates
 * the amount/method, inserts the deposit and calls the live NOWPayments API.
 * The payment address returned is always the real one from NOWPayments.
 */
export function useCreateDeposit() {
  const invalidate = useInvalidate();
  const createInvoice = useServerFn(createDepositInvoice);
  return useMutation({
    mutationFn: async (input: { methodId: string; amount: number }) =>
      createInvoice({ data: { methodId: input.methodId, amount: input.amount } }),
    onSuccess: () =>
      invalidate(["deposits", "transactions", "activities", "wallet", "notifications"]),
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

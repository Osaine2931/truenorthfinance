import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type DepositInvoice = {
  depositId: string;
  orderId: string;
  invoiceId: string;
  paymentId: string;
  paymentAddress: string;
  payAmount: number;
  payCurrency: string;
  amount: number;
  network: string | null;
  status: string;
  expiresAt: string | null;
};

const MIN_DEPOSIT = 1000;

/**
 * Creates a deposit + a REAL NOWPayments payment.
 *
 * The signed-in user is resolved server-side from the Supabase session; the
 * browser never supplies a user id. The payment address returned here always
 * comes from NOWPayments — there is no static/demo address fallback.
 */
export const createDepositInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { methodId: string; amount: number }) => {
    const amount = Number(input?.amount);
    if (!input?.methodId || typeof input.methodId !== "string") {
      throw new Error("Select a cryptocurrency to continue.");
    }
    if (!Number.isFinite(amount) || amount < MIN_DEPOSIT) {
      throw new Error(`Minimum deposit is $${MIN_DEPOSIT.toLocaleString()}.`);
    }
    return { methodId: input.methodId, amount };
  })
  .handler(async ({ data, context }): Promise<DepositInvoice> => {
    const {
      createNowPaymentsPayment,
      orderIdForDeposit,
      missingNowPaymentsCredentials,
    } = await import("./nowpayments.server");

    const missing = missingNowPaymentsCredentials();
    if (missing.length) {
      console.error(`[deposit] blocked: missing ${missing.join(", ")}`);
      throw new Error("Payment service is temporarily unavailable.");
    }

    const { data: method, error: methodError } = await context.supabase
      .from("crypto_methods")
      .select("id, name, symbol, network, min_deposit, is_active")
      .eq("id", data.methodId)
      .eq("is_active", true)
      .maybeSingle();
    if (methodError) {
      console.error("[deposit] method lookup failed", methodError.message);
      throw new Error("Unable to create deposit. Please try again.");
    }
    if (!method) throw new Error("This payment method is not available.");
    if (data.amount < Number(method.min_deposit ?? MIN_DEPOSIT)) {
      throw new Error(`Minimum deposit for ${method.symbol} is $${Number(method.min_deposit)}.`);
    }

    const { data: deposit, error: depositError } = await context.supabase
      .from("deposits")
      .insert({
        user_id: context.userId,
        amount: data.amount,
        crypto_symbol: method.symbol,
        network: method.network,
        status: "waiting",
      })
      .select()
      .single();
    if (depositError || !deposit) {
      console.error("[deposit] insert failed", depositError?.message);
      throw new Error("Unable to create deposit. Please try again.");
    }

    const orderId = orderIdForDeposit(deposit.id);
    const origin = (() => {
      try {
        return new URL(getRequest().url).origin;
      } catch {
        return process.env["PUBLIC_SITE_URL"] ?? "";
      }
    })();

    let payment;
    try {
      payment = await createNowPaymentsPayment({
        amount: data.amount,
        priceCurrency: "usd",
        payCurrency: method.symbol,
        orderId,
        orderDescription: `TrueNorth wallet funding (${method.symbol})`,
        ipnCallbackUrl: `${origin}/api/public/nowpayments/webhook`,
      });
    } catch (error) {
      await context.supabase.from("deposits").update({ status: "failed" }).eq("id", deposit.id);
      throw error instanceof Error
        ? error
        : new Error("Unable to create payment invoice. Please try again.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const expiresAt = payment.valid_until ?? payment.expiration_estimate_date ?? null;

    const { error: paymentError } = await supabaseAdmin.from("payments").upsert(
      {
        user_id: context.userId,
        deposit_id: deposit.id,
        provider: "nowpayments",
        order_id: orderId,
        invoice_id: payment.invoice_id ? String(payment.invoice_id) : null,
        payment_id: String(payment.payment_id),
        payment_address: payment.pay_address,
        amount: data.amount,
        currency: "USD",
        crypto_currency: payment.pay_currency?.toUpperCase() ?? method.symbol,
        network: payment.network ?? method.network,
        pay_amount: Number(payment.pay_amount ?? 0),
        status: payment.payment_status ?? "waiting",
        expires_at: expiresAt,
        metadata: payment as unknown as never,
      },
      { onConflict: "order_id" },
    );
    if (paymentError) {
      console.error("[deposit] payment record upsert failed", paymentError.message);
    }

    await supabaseAdmin.from("deposits").update({ wallet_address: payment.pay_address }).eq("id", deposit.id);

    await supabaseAdmin.from("activities").insert({
      user_id: context.userId,
      action: "Deposit initiated",
      detail: `${method.symbol} payment of $${data.amount} awaiting confirmation`,
    });

    return {
      depositId: deposit.id,
      orderId,
      invoiceId: payment.invoice_id ? String(payment.invoice_id) : "",
      paymentId: String(payment.payment_id),
      paymentAddress: payment.pay_address,
      payAmount: Number(payment.pay_amount ?? 0),
      payCurrency: (payment.pay_currency ?? method.symbol).toUpperCase(),
      amount: data.amount,
      network: payment.network ?? method.network,
      status: payment.payment_status ?? "waiting",
      expiresAt,
    };
  });

/** Re-reads a payment's live status from NOWPayments and syncs the wallet if it settled. */
export const refreshDepositStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: { depositId: string }) => {
    if (!input?.depositId) throw new Error("depositId is required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { getNowPaymentsPayment, shouldCredit } = await import("./nowpayments.server");

    const { data: payment } = await context.supabase
      .from("payments")
      .select("payment_id, deposit_id, status")
      .eq("deposit_id", data.depositId)
      .maybeSingle();
    if (!payment?.payment_id) return { status: "unknown" as const };

    const live = await getNowPaymentsPayment(payment.payment_id);
    if (!live) return { status: payment.status };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("payments")
      .update({
        status: live.payment_status,
        actually_paid: Number(live.actually_paid ?? 0) || undefined,
      })
      .eq("payment_id", String(live.payment_id));

    if (shouldCredit(live.payment_status)) {
      await supabaseAdmin.rpc("credit_deposit", {
        p_deposit_id: data.depositId,
        p_paid_amount: undefined,
        p_payment_id: String(live.payment_id),
        p_status: live.payment_status,
      });
    }

    return { status: live.payment_status };
  });

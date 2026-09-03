import { createFileRoute } from "@tanstack/react-router";

/**
 * NOWPayments IPN endpoint.
 *
 * Public by design (NOWPayments is not signed in), but every request must
 * carry a valid HMAC-SHA512 signature over the raw body. The deposit is
 * resolved from the deterministic `order_id` (deposit-<uuid>) or from the
 * stored payment record — never from "the most recent deposit".
 */
export const Route = createFileRoute("/api/public/nowpayments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const {
          verifyIpnSignature,
          getSignatureHeader,
          depositIdFromOrderId,
          shouldCredit,
          isFailedStatus,
          missingNowPaymentsCredentials,
        } = await import("@/lib/payments/nowpayments.server");

        if (missingNowPaymentsCredentials().includes("NOWPAYMENTS_IPN_SECRET")) {
          console.error("[nowpayments:ipn] rejected: IPN secret not configured");
          return new Response("Not configured", { status: 503 });
        }

        const rawBody = await request.text();
        const signature = getSignatureHeader(request.headers);

        if (!verifyIpnSignature(rawBody, signature)) {
          console.error("[nowpayments:ipn] rejected: invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: Record<string, unknown>;
        try {
          payload = JSON.parse(rawBody) as Record<string, unknown>;
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const status = String(payload["payment_status"] ?? "");
        const orderId = payload["order_id"] ? String(payload["order_id"]) : null;
        const paymentId = payload["payment_id"] ? String(payload["payment_id"]) : null;
        const actuallyPaid = Number(payload["actually_paid"] ?? 0) || null;
        const priceAmount = Number(payload["price_amount"] ?? 0) || null;

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // 1. Resolve the exact payment record.
        let query = supabaseAdmin
          .from("payments")
          .select("id, deposit_id, user_id, order_id, payment_id, amount, status");
        query = orderId ? query.eq("order_id", orderId) : query.eq("payment_id", paymentId ?? "");
        const { data: record, error: recordError } = await query.maybeSingle();

        if (recordError) {
          console.error("[nowpayments:ipn] payment lookup failed", recordError.message);
          return new Response("Lookup failed", { status: 500 });
        }

        const depositId = record?.deposit_id ?? depositIdFromOrderId(orderId);
        if (!depositId) {
          console.error(
            `[nowpayments:ipn] unmatched payment (order_id=${orderId ?? "none"}, payment_id=${paymentId ?? "none"}) — ignored`,
          );
          return new Response("Unknown payment", { status: 404 });
        }

        // 2. Keep the payment record in sync (never trust it for crediting).
        await supabaseAdmin
          .from("payments")
          .update({
            status: status || "waiting",
            actually_paid: actuallyPaid ?? undefined,
            payment_id: paymentId ?? record?.payment_id ?? undefined,
            metadata: payload as unknown as never,
          })
          .eq("deposit_id", depositId);

        // 3. Confirm the payment belongs to this deposit.
        const { data: deposit } = await supabaseAdmin
          .from("deposits")
          .select("id, user_id, amount, status")
          .eq("id", depositId)
          .maybeSingle();

        if (!deposit) {
          console.error(`[nowpayments:ipn] deposit ${depositId} not found — ignored`);
          return new Response("Unknown deposit", { status: 404 });
        }
        if (record && record.user_id !== deposit.user_id) {
          console.error(`[nowpayments:ipn] owner mismatch for deposit ${depositId} — rejected`);
          return new Response("Mismatch", { status: 409 });
        }

        // 4. Status handling — only settled payments release funds.
        if (!shouldCredit(status)) {
          const next = isFailedStatus(status)
            ? status === "expired"
              ? "expired"
              : "failed"
            : status === "confirming" || status === "confirmed" || status === "sending"
              ? "confirming"
              : deposit.status;
          if (next !== deposit.status && deposit.status !== "completed") {
            await supabaseAdmin.from("deposits").update({ status: next }).eq("id", depositId);
          }
          console.info(`[nowpayments:ipn] deposit ${depositId} status=${status} (no credit)`);
          return Response.json({ ok: true, credited: false, status });
        }

        // 5. Amount sanity check against the invoiced USD amount.
        if (priceAmount && Number(deposit.amount) > priceAmount + 0.01) {
          console.error(
            `[nowpayments:ipn] amount mismatch for deposit ${depositId}: invoiced ${deposit.amount}, reported ${priceAmount}`,
          );
          return new Response("Amount mismatch", { status: 409 });
        }

        // 6. Atomic + idempotent credit.
        const { data: result, error: rpcError } = await supabaseAdmin.rpc("credit_deposit", {
          p_deposit_id: depositId,
          p_paid_amount: null,
          p_payment_id: paymentId,
          p_status: status,
        });

        if (rpcError) {
          console.error(`[nowpayments:ipn] credit failed for ${depositId}`, rpcError.message);
          return new Response("Credit failed", { status: 500 });
        }

        console.info(`[nowpayments:ipn] deposit ${depositId} processed`, result);
        return Response.json({ ok: true, credited: true, result });
      },
    },
  },
});

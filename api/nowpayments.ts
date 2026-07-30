import { createError, defineEventHandler, readBody, getRequestHeaders, getRequestURL } from "h3";
import crypto from "node:crypto";

function getEnv(name: string) {
  return process.env[name] ?? "";
}

function getNowPaymentsConfig() {
  return {
    apiKey: getEnv("NOWPAYMENTS_API_KEY").trim(),
    ipnSecret: getEnv("NOWPAYMENTS_IPN_SECRET").trim(),
    apiUrl: getEnv("NOWPAYMENTS_API_URL") || "https://api.nowpayments.io/v1",
  };
}

function getSignatureHeader(headers: Headers | Record<string, string | string[] | undefined>) {
  if (headers instanceof Headers) {
    return (
      headers.get("x-nowpayments-sig") ||
      headers.get("x-nowpayments-signature") ||
      headers.get("x-np-sig") ||
      headers.get("x-ipn-signature") ||
      headers.get("x-nowpayments-hmac-sha256") ||
      ""
    );
  }

  const values = [
    headers["x-nowpayments-sig"],
    headers["x-nowpayments-signature"],
    headers["x-np-sig"],
    headers["x-ipn-signature"],
    headers["x-nowpayments-hmac-sha256"],
  ];

  for (const value of values) {
    if (typeof value === "string" && value) return value;
    if (Array.isArray(value) && value[0]) return value[0];
  }

  return "";
}

function createMockInvoice(payload: Record<string, unknown>) {
  const amount = Number(payload.amount ?? payload.price_amount ?? 1000);
  const currency = String(payload.currency ?? payload.price_currency ?? "USD");
  const crypto = String(payload.crypto_currency ?? "BTC");
  const cryptoAmount = (amount / 65000).toFixed(4);
  const address = "bc1qexampleaddressforlocaltesting";
  const invoiceId = `tn-${Date.now()}`;

  return {
    ok: true,
    invoice_id: invoiceId,
    payment_id: invoiceId,
    status: "waiting",
    price_amount: amount,
    price_currency: currency,
    pay_currency: crypto,
    actually_paid: "0",
    pay_address: address,
    pay_amount: cryptoAmount,
    order_id: payload.order_id ?? invoiceId,
    order_description: payload.order_description ?? "TrueNorth wallet funding",
    invoice_url: `https://nowpayments.io/invoice/${invoiceId}`,
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(address)}`,
  };
}

export default defineEventHandler(async (event) => {
  const method = event.node.req.method?.toUpperCase();
  const path = event.path || "";
  const isWebhook = path.endsWith("/webhook") || path.includes("/webhook");

  if (isWebhook) {
    if (method !== "POST") {
      throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
    }

    const headers = getRequestHeaders(event);
    const body = await readBody(event);
    const rawBody = typeof body === "string" ? body : JSON.stringify(body ?? {});
    const config = getNowPaymentsConfig();
    const signature = getSignatureHeader(headers);

    if (!config.ipnSecret || !signature) {
      throw createError({ statusCode: 401, statusMessage: "Missing webhook signature" });
    }

    const expected = crypto.createHmac("sha256", config.ipnSecret).update(rawBody).digest("hex");
    if (expected !== signature) {
      throw createError({ statusCode: 401, statusMessage: "Invalid webhook signature" });
    }

    return {
      ok: true,
      received: true,
      payload: body,
      message: "Webhook verified successfully",
    };
  }

  if (path.endsWith("/invoice") || path.includes("/invoice")) {
    if (method !== "POST") {
      throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
    }

    const body = (await readBody(event)) || {};
    const config = getNowPaymentsConfig();

    if (!config.apiKey) {
      return createMockInvoice(body);
    }

    const payload = {
      price_amount: Number(body.amount ?? body.price_amount ?? 1000),
      price_currency: body.currency ?? body.price_currency ?? "USD",
      pay_currency: body.crypto_currency ?? body.pay_currency ?? "BTC",
      order_id: body.order_id ?? `tn-${Date.now()}`,
      order_description: body.order_description ?? "TrueNorth wallet funding",
      ipn_callback_url: `${getRequestURL(event).origin}/api/nowpayments/webhook`,
    };

    const response = await fetch(`${config.apiUrl}/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw createError({ statusCode: 502, statusMessage: text || "NOWPayments request failed" });
    }

    const data = await response.json().catch(() => ({}));
    return {
      ok: true,
      ...data,
    };
  }

  throw createError({ statusCode: 404, statusMessage: "Route not found" });
});

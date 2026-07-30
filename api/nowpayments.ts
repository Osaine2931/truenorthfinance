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

function createConfigError(missing: string[]) {
  return createError({
    statusCode: 500,
    statusMessage: `NOWPayments is not configured: missing ${missing.join(", ")}`,
  });
}

function getConfigValidationError(config: ReturnType<typeof getNowPaymentsConfig>) {
  const missing: string[] = [];
  if (!config.apiKey) missing.push("NOWPAYMENTS_API_KEY");
  if (!config.ipnSecret) missing.push("NOWPAYMENTS_IPN_SECRET");
  return missing.length ? createConfigError(missing) : null;
}

async function creditWalletForDeposit(payload: Record<string, unknown>) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[nowpayments] missing Supabase credentials for wallet crediting");
    return;
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const depositId = String(payload.deposit_id ?? payload.order_id ?? "");
  const userId = String(payload.user_id ?? payload.customer_id ?? "");
  const amount = Number(payload.amount ?? payload.price_amount ?? 0);
  if (!depositId && !userId) return;

  const depositFilter = depositId ? { column: "id", operator: "eq", value: depositId } : null;
  const userFilter = userId ? { column: "user_id", operator: "eq", value: userId } : null;

  const depositQuery = depositFilter
    ? supabaseAdmin.from("deposits").select("id,user_id,amount,status").eq("id", depositId)
    : userFilter
      ? supabaseAdmin.from("deposits").select("id,user_id,amount,status").eq("user_id", userId)
      : null;

  if (!depositQuery) return;
  const { data: deposits, error: depositError } = await depositQuery.order("created_at", {
    ascending: false,
  });
  if (depositError || !deposits?.length) return;

  const deposit = deposits[0];
  if (deposit.status === "completed") return;

  const walletResponse = await supabaseAdmin
    .from("wallets")
    .select("id,available_balance,total_deposited,has_deposited")
    .eq("user_id", deposit.user_id)
    .maybeSingle();
  if (walletResponse.error || !walletResponse.data) return;

  const nextBalance = Number(walletResponse.data.available_balance ?? 0) + Number(deposit.amount ?? 0);
  const nextDeposited = Number(walletResponse.data.total_deposited ?? 0) + Number(deposit.amount ?? 0);

  await supabaseAdmin
    .from("wallets")
    .update({
      available_balance: nextBalance,
      total_deposited: nextDeposited,
      has_deposited: true,
    })
    .eq("user_id", deposit.user_id);

  await supabaseAdmin.from("deposits").update({ status: "completed" }).eq("id", deposit.id);
  await supabaseAdmin.from("transactions").insert({
    user_id: deposit.user_id,
    type: "Deposit",
    direction: "in",
    amount: Number(deposit.amount ?? 0),
    status: "completed",
    description: "NOWPayments webhook confirmation",
  });
  await supabaseAdmin.from("activities").insert({
    user_id: deposit.user_id,
    action: "Deposit confirmed",
    detail: `NOWPayments deposit credited ${amount || Number(deposit.amount ?? 0)}`,
  });
  await supabaseAdmin.from("notifications").insert({
    user_id: deposit.user_id,
    title: "Deposit completed",
    body: "Your wallet has been credited successfully.",
    kind: "success",
  });
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

    await creditWalletForDeposit(typeof body === "object" && body ? body : {});

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
    const validationError = getConfigValidationError(config);
    if (validationError) {
      throw validationError;
    }

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

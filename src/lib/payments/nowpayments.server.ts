/**
 * Server-only NOWPayments integration.
 *
 * Nothing in this module may be imported from client code: it reads the
 * NOWPayments API key and IPN secret from the server environment.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export type NowPaymentsStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "partially_paid"
  | "finished"
  | "failed"
  | "refunded"
  | "expired";

/** Only these statuses release funds into a member wallet. */
const CREDIT_STATUSES: NowPaymentsStatus[] = ["finished"];
/** Statuses that terminate a payment without crediting. */
const FAILED_STATUSES: NowPaymentsStatus[] = ["failed", "refunded", "expired"];

export function shouldCredit(status: string) {
  return CREDIT_STATUSES.includes(status as NowPaymentsStatus);
}

export function isFailedStatus(status: string) {
  return FAILED_STATUSES.includes(status as NowPaymentsStatus);
}

export type NowPaymentsConfig = {
  apiKey: string;
  ipnSecret: string;
  apiUrl: string;
};

export function getNowPaymentsConfig(): NowPaymentsConfig {
  return {
    apiKey: (process.env["NOWPAYMENTS_API_KEY"] ?? "").trim(),
    ipnSecret: (process.env["NOWPAYMENTS_IPN_SECRET"] ?? "").trim(),
    apiUrl: (process.env["NOWPAYMENTS_API_URL"] ?? "https://api.nowpayments.io/v1").replace(
      /\/$/,
      "",
    ),
  };
}

/** Returns the names (never the values) of missing credentials. */
export function missingNowPaymentsCredentials(config = getNowPaymentsConfig()) {
  const missing: string[] = [];
  if (!config.apiKey) missing.push("NOWPAYMENTS_API_KEY");
  if (!config.ipnSecret) missing.push("NOWPAYMENTS_IPN_SECRET");
  return missing;
}

export type NowPaymentsPayment = {
  payment_id: string | number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  order_id?: string;
  network?: string | null;
  invoice_id?: string | number | null;
  expiration_estimate_date?: string | null;
  valid_until?: string | null;
};

/**
 * Creates a real NOWPayments payment. There is no demo/mock branch: when the
 * credentials are missing or the API rejects the request, this throws.
 */
export async function createNowPaymentsPayment(input: {
  amount: number;
  priceCurrency: string;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl: string;
}): Promise<NowPaymentsPayment> {
  const config = getNowPaymentsConfig();
  const missing = missingNowPaymentsCredentials(config);
  if (missing.length) {
    console.error(`[nowpayments] missing credentials: ${missing.join(", ")}`);
    throw new Error("Payment service is temporarily unavailable.");
  }

  const response = await fetch(`${config.apiUrl}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
    body: JSON.stringify({
      price_amount: input.amount,
      price_currency: input.priceCurrency.toLowerCase(),
      pay_currency: input.payCurrency.toLowerCase(),
      order_id: input.orderId,
      order_description: input.orderDescription,
      ipn_callback_url: input.ipnCallbackUrl,
      is_fixed_rate: true,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    console.error(
      `[nowpayments] payment creation failed (${response.status}) for order ${input.orderId}: ${text.slice(0, 500)}`,
    );
    throw new Error("Unable to create payment invoice. Please try again.");
  }

  let payload: NowPaymentsPayment;
  try {
    payload = JSON.parse(text) as NowPaymentsPayment;
  } catch {
    console.error(`[nowpayments] unparsable payment response for order ${input.orderId}`);
    throw new Error("Unable to create payment invoice. Please try again.");
  }

  if (!payload?.pay_address || !payload?.payment_id) {
    console.error(`[nowpayments] payment response missing address for order ${input.orderId}`);
    throw new Error("Unable to create payment invoice. Please try again.");
  }

  return payload;
}

/** Reads the live status of a payment straight from NOWPayments. */
export async function getNowPaymentsPayment(paymentId: string) {
  const config = getNowPaymentsConfig();
  if (!config.apiKey) return null;
  const response = await fetch(`${config.apiUrl}/payment/${encodeURIComponent(paymentId)}`, {
    headers: { "x-api-key": config.apiKey },
  });
  if (!response.ok) {
    console.error(`[nowpayments] status lookup failed (${response.status}) for ${paymentId}`);
    return null;
  }
  return (await response.json()) as NowPaymentsPayment & { actually_paid?: number };
}

/** NOWPayments signs the JSON body with sorted keys using HMAC-SHA512. */
function sortedStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(sortedStringify).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${sortedStringify((value as Record<string, unknown>)[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
}

export function verifyIpnSignature(rawBody: string, signature: string | null): boolean {
  const { ipnSecret } = getNowPaymentsConfig();
  if (!ipnSecret || !signature) return false;

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return false;
  }

  const expected = createHmac("sha512", ipnSecret).update(sortedStringify(parsed)).digest("hex");
  const received = signature.trim().toLowerCase();
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(received, "utf8");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export function getSignatureHeader(headers: Headers) {
  return (
    headers.get("x-nowpayments-sig") ??
    headers.get("x-nowpayments-signature") ??
    headers.get("x-nowpayments-hmac-sha512") ??
    null
  );
}

/** deposit-{uuid} is the deterministic mapping between a deposit and a payment. */
export function orderIdForDeposit(depositId: string) {
  return `deposit-${depositId}`;
}

export function depositIdFromOrderId(orderId: string | null | undefined) {
  if (!orderId) return null;
  const match = /^deposit-([0-9a-fA-F-]{36})$/.exec(orderId.trim());
  return match ? match[1] : null;
}

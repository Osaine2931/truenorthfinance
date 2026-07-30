export type NowPaymentsInvoice = {
  invoice_id: string;
  payment_id?: string;
  status: string;
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  pay_amount: string;
  pay_address: string;
  qrcode?: string;
  qr_code_url?: string;
  invoice_url?: string;
  expires_at?: string;
  order_id?: string;
  order_description?: string;
  actually_paid?: string;
};

export async function createNowPaymentsInvoice(payload: {
  amount: number;
  currency?: string;
  cryptoCurrency?: string;
  orderId?: string;
  orderDescription?: string;
}) {
  const response = await fetch("/api/nowpayments/invoice", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: payload.amount,
      currency: payload.currency ?? "USD",
      crypto_currency: payload.cryptoCurrency ?? "BTC",
      order_id: payload.orderId,
      order_description: payload.orderDescription,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Unable to create NOWPayments invoice");
  }

  return (await response.json()) as NowPaymentsInvoice;
}

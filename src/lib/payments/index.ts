export type PaymentProviderKey =
  "flutterwave" | "paystack" | "coinbase-commerce" | "nowpayments" | "binance-pay";

export type PaymentProviderConfig = {
  key: PaymentProviderKey;
  label: string;
  enabled: boolean;
  description: string;
};

export type PaymentIntent = {
  id: string;
  provider: PaymentProviderKey;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  redirectUrl?: string;
};

export interface PaymentProvider {
  createPaymentIntent(amount: number, currency?: string): Promise<PaymentIntent>;
}

export function getPaymentProviders(): PaymentProviderConfig[] {
  return [
    {
      key: "flutterwave",
      label: "Flutterwave",
      enabled: false,
      description: "Card and bank payments",
    },
    {
      key: "paystack",
      label: "Paystack",
      enabled: false,
      description: "Cards and bank transfers",
    },
    {
      key: "coinbase-commerce",
      label: "Coinbase Commerce",
      enabled: false,
      description: "Crypto checkout",
    },
    {
      key: "nowpayments",
      label: "NOWPayments",
      enabled: false,
      description: "Cryptocurrency payments",
    },
    {
      key: "binance-pay",
      label: "Binance Pay",
      enabled: false,
      description: "Binance wallet payments",
    },
  ];
}

export function createPaymentProviderStub(provider: PaymentProviderKey): PaymentProvider {
  return {
    async createPaymentIntent(amount: number, currency = "USD") {
      return {
        id: `${provider}-${Date.now()}`,
        provider,
        amount,
        currency,
        status: "pending",
        redirectUrl: undefined,
      };
    },
  };
}

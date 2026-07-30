export type PaymentProviderKey = "nowpayments";

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
      key: "nowpayments",
      label: "NOWPayments",
      enabled: true,
      description: "Secure cryptocurrency invoice funding",
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

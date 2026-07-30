export type EmailTemplateKey =
  | "welcome"
  | "login-notification"
  | "password-reset"
  | "email-verification"
  | "security-alert"
  | "admin-wallet-adjustment"
  | "deposit-approved"
  | "withdrawal-approved";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: EmailTemplateKey;
  metadata?: Record<string, unknown>;
};

export interface EmailProvider {
  send(
    message: EmailMessage,
  ): Promise<{ ok: boolean; provider: string; id?: string; skipped?: boolean }>;
}

export type EmailServiceConfig = {
  provider?: "console" | "smtp" | "custom";
  enabled?: boolean;
};

export class EmailService {
  constructor(
    private provider: EmailProvider,
    private config: EmailServiceConfig = {},
  ) {}

  async send(message: EmailMessage) {
    if (!this.config.enabled) {
      return { ok: true, provider: this.provider.constructor.name, skipped: true };
    }
    return this.provider.send(message);
  }
}

export const defaultEmailServiceConfig: EmailServiceConfig = {
  provider: "console",
  enabled: true,
};

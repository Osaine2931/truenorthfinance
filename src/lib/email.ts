import {
  ConsoleEmailProvider,
  EmailService,
  defaultEmailServiceConfig,
  renderWelcomeTemplate,
  renderLoginTemplate,
  renderPasswordResetTemplate,
  renderVerificationTemplate,
  renderSecurityAlertTemplate,
  renderAdminWalletAdjustmentTemplate,
  renderDepositApprovedTemplate,
  renderWithdrawalApprovedTemplate,
  renderWalletCreditedTemplate,
  renderWalletDebitedTemplate,
  renderInvestmentPurchasedTemplate,
  renderInvestmentCompletedTemplate,
  renderAnnouncementTemplate,
  type EmailMessage,
  type EmailTemplateKey,
} from "./email/index";
import { appendSystemLog } from "@/lib/system-logs";
import { sendSmtpEmail, verifySmtpConnection, getSmtpStatus } from "@/lib/email/smtp";

type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getEnvValue(name: string) {
  return (
    (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[name] : undefined) ??
    undefined
  );
}

function createTextFromHtml(html: string) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const emailService = new EmailService(new ConsoleEmailProvider(), {
  ...defaultEmailServiceConfig,
  provider: "smtp",
  enabled: true,
});

export function getEmailService() {
  return emailService;
}

export async function sendEmailMessage(message: EmailMessage) {
  try {
    return await sendSmtpEmail({
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown email error";
    appendSystemLog({ category: "smtp", level: "error", message: "Email send failed", details: { error: messageText } });
    throw error;
  }
}

export async function sendTemplateEmail({
  to,
  template,
  subject,
  html,
  text,
  metadata,
}: {
  to: string;
  template: EmailTemplateKey;
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    return await sendSmtpEmail({
      to,
      subject,
      html,
      text: text ?? createTextFromHtml(html),
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown email error";
    appendSystemLog({ category: "smtp", level: "error", message: "Template email failed", details: { error: messageText, template } });
    throw error;
  }
}

export async function sendHtmlEmail(payload: EmailPayload) {
  const resendKey = getEnvValue("VITE_RESEND_API_KEY") || getEnvValue("RESEND_API_KEY");
  const resendFrom =
    getEnvValue("VITE_RESEND_FROM") || "TrueNorth Financial <noreply@truenorthfinance.com>";
  const webhookUrl = getEnvValue("VITE_EMAIL_WEBHOOK_URL") || getEnvValue("EMAIL_WEBHOOK_URL");

  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: [payload.to],
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? createTextFromHtml(payload.html),
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error("[email] resend failed", text);
    }
    return { ok: response.ok };
  }

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      console.error("[email] webhook failed", response.status);
    }
    return { ok: response.ok };
  }

  try {
    return await sendTemplateEmail({
      to: payload.to,
      template: "welcome",
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unknown email error";
    appendSystemLog({ category: "smtp", level: "error", message: "HTML email failed", details: { error: messageText } });
    throw error;
  }
}

export async function sendWelcomeEmail({
  email,
  fullName,
  createdAt,
}: {
  email: string;
  fullName?: string;
  createdAt?: string | Date;
}) {
  const prettyDate = createdAt
    ? new Date(createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "just now";
  const displayName = fullName?.trim() || "investor";
  const html = renderWelcomeTemplate({ name: displayName, date: prettyDate });

  return sendTemplateEmail({
    to: email,
    template: "welcome",
    subject: "Welcome to TrueNorth Financial",
    html,
    text: `Welcome to TrueNorth Financial. Your account was created on ${prettyDate}.`,
    metadata: { fullName: displayName, createdAt: prettyDate },
  });
}

export async function sendLoginAlertEmail({
  email,
  fullName,
  loginAt,
  userAgent,
  ipAddress,
}: {
  email: string;
  fullName?: string;
  loginAt?: string | Date;
  userAgent?: string;
  ipAddress?: string;
}) {
  const displayName = fullName?.trim() || "investor";
  const prettyDate = loginAt
    ? new Date(loginAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
    : "just now";
  const html = renderLoginTemplate({
    date: prettyDate,
    device: userAgent || "Unknown device",
    browser: userAgent || "Unknown browser",
    ip: ipAddress || "Unavailable",
  });

  return sendTemplateEmail({
    to: email,
    template: "login-notification",
    subject: "Security notice: TrueNorth Financial sign-in",
    html,
    text: `A successful sign-in was recorded on ${prettyDate}. If this wasn't you, please change your password immediately and contact support.`,
    metadata: { fullName: displayName, loginAt: prettyDate },
  });
}

export async function sendPasswordResetEmail({
  email,
  resetLink,
}: {
  email: string;
  resetLink: string;
}) {
  const html = renderPasswordResetTemplate({ link: resetLink });
  return sendTemplateEmail({
    to: email,
    template: "password-reset",
    subject: "Reset your TrueNorth password",
    html,
    text: "Use the secure link to reset your password.",
  });
}

export async function sendVerificationEmail({
  email,
  verifyLink,
}: {
  email: string;
  verifyLink: string;
}) {
  const html = renderVerificationTemplate({ link: verifyLink });
  return sendTemplateEmail({
    to: email,
    template: "email-verification",
    subject: "Verify your email address",
    html,
    text: "Verify your email to continue.",
  });
}

export async function sendSecurityAlertEmail({
  email,
  subject,
}: {
  email: string;
  subject: string;
}) {
  const html = renderSecurityAlertTemplate({ subject });
  return sendTemplateEmail({ to: email, template: "security-alert", subject, html, text: subject });
}

export async function sendWalletAdjustmentEmail({
  email,
  action,
  amount,
  reason,
}: {
  email: string;
  action: string;
  amount: string;
  reason: string;
}) {
  const html = renderAdminWalletAdjustmentTemplate({ action, amount, reason });
  return sendTemplateEmail({
    to: email,
    template: "admin-wallet-adjustment",
    subject: action,
    html,
    text: `${action}: ${amount}`,
  });
}

export async function sendDepositApprovedEmail({
  email,
  amount,
}: {
  email: string;
  amount: string;
}) {
  const html = renderDepositApprovedTemplate({ amount });
  return sendTemplateEmail({
    to: email,
    template: "deposit-approved",
    subject: "Deposit approved",
    html,
    text: `Your deposit of ${amount} was approved.`,
  });
}

export async function sendWithdrawalApprovedEmail({
  email,
  amount,
}: {
  email: string;
  amount: string;
}) {
  const html = renderWithdrawalApprovedTemplate({ amount });
  return sendTemplateEmail({
    to: email,
    template: "withdrawal-approved",
    subject: "Withdrawal approved",
    html,
    text: `Your withdrawal of ${amount} was approved.`,
  });
}

export async function sendWalletCreditedEmail({ email, amount }: { email: string; amount: string }) {
  const html = renderWalletCreditedTemplate({ amount });
  return sendTemplateEmail({
    to: email,
    template: "wallet-credited",
    subject: "Wallet credited",
    html,
    text: `Your wallet was credited by ${amount}.`,
  });
}

export async function sendWalletDebitedEmail({ email, amount }: { email: string; amount: string }) {
  const html = renderWalletDebitedTemplate({ amount });
  return sendTemplateEmail({
    to: email,
    template: "wallet-debited",
    subject: "Wallet debited",
    html,
    text: `Your wallet was debited by ${amount}.`,
  });
}

export async function sendInvestmentPurchasedEmail({
  email,
  plan,
  amount,
}: {
  email: string;
  plan: string;
  amount: string;
}) {
  const html = renderInvestmentPurchasedTemplate({ plan, amount });
  return sendTemplateEmail({
    to: email,
    template: "investment-purchased",
    subject: "Investment purchased",
    html,
    text: `Your ${plan} investment of ${amount} is now active.`,
  });
}

export async function sendInvestmentCompletedEmail({
  email,
  plan,
}: {
  email: string;
  plan: string;
}) {
  const html = renderInvestmentCompletedTemplate({ plan });
  return sendTemplateEmail({
    to: email,
    template: "investment-completed",
    subject: "Investment completed",
    html,
    text: `Your ${plan} investment has matured and profits were credited.`,
  });
}

export async function sendAnnouncementEmail({
  email,
  title,
  body,
}: {
  email: string;
  title: string;
  body: string;
}) {
  const html = renderAnnouncementTemplate({ title, body });
  return sendTemplateEmail({
    to: email,
    template: "announcement",
    subject: title,
    html,
    text: body,
  });
}

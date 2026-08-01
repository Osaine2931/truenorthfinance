import nodemailer from "nodemailer";
import type { SendMailOptions, Transporter } from "nodemailer";
import { appendSystemLog } from "@/lib/system-logs";

let transporter: Transporter | null = null;
let lastConnectionError: string | null = null;
let lastEmailError: string | null = null;
let lastEmailSentAt: string | null = null;

function getConfig() {
  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: (process.env.SMTP_SECURE || "false") === "true",
    user: process.env.SMTP_USER || process.env.GMAIL_USER || "",
    pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "",
    from: process.env.SMTP_FROM || process.env.GMAIL_FROM || "TrueNorth Financial <noreply@truenorthfinance.com>",
  };
}

export function getSmtpStatus() {
  return {
    connected: Boolean(transporter),
    configured: Boolean(getConfig().user && getConfig().pass),
    lastConnectionError,
    lastEmailError,
    lastEmailSentAt,
  };
}

export async function verifySmtpConnection() {
  const config = getConfig();
  if (!config.user || !config.pass) {
    const message = "SMTP credentials are missing";
    lastConnectionError = message;
    appendSystemLog({ category: "smtp", level: "error", message, details: { configured: false } });
    return { ok: false, connected: false, message, error: message };
  }

  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    connectionTimeout: 20000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });

  try {
    await transporter.verify();
    lastConnectionError = null;
    appendSystemLog({ category: "smtp", level: "info", message: "SMTP connection verified" });
    return { ok: true, connected: true, message: "SMTP Connected" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMTP verification failed";
    lastConnectionError = message;
    appendSystemLog({ category: "smtp", level: "error", message: "SMTP verification failed", details: { error: message } });
    return { ok: false, connected: false, message, error: message };
  }
}

export async function sendSmtpEmail(message: { to: string; subject: string; html: string; text?: string }) {
  const config = getConfig();
  if (!config.user || !config.pass) {
    const error = "SMTP credentials are missing";
    lastEmailError = error;
    appendSystemLog({ category: "smtp", level: "error", message: "Email send failed", details: { error } });
    throw new Error(error);
  }

  if (!transporter) {
    const verification = await verifySmtpConnection();
    if (!verification.ok) {
      throw new Error(verification.error || "SMTP is unavailable");
    }
  }

  try {
    const info = await transporter!.sendMail({
      from: config.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text || message.html.replace(/<[^>]+>/g, " ").trim(),
    });
    lastEmailError = null;
    lastEmailSentAt = new Date().toISOString();
    appendSystemLog({ category: "smtp", level: "info", message: "Email sent", details: { to: message.to, messageId: info.messageId } });
    return { ok: true, provider: "smtp", id: info.messageId };
  } catch (error) {
    const failure = error instanceof Error ? error.message : "Email send failed";
    lastEmailError = failure;
    appendSystemLog({ category: "smtp", level: "error", message: "Email send failed", details: { error: failure, to: message.to } });
    throw error;
  }
}

import { defineEventHandler, readBody, createError } from "h3";
import { verifySmtpConnection, getSmtpStatus, sendSmtpEmail } from "../../src/lib/email/smtp";
import { appendSystemLog } from "../../src/lib/system-logs";

export default defineEventHandler(async (event) => {
  if (event.node?.req.method?.toUpperCase() !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = ((await readBody(event)) ?? {}) as Record<string, unknown>;
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "TrueNorth Financial SMTP Test").trim();

  const verification = await verifySmtpConnection();
  const status = getSmtpStatus();

  if (!verification.ok || !to) {
    appendSystemLog({
      category: "smtp",
      level: "error",
      message: "SMTP test failed",
      details: { recipient: to || null, verification },
    });
    return {
      ok: false,
      smtpConnected: verification.ok,
      status,
      message: to ? verification.message : "Recipient email is required",
      diagnostics: { verification, status },
    };
  }

  try {
    const result = await sendSmtpEmail({
      to,
      subject,
      html: `<p>This is a test email from TrueNorth Financial.</p><p>SMTP connection and delivery are working.</p>`,
      text: "TrueNorth Financial SMTP test email.",
    });
    appendSystemLog({
      category: "smtp",
      level: "info",
      message: "SMTP test email delivered",
      details: { recipient: to, result },
    });
    return {
      ok: true,
      smtpConnected: true,
      result,
      status: getSmtpStatus(),
      message: "SMTP test email sent successfully",
      diagnostics: { verification, status: getSmtpStatus(), result },
    };
  } catch (error) {
    appendSystemLog({
      category: "smtp",
      level: "error",
      message: "SMTP test email failed",
      details: { recipient: to, error: error instanceof Error ? error.message : undefined },
    });
    return {
      ok: false,
      smtpConnected: false,
      status: getSmtpStatus(),
      message: error instanceof Error ? error.message : "SMTP test email failed",
      error: error instanceof Error ? error.message : undefined,
      diagnostics: { verification, status: getSmtpStatus(), error: error instanceof Error ? error.message : undefined },
    };
  }
});

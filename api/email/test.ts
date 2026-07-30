import { defineEventHandler, readBody, createError } from "h3";
import { verifySmtpConnection, getSmtpStatus, sendSmtpEmail } from "../../src/lib/email/smtp";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const body = (await readBody(event)) || {};
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "TrueNorth Financial SMTP Test").trim();

  const verification = await verifySmtpConnection();
  const status = getSmtpStatus();

  if (!verification.ok || !to) {
    return {
      ok: false,
      smtpConnected: verification.ok,
      status,
      message: to ? verification.message : "Recipient email is required",
    };
  }

  try {
    const result = await sendSmtpEmail({
      to,
      subject,
      html: `<p>This is a test email from TrueNorth Financial.</p><p>SMTP connection and delivery are working.</p>`,
      text: "TrueNorth Financial SMTP test email.",
    });
    return {
      ok: true,
      smtpConnected: true,
      result,
      status: getSmtpStatus(),
      message: "SMTP test email sent successfully",
    };
  } catch (error) {
    return {
      ok: false,
      smtpConnected: false,
      status: getSmtpStatus(),
      message: error instanceof Error ? error.message : "SMTP test email failed",
      error: error instanceof Error ? error.message : undefined,
    };
  }
});

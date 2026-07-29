type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

function getEnvValue(name: string) {
  return (typeof import.meta !== "undefined" && import.meta.env ? import.meta.env[name] : undefined) ?? undefined;
}

export async function sendHtmlEmail(payload: EmailPayload) {
  const resendKey = getEnvValue("VITE_RESEND_API_KEY") || getEnvValue("RESEND_API_KEY");
  const resendFrom = getEnvValue("VITE_RESEND_FROM") || "TrueNorth Financial <noreply@truenorthfinance.com>";
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
        text: payload.text ?? payload.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
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

  console.info("[email] skipped", payload.subject, payload.to);
  return { ok: true, skipped: true };
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
  const prettyDate = createdAt ? new Date(createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "just now";
  const displayName = fullName?.trim() || "investor";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f5f8ff;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="background:linear-gradient(135deg,#1d4ed8 0%,#3b82f6 100%);padding:24px 32px;color:white;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">TRUENORTH FINANCIAL</p>
          <h1 style="margin:8px 0 0;font-size:28px;">Welcome aboard, ${displayName}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 12px;font-size:16px;">Your TrueNorth Financial account is now active.</p>
          <ul style="padding-left:20px;line-height:1.7;color:#334155;">
            <li><strong>User:</strong> ${displayName}</li>
            <li><strong>Registered:</strong> ${prettyDate}</li>
            <li><strong>Security:</strong> Keep this email address secure and never share your password.</li>
          </ul>
          <p style="margin-top:24px;padding:16px 20px;background:#f8fafc;border-left:4px solid #3b82f6;border-radius:12px;color:#334155;">
            A $1,000 welcome bonus has been credited to your wallet and is ready to support your first deposit.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: email,
    subject: "Welcome to TrueNorth Financial",
    html,
    text: `Welcome to TrueNorth Financial. Your account was created on ${prettyDate}.`,
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
  const prettyDate = loginAt ? new Date(loginAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "just now";
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);padding:24px 32px;color:white;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Security Alert</p>
          <h1 style="margin:8px 0 0;font-size:24px;">New sign-in detected</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 12px;">Hello ${displayName},</p>
          <p style="margin:0 0 16px;line-height:1.7;color:#334155;">A successful sign-in was recorded for your TrueNorth Financial account on ${prettyDate}.</p>
          <ul style="padding-left:20px;line-height:1.7;color:#334155;">
            <li><strong>Date & Time:</strong> ${prettyDate}</li>
            <li><strong>Browser:</strong> ${userAgent || "Unknown browser"}</li>
            <li><strong>IP Address:</strong> ${ipAddress || "Unavailable"}</li>
          </ul>
          <p style="margin-top:20px;padding:16px 20px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:12px;color:#4b5563;">
            If this wasn't you, please change your password immediately and contact support.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendHtmlEmail({
    to: email,
    subject: "Security notice: TrueNorth Financial sign-in",
    html,
    text: `A successful sign-in was recorded on ${prettyDate}. If this wasn't you, please change your password immediately and contact support.`,
  });
}

export const brandingStyles = `
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: #f8fafc;
  font-family: Inter, Arial, sans-serif;
`;

export function renderWelcomeTemplate({ name, date }: { name: string; date: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">TRUENORTH FINANCIAL</p>
          <h1 style="margin:8px 0 0;font-size:28px;">Welcome, ${name}</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p>Your account is ready and your $1,000 welcome bonus has been prepared for your first deposit.</p>
          <p><strong>Registration date:</strong> ${date}</p>
          <p style="margin-top:16px;padding:16px 20px;border-left:4px solid #3b82f6;background:#f8fafc;border-radius:12px;">Security reminder: keep your password private and never share your login details.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderLoginTemplate({ date, device, browser, ip }: { date: string; device: string; browser: string; ip: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Security Notice</p>
          <h1 style="margin:8px 0 0;font-size:24px;">Successful sign-in detected</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p>Your account was signed in successfully on ${date}.</p>
          <ul>
            <li><strong>Device:</strong> ${device}</li>
            <li><strong>Browser:</strong> ${browser}</li>
            <li><strong>IP Address:</strong> ${ip}</li>
          </ul>
          <p style="margin-top:16px;padding:16px 20px;border-left:4px solid #ef4444;background:#fef2f2;border-radius:12px;">If this wasn’t you, please change your password immediately and contact support.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderPasswordResetTemplate({ link }: { link: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">TRUENORTH FINANCIAL</p>
          <h1 style="margin:8px 0 0;font-size:24px;">Reset your password</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p>Use the secure link below to create a new password.</p>
          <p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d4ed8;color:#fff;text-decoration:none;">Reset password</a></p>
        </div>
      </div>
    </div>
  `;
}

export function renderVerificationTemplate({ link }: { link: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Verify Email</p>
          <h1 style="margin:8px 0 0;font-size:24px;">Confirm your email address</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p>Click the button below to verify your email and continue accessing your account.</p>
          <p><a href="${link}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;">Verify email</a></p>
        </div>
      </div>
    </div>
  `;
}

export function renderSecurityAlertTemplate({ subject }: { subject: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #fee2e2;">
        <div style="background:#111827;padding:24px 32px;color:#fff;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Security Alert</p>
          <h1 style="margin:8px 0 0;font-size:24px;">${subject}</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p>Please review your account activity immediately. If this action was not expected, secure your account right away.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderAdminWalletAdjustmentTemplate({ action, amount, reason }: { action: string; amount: string; reason: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Wallet Update</p>
          <h1 style="margin:8px 0 0;font-size:24px;">${action}</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p style="margin-top:16px;">This update was processed by our administrative team.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderDepositApprovedTemplate({ amount }: { amount: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Deposit Confirmed</p>
          <h1 style="margin:8px 0 0;font-size:24px;">Your deposit has been approved</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p><strong>Amount credited:</strong> ${amount}</p>
          <p>Funds are now available in your wallet and ready for future investment activity.</p>
        </div>
      </div>
    </div>
  `;
}

export function renderWithdrawalApprovedTemplate({ amount }: { amount: string }) {
  return `
    <div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #dbeafe;">
        <div style="${brandingStyles};padding:24px 32px;">
          <p style="margin:0;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;">Withdrawal Confirmed</p>
          <h1 style="margin:8px 0 0;font-size:24px;">Your withdrawal has been approved</h1>
        </div>
        <div style="padding:32px;color:#334155;line-height:1.7;">
          <p><strong>Amount sent:</strong> ${amount}</p>
          <p>Your request was processed successfully and you will receive an update once the transfer completes.</p>
        </div>
      </div>
    </div>
  `;
}

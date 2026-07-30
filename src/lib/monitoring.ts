import { createMonitoringSnapshot } from "./automation";
import { appendSystemLog, getSystemLogs } from "./system-logs";
import { getSmtpStatus } from "./email/smtp";

function getNowPaymentsStatus() {
  const apiKey = Boolean(process.env.NOWPAYMENTS_API_KEY);
  const ipnSecret = Boolean(process.env.NOWPAYMENTS_IPN_SECRET);
  return {
    connected: apiKey && ipnSecret,
    apiKeyLoaded: apiKey,
    ipnSecretLoaded: ipnSecret,
    apiStatus: apiKey ? "Available" : "Missing API key",
    lastPayment: null,
    lastWebhook: null,
  };
}

export async function getMonitoringSnapshot() {
  const smtp = getSmtpStatus();
  const payments = getNowPaymentsStatus();

  appendSystemLog({
    category: "system",
    level: smtp.connected ? "info" : "warn",
    message: smtp.connected ? "System monitoring refreshed" : "System monitoring refreshed with SMTP warnings",
    details: { smtp, payments },
  });

  return {
    ...createMonitoringSnapshot({
      errors: getSystemLogs(200).filter((entry) => entry.level === "error").length,
    }),
    smtpConnected: smtp.connected,
    smtpConfigured: smtp.configured,
    smtpLastError: smtp.lastConnectionError || smtp.lastEmailError || null,
    paymentsConnected: payments.connected,
    paymentsApiKeyLoaded: payments.apiKeyLoaded,
    paymentsIpnSecretLoaded: payments.ipnSecretLoaded,
    paymentsApiStatus: payments.apiStatus,
    uptimeSeconds: 0,
    buildVersion: process.env.BUILD_VERSION || "dev",
    deploymentEnvironment: process.env.NODE_ENV || "development",
  };
}

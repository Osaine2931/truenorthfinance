/**
 * Client-safe NOWPayments surface.
 *
 * Invoice creation happens exclusively in `nowpayments.functions.ts` (server),
 * so no API credentials and no static/demo payment addresses exist here.
 */
export type { DepositInvoice } from "./nowpayments.functions";
export { createDepositInvoice, refreshDepositStatus } from "./nowpayments.functions";

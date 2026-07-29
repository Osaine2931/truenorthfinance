/**
 * API service layer.
 *
 * UI components import from `@/lib/api` (or a specific module such as
 * `@/lib/api/wallet`) and never talk to the backend client directly.
 * Only `client.ts` knows which backend is behind the API.
 */
export * from "./client";
export * from "./format";
export * from "./auth";
export * from "./profile";
export * from "./wallet";
export * from "./investments";
export * from "./transactions";
export * from "./notifications";
export * from "./admin";
export * from "./audit";
export * from "./kyc";
export * from "./support";

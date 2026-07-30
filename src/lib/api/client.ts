/**
 * Transport layer.
 *
 * Every service module in `src/lib/api/*` talks to the backend ONLY through the
 * helpers in this file. Swapping the backend (e.g. to Vercel Functions + Postgres)
 * means rewriting this one module plus the query bodies — no UI component changes.
 */
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export { supabase };
export type { Tables, TablesInsert };

export type Wallet = Tables<"wallets">;
export type Profile = Tables<"profiles">;
export type Plan = Tables<"investment_plans">;
export type CryptoMethod = Tables<"crypto_methods">;
export type Deposit = Tables<"deposits">;
export type Withdrawal = Tables<"withdrawals">;
export type Investment = Tables<"investments">;
export type Transaction = Tables<"transactions">;
export type Activity = Tables<"activities">;
export type Notification = Tables<"notifications">;
export type Referral = Tables<"referrals">;
export type Announcement = Tables<"announcements">;
export type SiteSetting = Tables<"site_settings">;
export type AuditLog = Tables<"admin_audit_logs">;

export function unwrap<T>({
  data,
  error,
}: {
  data: T | null;
  error: { message: string } | null;
}): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

export function assertOk(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) => keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
}

export function useAdminInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["plans"] });
    qc.invalidateQueries({ queryKey: ["wallet"] });
  };
}

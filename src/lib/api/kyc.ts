import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./auth";
import { unwrap, useInvalidate, type Tables } from "./client";

export type KycRecord = Tables<"kyc_verifications">;

export function useKyc() {
  return useQuery({
    queryKey: ["kyc"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase
        .from("kyc_verifications")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as KycRecord | null) ?? null;
    },
  });
}

export function useSubmitKyc() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      level,
      document_url,
      selfie_url,
      notes,
    }: {
      level: number;
      document_url?: string | null;
      selfie_url?: string | null;
      notes?: string | null;
    }) => {
      const uid = await currentUserId();
      const { data, error } = await supabase
        .from("kyc_verifications")
        .upsert(
          {
            user_id: uid,
            level,
            document_url: document_url ?? null,
            selfie_url: selfie_url ?? null,
            notes: notes ?? null,
            status: "pending",
          },
          { onConflict: "user_id" },
        )
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => invalidate(["kyc"]),
  });
}

export function useAdminKyc() {
  return useQuery({
    queryKey: ["admin", "kyc"],
    queryFn: async () =>
      unwrap<KycRecord[]>(
        await supabase
          .from("kyc_verifications")
          .select("*")
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useReviewKyc() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "approved" | "rejected" | "resubmission_requested";
      reason?: string | null;
    }) => {
      const { error } = await supabase
        .from("kyc_verifications")
        .update({ status, review_reason: reason ?? null })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["kyc", "admin", "kyc"]),
  });
}

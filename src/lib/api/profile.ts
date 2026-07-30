import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./auth";
import { unwrap, useInvalidate, type Profile } from "./client";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const uid = await currentUserId();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as Profile | null;
    },
  });
}

export function useUpdateProfile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (
      patch: Partial<Pick<Profile, "full_name" | "phone" | "country" | "avatar_url">>,
    ) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("profiles").update(patch).eq("user_id", uid);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["profile"]),
  });
}

export function useReferrals() {
  return useQuery({
    queryKey: ["referrals"],
    queryFn: async () =>
      unwrap(
        await supabase.from("referrals").select("*").order("created_at", { ascending: false }),
      ),
  });
}

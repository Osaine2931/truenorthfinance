import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./auth";
import { unwrap, useInvalidate, type Notification } from "./client";

export function useNotifications(limit?: number) {
  return useQuery({
    queryKey: ["notifications", limit ?? "all"],
    queryFn: async () => {
      let q = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      return unwrap<Notification[]>(await q);
    },
  });
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (ids?: string[]) => {
      const uid = await currentUserId();
      let q = supabase.from("notifications").update({ is_read: true }).eq("user_id", uid);
      if (ids?.length) q = q.in("id", ids);
      const { error } = await q;
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["notifications"]),
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const uid = await currentUserId();
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id)
        .eq("user_id", uid);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["notifications"]),
  });
}

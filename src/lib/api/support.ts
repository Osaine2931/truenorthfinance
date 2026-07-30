import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { currentUserId } from "./auth";
import { unwrap, useInvalidate } from "./client";

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  attachment_url: string | null;
  created_at: string;
};

export function useSupportTickets() {
  return useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const uid = await currentUserId();
      return unwrap<SupportTicket[]>(
        await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false }),
      );
    },
  });
}

export function useAdminSupportTickets() {
  return useQuery({
    queryKey: ["admin", "support-tickets"],
    queryFn: async () =>
      unwrap<SupportTicket[]>(
        await supabase
          .from("support_tickets")
          .select("*")
          .order("created_at", { ascending: false }),
      ),
  });
}

export function useCreateSupportTicket() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      subject,
      message,
      attachment_url,
      priority,
    }: {
      subject: string;
      message: string;
      attachment_url?: string | null;
      priority?: string;
    }) => {
      const uid = await currentUserId();
      const { error } = await supabase.from("support_tickets").insert({
        user_id: uid,
        subject,
        message,
        attachment_url: attachment_url ?? null,
        priority: priority ?? "medium",
        status: "open",
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["support-tickets", "admin", "support-tickets"]),
  });
}

export function useReplySupportTicket() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const { error } = await supabase
        .from("support_tickets")
        .update({ message: message })
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["support-tickets", "admin", "support-tickets"]),
  });
}

export function useUpdateSupportTicket() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      priority,
    }: {
      id: string;
      status?: string;
      priority?: string;
    }) => {
      const patch: { status?: string; priority?: string } = {};
      if (status) patch.status = status;
      if (priority) patch.priority = priority;
      const { error } = await supabase.from("support_tickets").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => invalidate(["support-tickets", "admin", "support-tickets"]),
  });
}

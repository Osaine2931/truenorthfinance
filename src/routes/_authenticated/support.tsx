import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, LifeBuoy, Send } from "lucide-react";
import { useCreateSupportTicket, useSupportTickets } from "@/lib/api";
import { PageHeader, SectionCard, Field, inputClass, btnPrimary, EmptyState, RowsSkeleton } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/support")({
  head: () => ({ meta: [{ title: "Support — TrueNorth Financial" }] }),
  component: Support,
});

function Support() {
  const tickets = useSupportTickets();
  const createTicket = useCreateSupportTicket();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("medium");

  async function saveTicket() {
    try {
      await createTicket.mutateAsync({ subject, message, priority });
      setSubject("");
      setMessage("");
      toast.success("Support ticket created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    }
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Support" subtitle="Create a ticket and receive specialist guidance." />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Mail, title: "Email", value: "support@truenorthfinance.com" },
          { icon: MessageCircle, title: "Live chat", value: "Available now" },
          { icon: LifeBuoy, title: "Help center", value: "Browse articles" },
        ].map((c) => (
          <div key={c.title} className="surface-card p-5">
            <div className="grid size-9 place-items-center rounded-md bg-royal-soft text-royal">
              <c.icon className="size-4" />
            </div>
            <p className="mt-3 font-medium text-foreground">{c.title}</p>
            <p className="text-sm text-muted-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Create a support ticket">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Subject">
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="Need help with a withdrawal" />
          </Field>
          <Field label="Priority">
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>
        <Field label="Message" hint="Include screenshots and transaction details where possible.">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className={`${inputClass} mt-1 min-h-28`} placeholder="Describe your issue or request" />
        </Field>
        <button onClick={saveTicket} disabled={createTicket.isPending || !subject.trim() || !message.trim()} className={`${btnPrimary} mt-4`}>
          <Send className="size-4" /> Create ticket
        </button>
      </SectionCard>

      <SectionCard title="Your tickets" bodyClassName="p-0">
        {tickets.isLoading ? (
          <div className="p-5"><RowsSkeleton rows={3} /></div>
        ) : tickets.data?.length ? (
          <ul>
            {tickets.data.map((ticket) => (
              <li key={ticket.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0">
                <div>
                  <p className="text-sm font-medium text-navy">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.message}</p>
                </div>
                <span className="rounded-full bg-royal-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-royal">{ticket.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={LifeBuoy} title="No tickets yet" description="Your support requests will appear here." />
        )}
      </SectionCard>
    </div>
  );
}

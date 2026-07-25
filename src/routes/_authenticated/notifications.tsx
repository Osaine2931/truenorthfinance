import { createFileRoute } from "@tanstack/react-router";
import { notifications } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Aurelian" }] }),
  component: Notifications,
});

function Notifications() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Portfolio updates and account activity.</p>
      </div>
      <div className="surface-card overflow-hidden">
        {notifications.map((n) => (
          <div key={n.id} className="flex gap-3 border-b border-border p-5 last:border-0">
            <span
              className={`mt-2 size-2 shrink-0 rounded-full ${n.unread ? "bg-gold" : "bg-transparent"}`}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-foreground">{n.title}</p>
                <p className="shrink-0 text-xs text-muted-foreground">{n.time}</p>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

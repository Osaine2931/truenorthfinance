import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck } from "lucide-react";
import { useNotifications, useMarkNotificationsRead, formatDateTime } from "@/lib/api";
import { PageHeader, SectionCard, EmptyState, RowsSkeleton, btnGhost } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — TrueNorth Financial" },
      { name: "description", content: "Account alerts, deposit confirmations and platform announcements." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const notifications = useNotifications();
  const markRead = useMarkNotificationsRead();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Alerts about your account and investments."
        action={
          <button onClick={() => markRead.mutate(undefined)} className={btnGhost}>
            <CheckCheck className="size-4" /> Mark all read
          </button>
        }
      />
      <SectionCard bodyClassName="p-0">
        {notifications.isLoading ? (
          <div className="p-5">
            <RowsSkeleton rows={4} />
          </div>
        ) : notifications.data?.length ? (
          <ul>
            {notifications.data.map((n) => (
              <li
                key={n.id}
                className={`flex items-start gap-3 border-b border-border/60 px-5 py-4 last:border-0 ${
                  n.is_read ? "" : "bg-royal-soft/40"
                }`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-royal-soft text-royal">
                  <Bell className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(n.created_at)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Bell} title="Nothing new" description="You're all caught up." />
        )}
      </SectionCard>
    </div>
  );
}

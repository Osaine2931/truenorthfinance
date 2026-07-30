import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { useNotifications, useMarkNotificationsRead, useDeleteNotification, formatDateTime } from "@/lib/api";
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
  const deleteNotification = useDeleteNotification();

  function handleRead(n: { id: string; is_read: boolean }) {
    if (!n.is_read) {
      markRead.mutate([n.id]);
    }
  }

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>, id: string) {
    event.stopPropagation();
    deleteNotification.mutate(id);
  }

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
                onClick={() => handleRead(n)}
                className={`flex cursor-pointer items-start gap-3 border-b border-border/60 px-5 py-4 last:border-0 ${
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
                <button
                  type="button"
                  onClick={(event) => handleDelete(event, n.id)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive"
                  aria-label="Delete notification"
                >
                  <Trash2 className="size-4" />
                </button>
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

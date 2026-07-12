import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { PageHeader, Card, Button, EmptyState, Spinner } from "../../components/ui";
import {
  useNotifications,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "../../features/notifications/hooks";

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useNotifications();
  const markAll = useMarkAllNotificationsRead();
  const markOne = useMarkNotificationRead();

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Deadlines, approvals, RFIs, and everything else that needs your attention."
        actions={
          <Button variant="secondary" onClick={() => markAll.mutate()}>
            Mark all read
          </Button>
        }
      />
      {isLoading ? (
        <Spinner />
      ) : !notifications?.length ? (
        <EmptyState title="You're all caught up" description="No notifications yet." />
      ) : (
        <Card className="divide-y divide-ink-100">
          {notifications.map((n) => (
            <Link
              key={n.id}
              to={n.link ?? "#"}
              onClick={() => !n.read && markOne.mutate(n.id)}
              className={`flex items-start justify-between gap-4 px-5 py-4 hover:bg-ink-50 ${
                n.read ? "" : "bg-accent-100/30"
              }`}
            >
              <div>
                <div className="text-sm font-medium text-ink-900">{n.title}</div>
                {n.body && <div className="mt-0.5 text-sm text-ink-500">{n.body}</div>}
              </div>
              <div className="shrink-0 text-xs text-ink-400">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
              </div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

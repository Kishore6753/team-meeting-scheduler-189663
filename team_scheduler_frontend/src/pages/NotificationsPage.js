import React, { useEffect } from "react";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { useNotificationsSocket } from "../ws/useNotificationsSocket";

// PUBLIC_INTERFACE
export function NotificationsPage() {
  /** Notifications/reminders page. */
  const data = useAppData();

  useEffect(() => {
    data.refreshNotifications();
  }, [data]);

  useNotificationsSocket({
    enabled: true,
    onEvent: () => {
      // On any server-sent event, refresh notifications to keep UI in sync.
      data.refreshNotifications();
    },
  });

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">Notifications</h1>
          <p className="muted">Reminders and updates for your meetings.</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" onClick={() => data.refreshNotifications()}>
            Refresh
          </Button>
        </div>
      </div>

      <Card title="All notifications">
        {data.loading.notifications ? <div className="skeleton">Loading notifications…</div> : null}
        {data.error.notifications ? <div className="alert alert-error">{data.error.notifications}</div> : null}

        {!data.loading.notifications && !data.error.notifications && data.notifications.length === 0 ? (
          <EmptyState title="No notifications" description="Reminders will show up here when meetings approach." />
        ) : (
          <div className="noti-list">
            {data.notifications.map((n) => (
              <div key={n.id} className={`noti-row ${n.read ? "" : "unread"}`}>
                <div className="noti-col">
                  <div className="noti-msg">{n.message}</div>
                  <div className="noti-meta">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="noti-actions">
                  <Button variant="ghost" onClick={() => data.markNotificationRead(n.id, !n.read)}>
                    Mark {n.read ? "unread" : "read"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

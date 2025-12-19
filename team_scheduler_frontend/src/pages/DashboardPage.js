import React, { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAfter } from "date-fns";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MeetingList } from "../components/meetings/MeetingList";

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Dashboard page: upcoming meetings overview. */
  const data = useAppData();
  const navigate = useNavigate();

  useEffect(() => {
    data.refreshMeetings();
    data.refreshNotifications();
  }, [data]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return (data.meetings || []).filter((m) => isAfter(new Date(m.endTime), now)).slice(0, 5);
  }, [data.meetings]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">Dashboard</h1>
          <p className="muted">Your next meetings and reminders.</p>
        </div>
        <div className="page-actions">
          <Button onClick={() => navigate("/meetings/new")}>+ New meeting</Button>
        </div>
      </div>

      <div className="grid-2-xl">
        <Card
          title="Upcoming meetings"
          actions={
            <Link className="link" to="/meetings">
              View all
            </Link>
          }
        >
          {data.loading.meetings ? <div className="skeleton">Loading meetings…</div> : null}
          {data.error.meetings ? <div className="alert alert-error">{data.error.meetings}</div> : null}
          {!data.loading.meetings && !data.error.meetings && upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming meetings"
              description="Create a meeting to get started."
              actionLabel="Create meeting"
              onAction={() => navigate("/meetings/new")}
            />
          ) : (
            <MeetingList meetings={upcoming} />
          )}
        </Card>

        <Card
          title="Notifications & reminders"
          actions={
            <Link className="link" to="/notifications">
              Open
            </Link>
          }
        >
          {data.loading.notifications ? <div className="skeleton">Loading notifications…</div> : null}
          {data.error.notifications ? <div className="alert alert-error">{data.error.notifications}</div> : null}
          {!data.loading.notifications && !data.error.notifications && data.notifications.length === 0 ? (
            <EmptyState title="No notifications" description="Reminders will appear here." />
          ) : (
            <div className="noti-list">
              {data.notifications.slice(0, 5).map((n) => (
                <div key={n.id} className={`noti-item ${n.read ? "" : "unread"}`}>
                  <div className="noti-msg">{n.message}</div>
                  <div className="noti-meta">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { MeetingList } from "../components/meetings/MeetingList";

// PUBLIC_INTERFACE
export function MeetingsListPage() {
  /** Lists meetings with link to details/edit. */
  const data = useAppData();
  const navigate = useNavigate();

  useEffect(() => {
    data.refreshMeetings();
  }, [data]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">Meetings</h1>
          <p className="muted">Create, edit, and invite team members.</p>
        </div>
        <div className="page-actions">
          <Button onClick={() => navigate("/meetings/new")}>+ New meeting</Button>
        </div>
      </div>

      <Card title="All meetings">
        {data.loading.meetings ? <div className="skeleton">Loading meetings…</div> : null}
        {data.error.meetings ? <div className="alert alert-error">{data.error.meetings}</div> : null}
        {!data.loading.meetings && !data.error.meetings && (data.meetings || []).length === 0 ? (
          <EmptyState
            title="No meetings yet"
            description="Create a meeting and invite your team."
            actionLabel="Create meeting"
            onAction={() => navigate("/meetings/new")}
          />
        ) : (
          <MeetingList meetings={data.meetings} />
        )}
      </Card>
    </div>
  );
}

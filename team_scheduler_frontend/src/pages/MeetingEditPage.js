import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { MeetingForm } from "../components/meetings/MeetingForm";

// PUBLIC_INTERFACE
export function MeetingEditPage() {
  /** Page to edit an existing meeting. */
  const { meetingId } = useParams();
  const data = useAppData();
  const navigate = useNavigate();

  const meeting = useMemo(() => (data.meetings || []).find((m) => String(m.id) === String(meetingId)), [data.meetings, meetingId]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (payload) => {
    setBusy(true);
    setError(null);
    try {
      await data.updateMeeting(meetingId, payload);
      navigate(`/meetings/${meetingId}`);
    } catch (e) {
      setError(e?.message || "Failed to update meeting");
    } finally {
      setBusy(false);
    }
  };

  if (!meeting) {
    // If the user opened edit directly, the list may not be loaded yet.
    return (
      <div className="stack">
        <div className="page-head">
          <div>
            <h1 className="h1">Edit meeting</h1>
            <p className="muted">Loading meeting…</p>
          </div>
        </div>
        <div className="skeleton">Fetching meeting data…</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">Edit meeting</h1>
          <p className="muted">Update details and invitees.</p>
        </div>
      </div>

      <Card title="Meeting details">
        {error ? <div className="alert alert-error">{error}</div> : null}
        <MeetingForm initial={meeting} onSubmit={onSubmit} submitLabel="Save changes" busy={busy} />
      </Card>
    </div>
  );
}

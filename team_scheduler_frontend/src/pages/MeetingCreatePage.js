import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { MeetingForm } from "../components/meetings/MeetingForm";

// PUBLIC_INTERFACE
export function MeetingCreatePage() {
  /** Page to create a new meeting. */
  const data = useAppData();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSubmit = async (payload) => {
    setBusy(true);
    setError(null);
    try {
      const created = await data.createMeeting(payload);
      navigate(`/meetings/${created.id}`);
    } catch (e) {
      setError(e?.message || "Failed to create meeting");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">New meeting</h1>
          <p className="muted">Set time, agenda, and invitees.</p>
        </div>
      </div>

      <Card title="Meeting details">
        {error ? <div className="alert alert-error">{error}</div> : null}
        <MeetingForm onSubmit={onSubmit} submitLabel="Create meeting" busy={busy} />
      </Card>
    </div>
  );
}

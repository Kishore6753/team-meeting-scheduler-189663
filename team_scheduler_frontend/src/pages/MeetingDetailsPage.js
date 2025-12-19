import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

// PUBLIC_INTERFACE
export function MeetingDetailsPage() {
  /** Meeting details page with invite and delete actions. */
  const { meetingId } = useParams();
  const data = useAppData();
  const navigate = useNavigate();

  const meeting = useMemo(() => (data.meetings || []).find((m) => String(m.id) === String(meetingId)), [data.meetings, meetingId]);

  const [inviteText, setInviteText] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [error, setError] = useState(null);
  const [inviteError, setInviteError] = useState(null);

  useEffect(() => {
    if (!meeting) data.refreshMeetings();
  }, [data, meeting]);

  const invite = async () => {
    setInviteError(null);
    const emails = inviteText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (emails.length === 0) return setInviteError("Enter at least one email.");

    setInviteBusy(true);
    try {
      await data.inviteToMeeting(meetingId, emails);
      setInviteText("");
    } catch (e) {
      setInviteError(e?.message || "Failed to send invites");
    } finally {
      setInviteBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this meeting? This cannot be undone.")) return;
    setDeleteBusy(true);
    setError(null);
    try {
      await data.deleteMeeting(meetingId);
      navigate("/meetings");
    } catch (e) {
      setError(e?.message || "Failed to delete meeting");
    } finally {
      setDeleteBusy(false);
    }
  };

  if (data.loading.meetings && !meeting) {
    return <div className="skeleton">Loading meeting…</div>;
  }

  if (!meeting) {
    return (
      <div className="stack">
        <div className="page-head">
          <div>
            <h1 className="h1">Meeting not found</h1>
            <p className="muted">It may have been deleted or is unavailable.</p>
          </div>
        </div>
        <Button onClick={() => navigate("/meetings")}>Back to meetings</Button>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">{meeting.title}</h1>
          <p className="muted">
            {format(new Date(meeting.startTime), "PPpp")} – {format(new Date(meeting.endTime), "p")}
            {meeting.location ? ` • ${meeting.location}` : ""}
          </p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary btn-md" to={`/meetings/${meetingId}/edit`}>
            Edit
          </Link>
          <Button variant="danger" onClick={remove} disabled={deleteBusy}>
            {deleteBusy ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="grid-2-xl">
        <Card title="Details">
          {meeting.description ? <div className="prose">{meeting.description}</div> : <div className="muted">No description.</div>}
          <div className="kv">
            <div className="kv-row">
              <div className="kv-key">Attendees</div>
              <div className="kv-val">
                {Array.isArray(meeting.attendees) && meeting.attendees.length ? (
                  <div className="chips">
                    {meeting.attendees.map((a) => (
                      <span key={a} className="chip">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="muted">None</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Invite team members">
          <Input
            label="Emails (comma-separated)"
            value={inviteText}
            onChange={(e) => setInviteText(e.target.value)}
            placeholder="alice@company.com, bob@company.com"
          />
          {inviteError ? <div className="alert alert-error">{inviteError}</div> : null}
          <div className="form-actions">
            <Button onClick={invite} disabled={inviteBusy}>
              {inviteBusy ? "Sending..." : "Send invites"}
            </Button>
          </div>
          <div className="muted small">
            Invites call <code>POST /meetings/:id/invite</code> when backend is configured; otherwise mock mode records a notification.
          </div>
        </Card>
      </div>
    </div>
  );
}

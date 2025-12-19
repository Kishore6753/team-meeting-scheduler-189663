import React, { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { addMinutes } from "date-fns";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  // yyyy-MM-ddTHH:mm for <input type="datetime-local">
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return d.toISOString();
};

// PUBLIC_INTERFACE
export function MeetingForm({ initial, onSubmit, submitLabel = "Save", busy }) {
  /** Meeting create/edit form. */
  const defaults = useMemo(() => {
    const now = new Date();
    return {
      title: "",
      description: "",
      location: "",
      startTime: addMinutes(now, 30).toISOString(),
      endTime: addMinutes(now, 60).toISOString(),
      attendeesText: "",
      ...(initial || {}),
    };
  }, [initial]);

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description || "");
  const [location, setLocation] = useState(defaults.location || "");
  const [startTime, setStartTime] = useState(toLocalInput(defaults.startTime));
  const [endTime, setEndTime] = useState(toLocalInput(defaults.endTime));
  const [attendeesText, setAttendeesText] = useState(
    defaults.attendeesText || (Array.isArray(defaults.attendees) ? defaults.attendees.join(", ") : "")
  );
  const [formError, setFormError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) return setFormError("Title is required.");
    const startIso = fromLocalInput(startTime);
    const endIso = fromLocalInput(endTime);
    if (!startIso || !endIso) return setFormError("Start and end time are required.");
    if (new Date(endIso) <= new Date(startIso)) return setFormError("End time must be after start time.");

    const attendees = attendeesText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await onSubmit?.({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      startTime: startIso,
      endTime: endIso,
      attendees,
    });
  };

  return (
    <form className="form" onSubmit={submit}>
      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Weekly sync" />
      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          className="textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional notes or agenda"
          rows={4}
        />
      </label>

      <div className="grid-2">
        <Input label="Start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        <Input label="End" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>

      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Zoom / Room name / Link"
      />

      <Input
        label="Invitees (comma-separated emails)"
        value={attendeesText}
        onChange={(e) => setAttendeesText(e.target.value)}
        placeholder="alice@company.com, bob@company.com"
        hint="You can also invite more members later from the meeting details page."
      />

      {formError ? <div className="alert alert-error">{formError}</div> : null}

      <div className="form-actions">
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

import React, { useMemo } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export function MeetingList({ meetings }) {
  /** Renders a list of meetings. */
  const sorted = useMemo(() => {
    return [...(meetings || [])].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [meetings]);

  return (
    <div className="list">
      {sorted.map((m) => (
        <Link key={m.id} className="list-item" to={`/meetings/${m.id}`}>
          <div className="list-item-main">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div className="list-item-title">{m.title}</div>
              {m.pending ? (
                <span
                  className="badge"
                  style={{
                    background: "rgba(100, 116, 139, 0.14)",
                    borderColor: "rgba(100, 116, 139, 0.28)",
                    color: "var(--text)",
                  }}
                  title="This meeting is saved locally and will sync when online."
                >
                  Pending sync
                </span>
              ) : null}
            </div>
            <div className="list-item-sub">
              {format(new Date(m.startTime), "PPpp")} – {format(new Date(m.endTime), "p")}
              {m.location ? ` • ${m.location}` : ""}
            </div>
          </div>
          <div className="list-item-right">›</div>
        </Link>
      ))}
    </div>
  );
}

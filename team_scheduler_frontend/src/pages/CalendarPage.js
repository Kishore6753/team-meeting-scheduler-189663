import React, { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths } from "date-fns";
import { Link } from "react-router-dom";
import { useAppData } from "../contexts/AppDataContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

// PUBLIC_INTERFACE
export function CalendarPage() {
  /** Calendar month view with meetings per day. */
  const data = useAppData();
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    data.refreshMeetings();
  }, [data]);

  const meetingsByDay = useMemo(() => {
    const map = new Map();
    for (const m of data.meetings || []) {
      const d = new Date(m.startTime);
      const key = format(d, "yyyy-MM-dd");
      map.set(key, [...(map.get(key) || []), m]);
    }
    return map;
  }, [data.meetings]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const days = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    }
    return days;
  }, [cursor]);

  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1 className="h1">Calendar</h1>
          <p className="muted">Month view of scheduled meetings.</p>
        </div>
        <div className="page-actions">
          <Button variant="ghost" onClick={() => setCursor((d) => subMonths(d, 1))}>
            ←
          </Button>
          <div className="pill">{format(cursor, "MMMM yyyy")}</div>
          <Button variant="ghost" onClick={() => setCursor((d) => addMonths(d, 1))}>
            →
          </Button>
        </div>
      </div>

      <Card title="Month">
        {data.loading.meetings ? <div className="skeleton">Loading meetings…</div> : null}
        {data.error.meetings ? <div className="alert alert-error">{data.error.meetings}</div> : null}

        <div className="calendar">
          <div className="calendar-head">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="calendar-dow">
                {d}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {gridDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const todaysMeetings = meetingsByDay.get(key) || [];
              return (
                <div
                  key={key}
                  className={`calendar-cell ${isSameMonth(day, cursor) ? "" : "muted"} ${
                    isSameDay(day, new Date()) ? "today" : ""
                  }`}
                >
                  <div className="calendar-date">{format(day, "d")}</div>
                  <div className="calendar-items">
                    {todaysMeetings.slice(0, 3).map((m) => (
                      <Link key={m.id} className="calendar-item" to={`/meetings/${m.id}`} title={m.title}>
                        {m.title}
                      </Link>
                    ))}
                    {todaysMeetings.length > 3 ? <div className="calendar-more">+{todaysMeetings.length - 3} more</div> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

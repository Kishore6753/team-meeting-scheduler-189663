import React, { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAppData } from "../../contexts/AppDataContext";

// PUBLIC_INTERFACE
export function AppShell({ children }) {
  /** Main application shell with responsive sidebar and header. */
  const data = useAppData();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadCount = useMemo(() => data.notifications.filter((n) => !n.read).length, [data.notifications]);

  // No-auth UI: show a simple guest identity.
  const guest = useMemo(() => ({ name: "Guest", email: "" }), []);

  return (
    <div className="shell">
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`} aria-label="Sidebar navigation">
        <div className="sidebar-brand">
          <div className="brand-mark">TS</div>
          <div className="brand-text">
            <div className="brand-name">Team Scheduler</div>
            <div className="brand-sub">Meetings & reminders</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/meetings" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Meetings
          </NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Calendar
          </NavLink>
          <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            Notifications
            {unreadCount ? <span className="badge">{unreadCount}</span> : null}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="avatar" aria-hidden="true">
              {guest.name.slice(0, 1).toUpperCase()}
            </div>
            <div className="user-meta">
              <div className="user-name">{guest.name}</div>
              <div className="user-email">{guest.email}</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn" onClick={() => setSidebarOpen((s) => !s)} aria-label="Toggle sidebar">
              ☰
            </button>
            <div className="topbar-title">Team Meeting Scheduler</div>
          </div>

          <div className="topbar-right">
            <button className="icon-btn" onClick={() => navigate("/notifications")} aria-label="Notifications">
              🔔
              {unreadCount ? <span className="dot" aria-label={`${unreadCount} unread`} /> : null}
            </button>
            <div className="topbar-profile">
              <div className="avatar small" aria-hidden="true">
                {guest.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="profile-text">
                <div className="profile-name">{guest.name}</div>
                <div className="profile-sub">{guest.email}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}

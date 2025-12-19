import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { AppDataProvider } from "./contexts/AppDataContext";
import { AppShell } from "./components/layout/AppShell";
import { getAppConfig } from "./config";

import { DashboardPage } from "./pages/DashboardPage";
import { MeetingsListPage } from "./pages/MeetingsListPage";
import { MeetingCreatePage } from "./pages/MeetingCreatePage";
import { MeetingDetailsPage } from "./pages/MeetingDetailsPage";
import { MeetingEditPage } from "./pages/MeetingEditPage";
import { CalendarPage } from "./pages/CalendarPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

// PUBLIC_INTERFACE
function App() {
  /** Application entry component: config + routing + providers. */
  useEffect(() => {
    const cfg = getAppConfig();
    // Helpful for debugging env wiring without breaking UI.
    // eslint-disable-next-line no-console
    console.info("[TeamScheduler] config:", {
      apiBaseConfigured: Boolean(cfg.apiBase),
      wsUrlConfigured: Boolean(cfg.wsUrl),
      nodeEnv: cfg.nodeEnv,
    });
  }, []);

  return (
    <AuthProvider>
      <AppDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route
              path="/dashboard"
              element={
                <AppShell>
                  <DashboardPage />
                </AppShell>
              }
            />

            <Route
              path="/meetings"
              element={
                <AppShell>
                  <MeetingsListPage />
                </AppShell>
              }
            />
            <Route
              path="/meetings/new"
              element={
                <AppShell>
                  <MeetingCreatePage />
                </AppShell>
              }
            />
            <Route
              path="/meetings/:meetingId"
              element={
                <AppShell>
                  <MeetingDetailsPage />
                </AppShell>
              }
            />
            <Route
              path="/meetings/:meetingId/edit"
              element={
                <AppShell>
                  <MeetingEditPage />
                </AppShell>
              }
            />

            <Route
              path="/calendar"
              element={
                <AppShell>
                  <CalendarPage />
                </AppShell>
              }
            />

            <Route
              path="/notifications"
              element={
                <AppShell>
                  <NotificationsPage />
                </AppShell>
              }
            />

            <Route
              path="*"
              element={
                <AppShell>
                  <NotFoundPage />
                </AppShell>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import { AppDataProvider } from "./contexts/AppDataContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppShell } from "./components/layout/AppShell";
import { getAppConfig } from "./config";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
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

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <DashboardPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/meetings"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MeetingsListPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings/new"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MeetingCreatePage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings/:meetingId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MeetingDetailsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/meetings/:meetingId/edit"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MeetingEditPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <CalendarPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <NotificationsPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <NotFoundPage />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AppDataProvider>
    </AuthProvider>
  );
}

export default App;

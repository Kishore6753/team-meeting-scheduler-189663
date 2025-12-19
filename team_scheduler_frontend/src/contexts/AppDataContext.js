import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ApiClient } from "../api/client";
import { useAuth } from "./AuthContext";

const AppDataContext = createContext(null);

// PUBLIC_INTERFACE
export function AppDataProvider({ children }) {
  /** Provides meetings & notifications state and CRUD actions to pages. */
  const auth = useAuth();

  const api = useMemo(() => {
    return new ApiClient({
      // No-auth: do not attach a token by default.
      getToken: () => auth.accessToken,
      // No-auth: avoid redirect/logout loops if backend returns 401.
      onAuthError: () => {},
    });
  }, [auth.accessToken]);

  const [meetings, setMeetings] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState({ meetings: false, notifications: false });
  const [error, setError] = useState({ meetings: null, notifications: null });

  const refreshMeetings = useCallback(async () => {
    setLoading((s) => ({ ...s, meetings: true }));
    setError((s) => ({ ...s, meetings: null }));
    try {
      const data = await api.listMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((s) => ({ ...s, meetings: e?.message || "Failed to load meetings" }));
    } finally {
      setLoading((s) => ({ ...s, meetings: false }));
    }
  }, [api]);

  const refreshNotifications = useCallback(async () => {
    setLoading((s) => ({ ...s, notifications: true }));
    setError((s) => ({ ...s, notifications: null }));
    try {
      const data = await api.listNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((s) => ({ ...s, notifications: e?.message || "Failed to load notifications" }));
    } finally {
      setLoading((s) => ({ ...s, notifications: false }));
    }
  }, [api]);

  const createMeeting = useCallback(
    async (payload) => {
      const created = await api.createMeeting(payload);
      await refreshMeetings();
      return created;
    },
    [api, refreshMeetings]
  );

  const updateMeeting = useCallback(
    async (id, payload) => {
      const updated = await api.updateMeeting(id, payload);
      await refreshMeetings();
      return updated;
    },
    [api, refreshMeetings]
  );

  const deleteMeeting = useCallback(
    async (id) => {
      await api.deleteMeeting(id);
      await refreshMeetings();
      return true;
    },
    [api, refreshMeetings]
  );

  const inviteToMeeting = useCallback(
    async (meetingId, emails) => {
      const res = await api.inviteToMeeting(meetingId, { emails });
      await refreshNotifications();
      return res;
    },
    [api, refreshNotifications]
  );

  const markNotificationRead = useCallback(
    async (notificationId, read = true) => {
      const res = await api.markNotificationRead(notificationId, read);
      await refreshNotifications();
      return res;
    },
    [api, refreshNotifications]
  );

  const value = useMemo(() => {
    return {
      api,
      meetings,
      notifications,
      loading,
      error,
      // PUBLIC_INTERFACE
      refreshMeetings,
      // PUBLIC_INTERFACE
      refreshNotifications,
      // PUBLIC_INTERFACE
      createMeeting,
      // PUBLIC_INTERFACE
      updateMeeting,
      // PUBLIC_INTERFACE
      deleteMeeting,
      // PUBLIC_INTERFACE
      inviteToMeeting,
      // PUBLIC_INTERFACE
      markNotificationRead,
    };
  }, [
    api,
    meetings,
    notifications,
    loading,
    error,
    refreshMeetings,
    refreshNotifications,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    inviteToMeeting,
    markNotificationRead,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppData() {
  /** Hook to access meetings/notifications data context. */
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ApiClient, isNetworkError } from "../api/client";
import { useAuth } from "./AuthContext";
import { LocalMeetingsStore } from "../storage/LocalMeetingsStore";

const AppDataContext = createContext(null);

const replaceById = (arr, id, nextItem) => {
  const next = [...(arr || [])];
  const idx = next.findIndex((m) => String(m?.id) === String(id));
  if (idx >= 0) next[idx] = nextItem;
  else next.unshift(nextItem);
  return next;
};

const removeById = (arr, id) => (arr || []).filter((m) => String(m?.id) !== String(id));

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

  // Minimal "toast" queue for non-blocking status hints (e.g., offline saved locally).
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, { variant = "info", ttlMs = 3500 } = {}) => {
    const id = `t_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const toast = { id, message, variant };
    setToasts((t) => [...t, toast]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, ttlMs);
  }, []);

  const refreshMeetings = useCallback(async () => {
    setLoading((s) => ({ ...s, meetings: true }));
    setError((s) => ({ ...s, meetings: null }));
    try {
      const data = await api.listMeetings();
      setMeetings(Array.isArray(data) ? data : []);
    } catch (e) {
      // Keep this error surface, but avoid throwing toasts that block usage.
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
      // 1) Always optimistically create a local pending entry for instant UX.
      const local = LocalMeetingsStore.add(payload || {});
      setMeetings((prev) => [local, ...(prev || [])]);

      // 2) Attempt to send to server in background; reconcile on success.
      try {
        const created = await api.createMeeting(payload);

        // If API client itself had to fall back locally, keep the local pending entry and surface a hint.
        if (created?.__localFallback) {
          pushToast("Saved locally. Will sync when online.", { variant: "info" });
          return local;
        }

        // Replace local entry with server item.
        LocalMeetingsStore.remove(local.clientId);
        setMeetings((prev) => {
          const withoutLocal = removeById(prev, local.id);
          return replaceById(withoutLocal, created.id, created);
        });

        return created;
      } catch (e) {
        // Network error: keep local pending entry, show non-blocking toast, and do not propagate.
        if (isNetworkError(e)) {
          pushToast("Saved locally. Will sync when online.", { variant: "info" });
          return local;
        }

        // Non-network: remove local entry (we don't want to retain invalid payload), and rethrow.
        LocalMeetingsStore.remove(local.clientId);
        setMeetings((prev) => removeById(prev, local.id));
        throw e;
      }
    },
    [api, pushToast]
  );

  const updateMeeting = useCallback(
    async (id, payload) => {
      // If editing a pending local meeting, update local store and state immediately.
      if (String(id).startsWith("local-")) {
        const updatedLocal = LocalMeetingsStore.update(id, { ...(payload || {}) });
        if (updatedLocal) {
          setMeetings((prev) => replaceById(prev, id, updatedLocal));
        }

        // Try server anyway (API client handles offline fallback); if it falls back, keep pending.
        try {
          const res = await api.updateMeeting(id, payload);
          if (res?.__localFallback) {
            pushToast("Saved locally. Will sync when online.", { variant: "info" });
            return updatedLocal || res;
          }
          // In practice server shouldn't accept local ids; but if it does, reconcile.
          LocalMeetingsStore.remove(id);
          setMeetings((prev) => removeById(prev, id));
          setMeetings((prev) => replaceById(prev, res.id, res));
          return res;
        } catch (e) {
          if (isNetworkError(e)) {
            pushToast("Saved locally. Will sync when online.", { variant: "info" });
            return updatedLocal;
          }
          throw e;
        }
      }

      // For non-local ids: optimistically update UI, then attempt server update.
      setMeetings((prev) => {
        const current = (prev || []).find((m) => String(m?.id) === String(id));
        if (!current) return prev;
        return replaceById(prev, id, { ...current, ...(payload || {}) });
      });

      try {
        const updated = await api.updateMeeting(id, payload);

        if (updated?.__localFallback) {
          pushToast("Saved locally. Will sync when online.", { variant: "info" });
          // Keep meeting updated in UI; ensure a local pending representation exists.
          // API client creates one for server id updates when offline.
          await refreshMeetings();
          return updated;
        }

        await refreshMeetings();
        return updated;
      } catch (e) {
        if (isNetworkError(e)) {
          pushToast("Saved locally. Will sync when online.", { variant: "info" });
          await refreshMeetings();
          return true;
        }
        throw e;
      }
    },
    [api, pushToast, refreshMeetings]
  );

  const deleteMeeting = useCallback(
    async (id) => {
      // If it's a local-only pending meeting, just remove it locally.
      if (String(id).startsWith("local-")) {
        LocalMeetingsStore.remove(id);
        setMeetings((prev) => removeById(prev, id));
        return true;
      }

      // Optimistically remove from UI.
      setMeetings((prev) => removeById(prev, id));

      try {
        const res = await api.deleteMeeting(id);

        if (res?.__localFallback) {
          pushToast("Deleted locally. Will sync when online.", { variant: "info" });
          return true;
        }

        await refreshMeetings();
        return true;
      } catch (e) {
        if (isNetworkError(e)) {
          pushToast("Deleted locally. Will sync when online.", { variant: "info" });
          return true;
        }
        throw e;
      }
    },
    [api, pushToast, refreshMeetings]
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
      toasts,
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
      // PUBLIC_INTERFACE
      pushToast,
    };
  }, [
    api,
    meetings,
    notifications,
    loading,
    error,
    toasts,
    refreshMeetings,
    refreshNotifications,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    inviteToMeeting,
    markNotificationRead,
    pushToast,
  ]);

  return (
    <AppDataContext.Provider value={value}>
      {children}
      {/* Minimal toast outlet; non-blocking UX hints (offline saves/deletes). */}
      {toasts.length ? (
        <div
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            zIndex: 1000,
            pointerEvents: "none",
          }}
          aria-live="polite"
          aria-relevant="additions"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className="alert"
              style={{
                maxWidth: 360,
                boxShadow: "var(--shadow)",
                borderColor: t.variant === "error" ? "rgba(239, 68, 68, 0.35)" : "var(--border)",
                background: "rgba(255, 255, 255, 0.92)",
              }}
            >
              {t.message}
            </div>
          ))}
        </div>
      ) : null}
    </AppDataContext.Provider>
  );
}

// PUBLIC_INTERFACE
export function useAppData() {
  /** Hook to access meetings/notifications data context. */
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

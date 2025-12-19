import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "team_scheduler_auth";

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides auth state (user/token) and helpers to login/register/logout. */
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : { accessToken: null, user: null };
    } catch {
      return { accessToken: null, user: null };
    }
  });

  const setAndPersist = (next) => {
    setSession(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage failures
    }
  };

  const value = useMemo(() => {
    return {
      accessToken: session.accessToken,
      user: session.user,
      isAuthenticated: Boolean(session.accessToken && session.user),
      // PUBLIC_INTERFACE
      setSession: (newSession) => setAndPersist(newSession),
      // PUBLIC_INTERFACE
      logout: () => setAndPersist({ accessToken: null, user: null }),
    };
  }, [session.accessToken, session.user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

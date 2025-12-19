import React, { createContext, useContext, useMemo } from "react";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides a no-auth "guest session" so the rest of the app can run without tokens. */
  const value = useMemo(() => {
    const guestUser = { id: "guest", name: "Guest", email: "" };

    return {
      accessToken: null,
      user: guestUser,
      isAuthenticated: true, // no-auth app: always allow
      // PUBLIC_INTERFACE
      setSession: () => {
        // no-op: auth is removed
      },
      // PUBLIC_INTERFACE
      logout: () => {
        // no-op: auth is removed
      },
    };
  }, []);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access auth context. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

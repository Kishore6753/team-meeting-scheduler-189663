import React from "react";

// PUBLIC_INTERFACE
export function ProtectedRoute({ children }) {
  /** No-auth app: route guard is a no-op and always renders children. */
  return children;
}

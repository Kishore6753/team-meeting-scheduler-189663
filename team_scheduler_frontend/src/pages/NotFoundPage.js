import React from "react";
import { Link } from "react-router-dom";

// PUBLIC_INTERFACE
export function NotFoundPage() {
  /** Fallback route for unknown paths. */
  return (
    <div className="stack">
      <h1 className="h1">Page not found</h1>
      <p className="muted">The page you’re looking for doesn’t exist.</p>
      <Link className="btn btn-primary btn-md" to="/dashboard">
        Go to dashboard
      </Link>
    </div>
  );
}

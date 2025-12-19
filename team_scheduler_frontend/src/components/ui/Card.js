import React from "react";

// PUBLIC_INTERFACE
export function Card({ title, actions, children, className = "" }) {
  /** Surface container for grouped content. */
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="card-header">
          <div className="card-title">{title}</div>
          <div className="card-actions">{actions}</div>
        </header>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

import React from "react";
import { Button } from "./Button";

// PUBLIC_INTERFACE
export function EmptyState({ title, description, actionLabel, onAction }) {
  /** Friendly empty state prompt. */
  return (
    <div className="empty">
      <div className="empty-title">{title}</div>
      {description ? <div className="empty-desc">{description}</div> : null}
      {actionLabel ? (
        <div className="empty-actions">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      ) : null}
    </div>
  );
}

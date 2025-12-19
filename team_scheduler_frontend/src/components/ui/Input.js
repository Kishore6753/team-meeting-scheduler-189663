import React from "react";

// PUBLIC_INTERFACE
export function Input({ label, hint, error, className = "", ...props }) {
  /** Standard input with label, hint and error rendering. */
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <input className={`input ${error ? "input-error" : ""}`} {...props} />
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

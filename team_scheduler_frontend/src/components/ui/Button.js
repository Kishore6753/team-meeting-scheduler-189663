import React from "react";

// PUBLIC_INTERFACE
export function Button({ variant = "primary", size = "md", className = "", ...props }) {
  /** Standard button with theme variants. */
  return <button className={`btn btn-${variant} btn-${size} ${className}`} {...props} />;
}

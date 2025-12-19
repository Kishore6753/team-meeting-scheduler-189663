const normalizeBaseUrl = (value) => {
  if (!value) return "";
  // Remove trailing slashes for consistent joining.
  return String(value).replace(/\/+$/, "");
};

// PUBLIC_INTERFACE
export function getAppConfig() {
  /**
   * Returns runtime configuration derived from CRA environment variables.
   * The orchestrator will provide these in `.env`; do not hardcode URLs.
   */
  const apiBase =
    normalizeBaseUrl(process.env.REACT_APP_API_BASE) ||
    normalizeBaseUrl(process.env.REACT_APP_BACKEND_URL) ||
    ""; // Allows "mock mode" when backend isn't provided.

  const frontendUrl = normalizeBaseUrl(process.env.REACT_APP_FRONTEND_URL) || "";
  const wsUrl = normalizeBaseUrl(process.env.REACT_APP_WS_URL) || "";
  const nodeEnv = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development";

  // Feature flags are expected as JSON (optional)
  let featureFlags = {};
  try {
    featureFlags = process.env.REACT_APP_FEATURE_FLAGS ? JSON.parse(process.env.REACT_APP_FEATURE_FLAGS) : {};
  } catch {
    featureFlags = {};
  }

  return {
    apiBase,
    frontendUrl,
    wsUrl,
    nodeEnv,
    featureFlags,
  };
}

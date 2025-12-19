/**
 * LocalMeetingsStore
 * ------------------
 * A tiny localStorage-backed store used for "local-first" meeting creation/edit/delete
 * when the backend is unreachable.
 *
 * Storage format (localStorage key: "local_meetings"):
 * [
 *   {
 *     clientId: "local-<timestamp>-<rand>",
 *     pending: true,
 *     createdAt: "<iso>",
 *     ...meetingPayload
 *   }
 * ]
 */

const STORAGE_KEY = "local_meetings";

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const readArray = () => {
  if (typeof window === "undefined" || !window.localStorage) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = safeJsonParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
};

const writeArray = (arr) => {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
};

const genClientId = () => `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;

// PUBLIC_INTERFACE
export class LocalMeetingsStore {
  /** A small persistence helper for local pending meetings. */

  // PUBLIC_INTERFACE
  static list() {
    /** Returns locally stored meetings (array). */
    return readArray();
  }

  // PUBLIC_INTERFACE
  static add(meetingPayload) {
    /**
     * Adds a meeting payload locally, returning the created record.
     * The created record will have {clientId, pending:true, createdAt}.
     */
    const now = new Date().toISOString();
    const item = {
      ...meetingPayload,
      clientId: genClientId(),
      pending: true,
      createdAt: now,
      // For UI routing compatibility (MeetingList/Details uses `id`):
      // Use clientId as id for local-only items.
      id: meetingPayload?.id || undefined,
    };

    // Ensure an id exists for routing; prefer existing payload id, else use clientId.
    if (!item.id) item.id = item.clientId;

    const existing = readArray();
    writeArray([item, ...existing]);
    return item;
  }

  // PUBLIC_INTERFACE
  static update(clientId, patch) {
    /** Updates a local meeting by clientId with a shallow patch. Returns updated item or null if not found. */
    const existing = readArray();
    const idx = existing.findIndex((m) => String(m.clientId) === String(clientId));
    if (idx < 0) return null;

    const updated = { ...existing[idx], ...(patch || {}) };

    // Keep id stable for routing: if id is missing, use clientId.
    if (!updated.id) updated.id = updated.clientId;

    const next = [...existing];
    next[idx] = updated;
    writeArray(next);
    return updated;
  }

  // PUBLIC_INTERFACE
  static remove(clientId) {
    /** Removes a local meeting by clientId. Returns true if removed. */
    const existing = readArray();
    const next = existing.filter((m) => String(m.clientId) !== String(clientId));
    writeArray(next);
    return next.length !== existing.length;
  }

  // PUBLIC_INTERFACE
  static clear() {
    /** Clears all locally stored meetings. Mainly for tests. */
    writeArray([]);
  }
}

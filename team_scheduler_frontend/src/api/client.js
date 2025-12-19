import { getAppConfig } from "../config";
import { addMinutes, isAfter } from "date-fns";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const mockDb = (() => {
  const now = new Date();
  const meetings = [
    {
      id: "m_1",
      title: "Weekly Standup",
      description: "Quick status sync",
      startTime: addMinutes(now, 60).toISOString(),
      endTime: addMinutes(now, 90).toISOString(),
      location: "Zoom",
      attendees: ["alice@company.com", "bob@company.com"],
      createdBy: "demo@company.com",
    },
    {
      id: "m_2",
      title: "Sprint Planning",
      description: "Plan tasks for next sprint",
      startTime: addMinutes(now, 180).toISOString(),
      endTime: addMinutes(now, 240).toISOString(),
      location: "Conference Room A",
      attendees: ["demo@company.com", "pm@company.com"],
      createdBy: "demo@company.com",
    },
  ];

  const notifications = [
    { id: "n_1", type: "reminder", message: "Weekly Standup starts in 1 hour", createdAt: now.toISOString(), read: false },
  ];

  const users = [{ id: "u_demo", email: "demo@company.com", name: "Demo User" }];

  return { meetings, notifications, users };
})();

const joinUrl = (base, path) => {
  const b = String(base || "").replace(/\/+$/, "");
  const p = String(path || "").replace(/^\/+/, "");
  return `${b}/${p}`;
};

const getJson = async (res) => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

// PUBLIC_INTERFACE
export class ApiClient {
  /**
   * Lightweight REST client with graceful fallback to mock data.
   * It attempts real HTTP calls when REACT_APP_API_BASE or REACT_APP_BACKEND_URL is set.
   */
  constructor({ getToken, onAuthError } = {}) {
    this.getToken = getToken || (() => null);
    this.onAuthError = onAuthError || (() => {});
    this.config = getAppConfig();
  }

  async request(path, { method = "GET", body, headers } = {}) {
    const { apiBase } = this.config;

    // If backend isn't configured, use mock mode.
    if (!apiBase) {
      return this.mockRequest(path, { method, body });
    }

    const token = this.getToken?.();
    const res = await fetch(joinUrl(apiBase, path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.onAuthError?.();
    }

    if (!res.ok) {
      const payload = await getJson(res);
      const message = payload?.message || payload?.detail || `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      error.payload = payload;
      throw error;
    }

    return await getJson(res);
  }

  async mockRequest(path, { method, body }) {
    // Simulate network latency
    await sleep(250);

    // Basic auth endpoints
    if (path === "auth/login" && method === "POST") {
      const email = body?.email || "demo@company.com";
      const user = { id: "u_demo", email, name: email.split("@")[0] || "User" };
      return { accessToken: "mock-token", user };
    }
    if (path === "auth/register" && method === "POST") {
      const email = body?.email || "demo@company.com";
      const user = { id: "u_demo", email, name: body?.name || (email.split("@")[0] || "User") };
      return { accessToken: "mock-token", user };
    }

    // Meetings
    if (path === "meetings" && method === "GET") {
      return [...mockDb.meetings].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }
    if (path.startsWith("meetings/") && method === "GET") {
      const id = path.split("/")[1];
      const m = mockDb.meetings.find((x) => x.id === id);
      if (!m) throw new Error("Meeting not found");
      return m;
    }
    if (path === "meetings" && method === "POST") {
      const id = `m_${Math.random().toString(16).slice(2)}`;
      const created = {
        id,
        title: body?.title || "Untitled meeting",
        description: body?.description || "",
        startTime: body?.startTime,
        endTime: body?.endTime,
        location: body?.location || "",
        attendees: body?.attendees || [],
        createdBy: "demo@company.com",
      };
      mockDb.meetings.push(created);
      return created;
    }
    if (path.startsWith("meetings/") && method === "PUT") {
      const id = path.split("/")[1];
      const idx = mockDb.meetings.findIndex((x) => x.id === id);
      if (idx < 0) throw new Error("Meeting not found");
      mockDb.meetings[idx] = { ...mockDb.meetings[idx], ...body };
      return mockDb.meetings[idx];
    }
    if (path.startsWith("meetings/") && method === "DELETE") {
      const id = path.split("/")[1];
      mockDb.meetings = mockDb.meetings.filter((x) => x.id !== id);
      return { ok: true };
    }

    // Invites (UI-only; mock returns ok)
    if (path.endsWith("/invite") && method === "POST") {
      const invitees = body?.emails || [];
      const message = `Invited ${invitees.length} member(s).`;
      mockDb.notifications.unshift({
        id: `n_${Math.random().toString(16).slice(2)}`,
        type: "info",
        message,
        createdAt: new Date().toISOString(),
        read: false,
      });
      return { ok: true };
    }

    // Notifications
    if (path === "notifications" && method === "GET") {
      // Add a “smart” reminder for the next upcoming meeting
      const now = new Date();
      const next = mockDb.meetings.find((m) => isAfter(new Date(m.startTime), now));
      if (next && mockDb.notifications.every((n) => !n.message.includes(next.title))) {
        mockDb.notifications.unshift({
          id: `n_${Math.random().toString(16).slice(2)}`,
          type: "reminder",
          message: `${next.title} is coming up soon`,
          createdAt: new Date().toISOString(),
          read: false,
        });
      }
      return mockDb.notifications;
    }
    if (path.startsWith("notifications/") && method === "PUT") {
      const id = path.split("/")[1];
      const idx = mockDb.notifications.findIndex((n) => n.id === id);
      if (idx < 0) throw new Error("Notification not found");
      mockDb.notifications[idx] = { ...mockDb.notifications[idx], ...body };
      return mockDb.notifications[idx];
    }

    throw new Error(`Mock endpoint not implemented: ${method} ${path}`);
  }

  // ---- Convenience methods (match typical REST patterns) ----
  // PUBLIC_INTERFACE
  async login({ email, password }) {
    /** Logs in and returns {accessToken, user}. */
    return this.request("auth/login", { method: "POST", body: { email, password } });
  }

  // PUBLIC_INTERFACE
  async register({ name, email, password }) {
    /** Registers a user and returns {accessToken, user}. */
    return this.request("auth/register", { method: "POST", body: { name, email, password } });
  }

  // PUBLIC_INTERFACE
  async listMeetings() {
    /** Fetches all meetings. */
    return this.request("meetings", { method: "GET" });
  }

  // PUBLIC_INTERFACE
  async getMeeting(id) {
    /** Fetches a meeting by id. */
    return this.request(`meetings/${id}`, { method: "GET" });
  }

  // PUBLIC_INTERFACE
  async createMeeting(payload) {
    /** Creates a meeting. */
    return this.request("meetings", { method: "POST", body: payload });
  }

  // PUBLIC_INTERFACE
  async updateMeeting(id, payload) {
    /** Updates a meeting. */
    return this.request(`meetings/${id}`, { method: "PUT", body: payload });
  }

  // PUBLIC_INTERFACE
  async deleteMeeting(id) {
    /** Deletes a meeting. */
    return this.request(`meetings/${id}`, { method: "DELETE" });
  }

  // PUBLIC_INTERFACE
  async inviteToMeeting(meetingId, { emails }) {
    /** Invites team members to a meeting. */
    return this.request(`meetings/${meetingId}/invite`, { method: "POST", body: { emails } });
  }

  // PUBLIC_INTERFACE
  async listNotifications() {
    /** Fetches notifications/reminders. */
    return this.request("notifications", { method: "GET" });
  }

  // PUBLIC_INTERFACE
  async markNotificationRead(id, read = true) {
    /** Marks a notification as read/unread. */
    return this.request(`notifications/${id}`, { method: "PUT", body: { read } });
  }
}

import { render, screen } from "@testing-library/react";
import App from "./App";
import { LocalMeetingsStore } from "./storage/LocalMeetingsStore";

test("renders dashboard by default", () => {
  render(<App />);
  const heading = screen.getByText(/dashboard/i);
  expect(heading).toBeInTheDocument();
});

test("offline createMeeting persists a local pending meeting when fetch fails", async () => {
  // Ensure a clean slate.
  LocalMeetingsStore.clear();

  // Force "backend configured" so the client tries fetch instead of mock mode.
  process.env.REACT_APP_API_BASE = "http://example.invalid";

  // Mock fetch to simulate a network failure.
  const originalFetch = global.fetch;
  global.fetch = jest.fn(async () => {
    throw new TypeError("Failed to fetch");
  });

  try {
    render(<App />);

    // Navigate to "New meeting"
    const newMeetingBtn = await screen.findByRole("button", { name: /\+ new meeting/i });
    newMeetingBtn.click();

    // Fill title and submit.
    const titleInput = await screen.findByLabelText(/title/i);
    titleInput.focus();
    titleInput.value = "Offline meeting";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));

    const createBtn = screen.getByRole("button", { name: /create meeting/i });
    createBtn.click();

    // Assert localStorage store contains a pending meeting.
    const locals = LocalMeetingsStore.list();
    expect(locals.length).toBeGreaterThan(0);
    expect(locals[0].pending).toBe(true);
    expect(locals[0].title).toBe("Offline meeting");
    expect(String(locals[0].clientId)).toMatch(/^local-/);
  } finally {
    // Cleanup
    global.fetch = originalFetch;
    LocalMeetingsStore.clear();
    delete process.env.REACT_APP_API_BASE;
  }
});

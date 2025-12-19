import { useEffect, useRef } from "react";
import { getAppConfig } from "../config";

/**
 * Very small WS connector that listens for notifications-related events
 * and triggers a callback. Safe to use even when WS is not configured.
 */

// PUBLIC_INTERFACE
export function useNotificationsSocket({ enabled, onEvent }) {
  /** Connects to REACT_APP_WS_URL (if set) and forwards JSON messages to onEvent. */
  const wsRef = useRef(null);

  useEffect(() => {
    const { wsUrl } = getAppConfig();
    if (!enabled || !wsUrl) return;

    let cancelled = false;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // no-op; backend may require auth/subscribe messages in the future
      };

      ws.onmessage = (ev) => {
        if (cancelled) return;
        const raw = ev?.data;
        try {
          const data = JSON.parse(raw);
          onEvent?.(data);
        } catch {
          onEvent?.({ type: "message", raw });
        }
      };

      ws.onerror = () => {
        // no-op; keep UI working even if ws fails
      };

      ws.onclose = () => {
        // no-op
      };

      return () => {
        cancelled = true;
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch {
      return undefined;
    }
  }, [enabled, onEvent]);
}

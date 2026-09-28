// Authenticated Server-Sent Events client.
// EventSource cannot send an Authorization header, so we exchange the JWT for a
// 60-second single-purpose ticket, and fetch a fresh ticket on every (re)connection.
type Listener = (e: MessageEvent) => void;

export interface RealtimeHandle {
  addEventListener: (type: string, fn: Listener) => void;
  onmessage: Listener | null;
  close: () => void;
}

export function connectRealtimeStream(token: string | null): RealtimeHandle {
  const listeners: Array<{ type: string; fn: Listener }> = [];
  let es: EventSource | null = null;
  let closed = false;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;

  const handle: RealtimeHandle = {
    onmessage: null,
    addEventListener(type, fn) {
      listeners.push({ type, fn });
      es?.addEventListener(type, fn as EventListener);
    },
    close() {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      es?.close();
    },
  };

  const open = async () => {
    if (closed || !token) return;
    try {
      const resp = await fetch("/api/realtime/ticket", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error(`ticket ${resp.status}`);
      const { ticket } = await resp.json();
      if (closed) return;
      es = new EventSource(`/api/realtime/stream?ticket=${encodeURIComponent(ticket)}`);
      es.onmessage = (e) => handle.onmessage?.(e);
      listeners.forEach(({ type, fn }) => es!.addEventListener(type, fn as EventListener));
      es.onerror = () => {
        // Ticket expired or network dropped: close and reconnect with a fresh ticket.
        es?.close();
        if (!closed) retryTimer = setTimeout(open, 3000);
      };
    } catch {
      if (!closed) retryTimer = setTimeout(open, 5000);
    }
  };

  open();
  return handle;
}

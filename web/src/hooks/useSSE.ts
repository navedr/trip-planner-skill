/**
 * POST-based SSE streaming via fetch + ReadableStream.
 *
 * Standard EventSource only supports GET. Our chat endpoint uses POST
 * (to send the message body), so we read the response as a stream,
 * decode chunks, and manually parse SSE format.
 */

export interface SSEEvent {
  event: string;
  data: string;
}

export type SSEEventHandler = (event: SSEEvent) => void;

export async function streamSSE(
  url: string,
  body: Record<string, unknown>,
  onEvent: SSEEventHandler,
  signal?: AbortSignal,
): Promise<void> {
  const token = localStorage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { detail?: string }).detail ?? `SSE request failed: ${response.status}`,
    );
  }

  if (!response.body) {
    throw new Error("Response body is null — SSE streaming not supported");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by double newlines
      const parts = buffer.split("\n\n");
      // Keep the last (possibly incomplete) part in the buffer
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType = "message";
        let data = "";

        for (const line of part.split("\n")) {
          if (line.startsWith("event:")) {
            eventType = line.slice(6).trim();
          } else if (line.startsWith("data:")) {
            data = line.slice(5).trim();
          }
        }

        if (data || eventType) {
          onEvent({ event: eventType, data });
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

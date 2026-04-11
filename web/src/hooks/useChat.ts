import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { streamSSE } from "./useSSE";
import { useChat as useChatContext } from "@/contexts/ChatContext";

/**
 * Chat hook that wires SSE streaming to the ChatContext state
 * and handles TanStack Query invalidation on items_updated events.
 */
export function useChatStream() {
  const {
    tripId,
    appendMessage,
    updateLastAssistant,
    setStreaming,
    addStatus,
    clearStatus,
  } = useChatContext();

  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      // Append user message
      appendMessage({ role: "user", content });

      // Prepare streaming
      setStreaming(true);
      addStatus("Thinking...");

      const controller = new AbortController();
      abortRef.current = controller;

      let assistantContent = "";

      try {
        await streamSSE(
          "/api/chat/stream",
          { message: content, trip_id: tripId },
          (event) => {
            switch (event.event) {
              case "status": {
                const parsed = safeParse<{ message: string }>(event.data);
                if (parsed) addStatus(parsed.message);
                break;
              }

              case "tool_call": {
                const parsed = safeParse<{ name: string }>(event.data);
                if (parsed) addStatus(`Running ${parsed.name}...`);
                break;
              }

              case "tool_result": {
                // Tool completed — status will be updated by next event
                break;
              }

              case "message": {
                const parsed = safeParse<{ content: string }>(event.data);
                if (parsed) {
                  clearStatus();
                  assistantContent += parsed.content;
                  if (assistantContent === parsed.content) {
                    // First chunk — create the message
                    appendMessage({ role: "assistant", content: assistantContent });
                  } else {
                    // Subsequent chunks — update in place
                    updateLastAssistant(assistantContent);
                  }
                }
                break;
              }

              case "items_updated": {
                const parsed = safeParse<{ trip_id: string }>(event.data);
                if (parsed) {
                  // Prefix match invalidates all categories
                  queryClient.invalidateQueries({
                    queryKey: ["trip-items", parsed.trip_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["trip", parsed.trip_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["itinerary", parsed.trip_id],
                  });
                  queryClient.invalidateQueries({
                    queryKey: ["map-items", parsed.trip_id],
                  });
                }
                break;
              }

              case "done": {
                clearStatus();
                break;
              }
            }
          },
          controller.signal,
        );
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          clearStatus();
          appendMessage({
            role: "assistant",
            content: `Sorry, something went wrong: ${(err as Error).message}`,
          });
        }
      } finally {
        setStreaming(false);
        clearStatus();
        abortRef.current = null;
      }
    },
    [tripId, appendMessage, updateLastAssistant, setStreaming, addStatus, clearStatus, queryClient],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendMessage, cancelStream };
}

function safeParse<T>(data: string): T | null {
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "react-router";
import { apiFetch } from "@/lib/api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  statusText: string | null;
  isStreaming: boolean;
  isPanelOpen: boolean;
  tripId: string | null;
  pendingInput: string | null;
  historyLoaded: boolean;
  togglePanel: () => void;
  openPanel: () => void;
  appendMessage: (msg: { role: ChatMessage["role"]; content: string }) => void;
  updateLastAssistant: (content: string) => void;
  setStreaming: (v: boolean) => void;
  addStatus: (text: string) => void;
  clearStatus: () => void;
  clearMessages: () => Promise<void>;
  prefillInput: (text: string) => void;
  consumePendingInput: () => string | null;
}

const ChatContext = createContext<ChatState | null>(null);

let nextId = Date.now();

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const params = useParams();
  // Auto-scope to trip when on /trips/:id
  const tripId = (params as { id?: string }).id ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    // Closed by default on mobile (panel is a fullscreen sheet there); open on desktop sidebar.
    return window.matchMedia("(min-width: 1024px)").matches;
  });
  const [pendingInput, setPendingInput] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const prevTripIdRef = useRef<string | null | undefined>(undefined);

  // Fetch persisted chat history when tripId changes
  useEffect(() => {
    // Skip if tripId hasn't actually changed (prevents double-fetch on re-render)
    if (prevTripIdRef.current === tripId) return;
    prevTripIdRef.current = tripId;

    setHistoryLoaded(false);
    setMessages([]);

    const qs = tripId ? `?trip_id=${tripId}` : "";
    apiFetch<Array<{ id: string; role: string; content: string; created_at: string }>>(
      `/chat/history${qs}`,
    )
      .then((rows) => {
        setMessages(
          rows.map((r) => ({
            id: r.id,
            role: r.role as ChatMessage["role"],
            content: r.content,
            timestamp: new Date(r.created_at.endsWith("Z") ? r.created_at : r.created_at + "Z").getTime(),
          })),
        );
      })
      .catch(() => {
        // Non-critical — start with empty history
      })
      .finally(() => setHistoryLoaded(true));
  }, [tripId]);

  const togglePanel = useCallback(() => setIsPanelOpen((v) => !v), []);
  const openPanel = useCallback(() => setIsPanelOpen(true), []);

  const prefillInput = useCallback((text: string) => {
    setPendingInput(text);
    setIsPanelOpen(true);
  }, []);

  const consumePendingInput = useCallback(() => {
    const val = pendingInput;
    setPendingInput(null);
    return val;
  }, [pendingInput]);

  const appendMessage = useCallback(
    (msg: { role: ChatMessage["role"]; content: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${++nextId}`,
          role: msg.role,
          content: msg.content,
          timestamp: Date.now(),
        },
      ]);
    },
    [],
  );

  const updateLastAssistant = useCallback((content: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i]!.role === "assistant") {
          copy[i] = { ...copy[i]!, content };
          break;
        }
      }
      return copy;
    });
  }, []);

  const setStreaming = useCallback((v: boolean) => setIsStreaming(v), []);
  const addStatus = useCallback((text: string) => setStatusText(text), []);
  const clearStatus = useCallback(() => setStatusText(null), []);
  const clearMessages = useCallback(async () => {
    setMessages([]);
    const qs = tripId ? `?trip_id=${tripId}` : "";
    try {
      await apiFetch(`/chat/history${qs}`, { method: "DELETE" });
    } catch {
      // Non-critical — local state is already cleared
    }
  }, [tripId]);

  const value = useMemo(
    () => ({
      messages,
      statusText,
      isStreaming,
      isPanelOpen,
      tripId,
      pendingInput,
      historyLoaded,
      togglePanel,
      openPanel,
      appendMessage,
      updateLastAssistant,
      setStreaming,
      addStatus,
      clearStatus,
      clearMessages,
      prefillInput,
      consumePendingInput,
    }),
    [
      messages,
      statusText,
      isStreaming,
      isPanelOpen,
      tripId,
      pendingInput,
      historyLoaded,
      togglePanel,
      openPanel,
      appendMessage,
      updateLastAssistant,
      setStreaming,
      addStatus,
      clearStatus,
      clearMessages,
      prefillInput,
      consumePendingInput,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatState {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

import { useCallback, useRef, useEffect } from "react";
import { Send, Square, WifiOff } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useChatStream } from "@/hooks/useChat";
import { useOnline } from "@/hooks/useOnline";

export function ChatInput() {
  const { isStreaming, consumePendingInput } = useChat();
  const { sendMessage, cancelStream } = useChatStream();
  const isOnline = useOnline();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "36px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [adjustHeight]);

  // Consume prefilled input from context (e.g. search quick-filters)
  useEffect(() => {
    const text = consumePendingInput();
    if (text && textareaRef.current) {
      textareaRef.current.value = text;
      textareaRef.current.focus();
      adjustHeight();
    }
  }, [consumePendingInput, adjustHeight]);

  const handleSubmit = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const value = el.value.trim();
    if (!value || isStreaming || !isOnline) return;
    sendMessage(value);
    el.value = "";
    el.style.height = "auto";
  }, [isStreaming, isOnline, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const placeholder = !isOnline
    ? "Offline — reconnect to chat"
    : isStreaming
      ? "Waiting for response..."
      : "Ask about your trip...";

  return (
    <div className="flex-none border-t border-border/30 p-3">
      {!isOnline && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
          <WifiOff className="h-3 w-3" />
          Offline — cached data is still available
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl bg-background/60 p-2 ring-1 ring-border/30 focus-within:ring-primary/30">
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          disabled={isStreaming || !isOnline}
          onInput={adjustHeight}
          onKeyDown={handleKeyDown}
          className="max-h-40 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
        />
        {isStreaming ? (
          <button
            onClick={cancelStream}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/15 text-destructive transition-colors hover:bg-destructive/25"
            title="Stop generating"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <p className="mt-1.5 text-center text-[10px] text-muted-foreground/40">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

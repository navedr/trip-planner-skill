import { useState } from "react";
import { Compass, PanelRightClose, PanelRightOpen, Trash2 } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { ClearChatDialog } from "./ClearChatDialog";

export function ChatHeader() {
  const { isPanelOpen, togglePanel, tripId, messages, clearMessages, isStreaming } =
    useChat();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Compass className="h-3.5 w-3.5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium">AI Assistant</h3>
          {tripId && (
            <p className="text-[10px] text-muted-foreground">
              Scoped to current trip
            </p>
          )}
        </div>
        {isStreaming && (
          <span className="ml-1 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </div>

      <div className="flex items-center gap-1">
        {messages.length > 0 && (
          <button
            onClick={() => setConfirmOpen(true)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              isStreaming && "pointer-events-none opacity-50",
            )}
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={togglePanel}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title={isPanelOpen ? "Collapse panel" : "Expand panel"}
        >
          {isPanelOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      <ClearChatDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={clearMessages}
      />
    </div>
  );
}

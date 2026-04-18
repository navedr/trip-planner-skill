import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { MessageSquare, Compass, Trash2 } from "lucide-react";
import { useCallback, useRef, useState, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { ClearChatDialog } from "./ClearChatDialog";

const STORAGE_KEY = "voyager-chat-width";
const DEFAULT_WIDTH = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 1000;

/**
 * Chat panel — glassmorphism sidebar on desktop, in-tab sheet on mobile.
 *
 * Desktop (>= 1024px): Fixed 35% right panel, collapsible with slide animation.
 * Mobile (< 1024px): Sheet that fills space above the tab bar, slides up from bottom.
 */
export function ChatPanel() {
  const { isPanelOpen, openPanel } = useChat();

  // Persisted width for the desktop panel
  const [width, setWidth] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_WIDTH;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(saved))) : DEFAULT_WIDTH;
  });
  const isDragging = useRef(false);

  // Save to localStorage when drag ends
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(width));
  }, [width]);

  const handleResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;
      // Dragging left = larger panel (resize handle is on the left edge)
      const delta = startX - ev.clientX;
      // Cap so main content keeps at least 480px
      const maxForViewport = window.innerWidth - 480;
      const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, maxForViewport, startWidth + delta));
      setWidth(clamped);
    };
    const onUp = () => {
      isDragging.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  return (
    <>
      {/* Desktop / Tablet panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={isDragging.current ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass relative hidden flex-col border-l border-border/30 lg:flex"
            style={{ minWidth: 0 }}
          >
            {/* Resize handle */}
            <div
              onPointerDown={handleResizeStart}
              className="absolute left-0 top-0 z-10 h-full w-1.5 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
            />
            <div className="flex h-full flex-col">
              <ChatHeader />
              <MessageList />
              <ChatInput />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop collapse button — shown when panel is closed */}
      {!isPanelOpen && (
        <div className="hidden lg:flex">
          <button
            onClick={openPanel}
            className="glass flex h-full w-12 flex-col items-center justify-center gap-2 border-l border-border/30 text-muted-foreground transition-colors hover:text-foreground"
            title="Open chat panel"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[9px] font-medium [writing-mode:vertical-lr]">
              Chat
            </span>
          </button>
        </div>
      )}

      {/* Mobile chat sheet — sits above the tab bar */}
      <MobileChatSheet />
    </>
  );
}

/** Tab bar height (4rem) + safe area. Chat sheet bottom = this value. */
const TAB_BAR_OFFSET = "calc(4rem + env(safe-area-inset-bottom, 0px))";

function MobileChatSheet() {
  const { isPanelOpen, togglePanel, messages, clearMessages, isStreaming } =
    useChat();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        togglePanel();
      }
    },
    [togglePanel],
  );

  return (
    <div className="lg:hidden">
      {/* Backdrop */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            style={{ bottom: TAB_BAR_OFFSET }}
            onClick={togglePanel}
          />
        )}
      </AnimatePresence>

      {/* Chat sheet */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] as const }}
            className="fixed inset-x-0 top-0 z-50 flex flex-col rounded-b-2xl bg-background"
            style={{ bottom: TAB_BAR_OFFSET }}
          >
            {/* Header */}
            <div
              className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4"
              style={{
                height: "2.75rem",
                paddingTop: "env(safe-area-inset-top, 0px)",
                background: "hsla(222.2, 47.4%, 11.2%, 0.8)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
              }}
            >
              <button onClick={togglePanel} className="text-sm text-primary">
                Close
              </button>
              <span className="flex items-center gap-2">
                <Compass className="h-3.5 w-3.5 text-primary" />
                <span className="text-[17px] font-semibold text-foreground">
                  Chat
                </span>
                {isStreaming && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                )}
              </span>
              {messages.length > 0 ? (
                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={isStreaming}
                  className="text-muted-foreground disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-4" />
              )}
            </div>

            {/* Drag handle for swipe-down dismiss */}
            <motion.div
              className="flex shrink-0 cursor-grab justify-center py-1.5 active:cursor-grabbing"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={handleDragEnd}
              style={{ touchAction: "none" }}
            >
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </motion.div>

            {/* Messages */}
            <div className="flex min-h-0 flex-1 flex-col">
              <MessageList />
            </div>

            {/* Input — pinned at bottom of sheet, above tab bar */}
            <div className="shrink-0">
              <ChatInput />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClearChatDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={clearMessages}
      />
    </div>
  );
}

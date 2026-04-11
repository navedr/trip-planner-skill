import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

/**
 * Chat panel — glassmorphism sidebar on desktop, bottom sheet on mobile.
 *
 * Desktop (>= 1024px): Fixed 35% right panel, collapsible with slide animation.
 * Tablet (768–1024px): Overlay panel, slides from right.
 * Mobile (< 768px): Bottom sheet, shows above content.
 */
export function ChatPanel() {
  const { isPanelOpen, openPanel } = useChat();

  return (
    <>
      {/* Desktop / Tablet panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "35%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="glass hidden flex-col border-l border-border/30 lg:flex"
            style={{ minWidth: 0 }}
          >
            <div className="flex h-full min-w-[320px] flex-col">
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

      {/* Mobile bottom sheet */}
      <MobileSheet />
    </>
  );
}

function MobileSheet() {
  const { isPanelOpen, togglePanel, openPanel, messages, isStreaming } =
    useChat();

  return (
    <div className="lg:hidden">
      {/* Floating button to open */}
      {!isPanelOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          onClick={openPanel}
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        >
          <MessageSquare className="h-5 w-5" />
          {(messages.length > 0 || isStreaming) && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-gold" />
          )}
        </motion.button>
      )}

      {/* Backdrop */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={togglePanel}
          />
        )}
      </AnimatePresence>

      {/* Bottom sheet */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="glass fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>

            <ChatHeader />
            <MessageList />
            <ChatInput />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

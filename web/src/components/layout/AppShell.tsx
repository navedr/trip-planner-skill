import { Outlet } from "react-router";
import { motion } from "framer-motion";
import { TopNav } from "./TopNav";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatPanel } from "@/components/chat/ChatPanel";

export function AppShell() {
  return (
    <ChatProvider>
      <div className="flex h-screen flex-col">
        <TopNav />

        <div className="flex min-h-0 flex-1">
          {/* Main content */}
          <main className="min-w-0 flex-1 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </main>

          {/* Chat panel — glassmorphism sidebar */}
          <ChatPanel />
        </div>
      </div>
    </ChatProvider>
  );
}

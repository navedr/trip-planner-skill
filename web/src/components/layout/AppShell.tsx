import { Outlet, useLocation } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { TopNav } from "./TopNav";
import { BottomTabBar } from "./BottomTabBar";
import { ChatProvider } from "@/contexts/ChatContext";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useNavigationDirection } from "@/hooks/useNavigationDirection";
import { pageSlide, pageFade } from "@/lib/motion";

export function AppShell() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const direction = useNavigationDirection();

  const variants = isMobile ? pageSlide : pageFade;

  return (
    <ChatProvider>
      <div className="flex h-screen flex-col">
        <TopNav />

        <div className="flex min-h-0 flex-1">
          {/* Main content */}
          <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden lg:min-w-[480px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={location.pathname}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                className="min-h-full"
                style={isMobile ? { paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" } : undefined}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Chat panel — glassmorphism sidebar (desktop) / Konsta Popup (mobile) */}
          <ChatPanel />
        </div>

        {/* Bottom tab bar — mobile only */}
        <BottomTabBar />
      </div>
    </ChatProvider>
  );
}

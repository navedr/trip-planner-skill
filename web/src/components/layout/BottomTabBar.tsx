import { useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { Map, Search, Settings, MessageSquare } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";

const tabs = [
  { path: "/trips", label: "Trips", icon: Map },
  { path: "/search", label: "Search", icon: Search },
  { path: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isPanelOpen, openPanel, messages, isStreaming } = useChat();

  const hasChatActivity = messages.length > 0 || isStreaming;

  // Track last visited path per tab section so switching back restores position
  const lastPaths = useRef<Record<string, string>>({});

  useEffect(() => {
    for (const tab of tabs) {
      if (
        location.pathname === tab.path ||
        location.pathname.startsWith(tab.path + "/")
      ) {
        lastPaths.current[tab.path] = location.pathname;
        break;
      }
    }
  }, [location.pathname]);

  return (
    <>
    {/* Chat FAB — floating above the tab bar, hidden when chat is open */}
    {!isPanelOpen && (
      <button
        onClick={openPanel}
        className="lg:hidden fixed right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
        style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 12px)" }}
      >
        <MessageSquare className="h-5 w-5" />
        {hasChatActivity && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inset-0 animate-ping rounded-full bg-gold opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-gold" />
          </span>
        )}
      </button>
    )}

    <nav
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 border-t border-white/[0.06]"
      style={{
        background: "hsla(222.2, 47.4%, 11.2%, 0.8)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex h-16 items-stretch justify-around">
        {tabs.map(({ path, label, icon: Icon }) => {
          const active =
            location.pathname === path ||
            location.pathname.startsWith(path + "/");

          return (
            <button
              key={path}
              onClick={() => navigate(lastPaths.current[path] ?? path)}
              className={
                "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors " +
                (active ? "text-primary" : "text-muted-foreground hover:text-foreground")
              }
            >
              <span
                className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
                style={
                  active
                    ? {
                        boxShadow:
                          "0 0 12px 2px hsla(24, 52%, 50%, 0.35), 0 0 4px 1px hsla(24, 52%, 50%, 0.2)",
                        background:
                          "radial-gradient(circle, hsla(24, 52%, 50%, 0.15) 0%, transparent 70%)",
                      }
                    : undefined
                }
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}

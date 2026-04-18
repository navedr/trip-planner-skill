import { useEffect, useRef } from "react";
import { useChat } from "@/contexts/ChatContext";
import { UserMessage } from "./UserMessage";
import { AssistantMessage } from "./AssistantMessage";
import { StatusMessage } from "./StatusMessage";
import { Compass } from "lucide-react";

export function MessageList() {
  const { messages, statusText, historyLoaded } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  // Reset so we jump instantly again when switching trips (history re-fetches).
  useEffect(() => {
    if (!historyLoaded) didInitialScroll.current = false;
  }, [historyLoaded]);

  // Jump instantly to the latest message on first load; smooth-scroll for new ones after.
  useEffect(() => {
    if (!historyLoaded) return;
    bottomRef.current?.scrollIntoView({
      behavior: didInitialScroll.current ? "smooth" : "instant",
    });
    didInitialScroll.current = true;
  }, [messages, statusText, historyLoaded]);

  if (messages.length === 0 && !statusText && historyLoaded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-display mb-1.5 text-base font-medium">
          Voyager AI
        </h3>
        <p className="max-w-[220px] text-xs text-muted-foreground leading-relaxed">
          Ask me to search for flights, hotels, restaurants, or build your
          itinerary.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-1.5">
          {[
            "Find flights",
            "Search hotels",
            "Restaurant ideas",
            "Build itinerary",
          ].map((hint) => (
            <span
              key={hint}
              className="rounded-full bg-muted/50 px-2.5 py-1 text-[10px] text-muted-foreground"
            >
              {hint}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-4">
        {messages.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} message={msg} />
          ) : (
            <AssistantMessage key={msg.id} message={msg} />
          ),
        )}
        {statusText && <StatusMessage text={statusText} />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

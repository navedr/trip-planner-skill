import type { ChatMessage } from "@/contexts/ChatContext";
import { formatTimestamp } from "@/lib/time";

interface UserMessageProps {
  message: ChatMessage;
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary/15 px-4 py-2.5">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
      </div>
      <span className="px-1 text-[10px] text-muted-foreground/50">
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
}

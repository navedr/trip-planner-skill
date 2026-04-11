import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Compass } from "lucide-react";
import type { ChatMessage } from "@/contexts/ChatContext";
import { formatTimestamp } from "@/lib/time";

interface AssistantMessageProps {
  message: ChatMessage;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Compass className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-card/80 px-4 py-2.5">
        <div className="prose-chat text-sm leading-relaxed">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => (
                <a
                  {...props}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                />
              ),
              p: ({ ...props }) => (
                <p {...props} className="mb-2 last:mb-0" />
              ),
              ul: ({ ...props }) => (
                <ul {...props} className="mb-2 ml-4 list-disc last:mb-0" />
              ),
              ol: ({ ...props }) => (
                <ol {...props} className="mb-2 ml-4 list-decimal last:mb-0" />
              ),
              li: ({ ...props }) => (
                <li {...props} className="mb-0.5" />
              ),
              code: ({ ...props }) => (
                <code
                  {...props}
                  className="rounded bg-muted px-1 py-0.5 text-xs"
                />
              ),
              strong: ({ ...props }) => (
                <strong {...props} className="font-semibold text-foreground" />
              ),
              table: ({ ...props }) => (
                <div className="mb-2 overflow-x-auto">
                  <table
                    {...props}
                    className="w-full text-xs border-collapse"
                  />
                </div>
              ),
              th: ({ ...props }) => (
                <th
                  {...props}
                  className="border border-border/50 bg-muted/50 px-2 py-1 text-left font-medium"
                />
              ),
              td: ({ ...props }) => (
                <td
                  {...props}
                  className="border border-border/30 px-2 py-1"
                />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        </div>
      </div>
      <span className="ml-9.5 text-[10px] text-muted-foreground/50">
        {formatTimestamp(message.timestamp)}
      </span>
    </div>
  );
}

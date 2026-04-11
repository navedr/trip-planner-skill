import { Loader2 } from "lucide-react";

interface StatusMessageProps {
  text: string;
}

export function StatusMessage({ text }: StatusMessageProps) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      <span className="text-xs text-muted-foreground">{text}</span>
    </div>
  );
}

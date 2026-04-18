import { WifiOff } from "lucide-react";
import { useOnline } from "@/hooks/useOnline";

export function OfflineBanner(): JSX.Element | null {
  const online = useOnline();
  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-1.5 border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-300">
      <WifiOff className="h-3 w-3" />
      <span>You&apos;re offline — showing cached trip data.</span>
    </div>
  );
}

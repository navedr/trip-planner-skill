import { cn } from "@/lib/utils";

interface DaySelectorProps {
  totalDays: number;
  selectedDay: number | null;
  onSelect: (day: number | null) => void;
  accentColor: string;
}

/**
 * Horizontal scrolling day filter bar for the map.
 * null = "All Days", 1-N = specific day numbers.
 */
export function DaySelector({
  totalDays,
  selectedDay,
  onSelect,
  accentColor,
}: DaySelectorProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto px-1 py-2 scrollbar-hide">
      <DayButton
        label="All Days"
        isActive={selectedDay === null}
        onClick={() => onSelect(null)}
        accentColor={accentColor}
      />
      {Array.from({ length: totalDays }, (_, i) => (
        <DayButton
          key={i + 1}
          label={`Day ${i + 1}`}
          isActive={selectedDay === i + 1}
          onClick={() => onSelect(i + 1)}
          accentColor={accentColor}
        />
      ))}
    </div>
  );
}

function DayButton({
  label,
  isActive,
  onClick,
  accentColor,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  accentColor: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
        isActive
          ? "text-white shadow-sm"
          : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      style={isActive ? { backgroundColor: accentColor } : undefined}
    >
      {label}
    </button>
  );
}

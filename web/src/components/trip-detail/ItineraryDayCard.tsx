import { Plane, UtensilsCrossed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItineraryDay } from "@/lib/types";

interface ItineraryDayCardProps {
  day: ItineraryDay;
  accentColor: string;
}

export function ItineraryDayCard({ day, accentColor }: ItineraryDayCardProps) {
  const dateStr = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      className={cn(
        "rounded-xl border bg-card",
        day.is_flight_day
          ? "border-border/50 bg-background/80"
          : "border-border/40",
      )}
    >
      {/* Day header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-4 py-3"
        style={{ background: `linear-gradient(135deg, ${accentColor}10, transparent)` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold"
              style={{ backgroundColor: accentColor + "20", color: accentColor }}
            >
              {day.day_number}
            </span>
            <div>
              <h4 className="font-display text-sm font-medium">{day.theme}</h4>
              {day.subtitle && (
                <p className="text-[10px] text-muted-foreground">{day.subtitle}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{dateStr}</span>
          {day.is_flight_day && (
            <Badge variant="outline" className="text-[10px]">
              <Plane className="mr-0.5 h-2.5 w-2.5" />
              Flight
            </Badge>
          )}
        </div>
      </div>

      {/* Activities timeline */}
      <div className="px-4 py-3">
        <div className="relative">
          {/* Timeline line */}
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px"
            style={{ backgroundColor: accentColor + "25" }}
          />

          <div className="space-y-3">
            {day.activities.map((activity, i) => {
              const isFlight = activity.tags.includes("flight");
              const isMeal = activity.tags.includes("meal");

              return (
                <div key={i} className="relative flex gap-3 pl-1">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "relative z-10 mt-1 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full",
                      isFlight
                        ? "bg-muted-foreground"
                        : isMeal
                          ? "bg-gold"
                          : "",
                    )}
                    style={
                      !isFlight && !isMeal
                        ? { backgroundColor: accentColor }
                        : undefined
                    }
                  >
                    <div className="h-[4px] w-[4px] rounded-full bg-background" />
                  </div>

                  <div className="min-w-0 flex-1 -mt-0.5">
                    <div className="flex items-center gap-2">
                      {activity.time && (
                        <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          {activity.time}
                        </span>
                      )}
                      {isFlight && <Plane className="h-3 w-3 text-muted-foreground" />}
                      {isMeal && <UtensilsCrossed className="h-3 w-3 text-gold" />}
                    </div>
                    <p className="text-sm font-medium">{activity.name}</p>
                    {activity.detail && (
                      <p className="text-xs text-muted-foreground">{activity.detail}</p>
                    )}
                    {activity.tags.filter((t) => t !== "flight" && t !== "meal").length > 0 && (
                      <div className="mt-1 flex gap-1">
                        {activity.tags
                          .filter((t) => t !== "flight" && t !== "meal")
                          .map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[9px] font-normal text-muted-foreground"
                            >
                              {tag}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

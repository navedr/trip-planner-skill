import { Plane, Clock, ExternalLink, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FlightOption } from "@/lib/types";

interface FlightCardProps {
  flight: FlightOption;
  accentColor: string;
  onSelect?: () => void;
  onRemove?: () => void;
}

export function FlightCard({ flight, accentColor, onSelect, onRemove }: FlightCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card p-4 transition-colors",
        flight.is_selected
          ? "border-sage/50 ring-1 ring-sage/30"
          : "border-border/40 hover:border-border/70",
      )}
    >
      {flight.is_selected && (
        <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-sage">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Airline & flight info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: accentColor + "18" }}
            >
              <Plane className="h-4 w-4" style={{ color: accentColor }} />
            </span>
            <div>
              <p className="text-sm font-medium">{flight.airline}</p>
              <p className="text-xs text-muted-foreground">
                {flight.flight_number ?? flight.class}
              </p>
            </div>
          </div>
        </div>

        {/* Times */}
        <div className="text-center">
          <p className="text-sm font-medium">{flight.depart_time}</p>
          <div className="my-1 flex items-center gap-1 text-[10px] text-muted-foreground">
            <div className="h-px w-6 bg-border" />
            <Clock className="h-2.5 w-2.5" />
            <span>{flight.duration}</span>
            <div className="h-px w-6 bg-border" />
          </div>
          <p className="text-sm font-medium">{flight.arrive_time}</p>
        </div>

        {/* Stops & price */}
        <div className="text-right">
          <p className="text-lg font-semibold" style={{ color: accentColor }}>
            ${flight.price_per_person}
          </p>
          <p className="text-[10px] text-muted-foreground">per person</p>
          <Badge
            variant="outline"
            className={cn(
              "mt-1",
              flight.stops === 0
                ? "border-sage/30 text-sage"
                : "border-border text-muted-foreground",
            )}
          >
            {flight.stops === 0 ? "Nonstop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
          </Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
        {flight.price_total && (
          <span className="text-xs text-muted-foreground">
            ${flight.price_total} total
          </span>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {flight.booking_url && (
            <a
              href={flight.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Book
            </a>
          )}
          {onRemove && (
            <Button size="icon-xs" variant="ghost" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
          {!flight.is_selected && onSelect && (
            <Button size="sm" variant="outline" onClick={onSelect}>
              Select
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

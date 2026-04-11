import { useMemo } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Plane, Building2, UtensilsCrossed, MapPin, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDestinationPalette } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/types";

const statusConfig = {
  planning: { label: "Planning", className: "bg-muted text-muted-foreground" },
  researching: { label: "Researching", className: "bg-primary/15 text-primary" },
  ready: { label: "Ready", className: "bg-sage/20 text-sage" },
} as const;

function formatDateRange(depart: string, returnDate: string): string {
  const d = new Date(depart);
  const r = new Date(returnDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const dStr = d.toLocaleDateString("en-US", opts);
  const rStr = r.toLocaleDateString("en-US", { ...opts, year: "numeric" });
  return `${dStr} – ${rStr}`;
}

interface TripCardProps {
  trip: Trip;
  index: number;
}

export function TripCard({ trip, index }: TripCardProps) {
  const palette = useMemo(
    () => getDestinationPalette(trip.destination),
    [trip.destination],
  );

  const status = statusConfig[trip.status];
  const counts = trip.item_counts;
  const c = (key: string) => (counts as any)?.[key] ?? 0;
  const flightCount = c("flight") || c("flights");
  const hotelCount = c("hotel") || c("hotels");
  const restaurantCount = c("restaurant") || c("restaurants");
  const attractionCount = c("attraction") || c("attractions");
  const totalItems = flightCount + hotelCount + restaurantCount + attractionCount;
  const travelers = trip.travelers_json ?? trip.travelers;
  const childrenArr = travelers?.children_ages ?? (travelers as any)?.children ?? [];
  const travelerCount = travelers
    ? travelers.adults + childrenArr.length
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link to={`/trips/${trip.id}`} className="block">
        <motion.article
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card transition-colors hover:border-border/70"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={
            {
              "--dest-accent": palette.accent,
              "--dest-complement": palette.complement,
            } as React.CSSProperties
          }
        >
          {/* Destination gradient background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60 transition-opacity group-hover:opacity-100"
            style={{ background: palette.gradient }}
          />

          {/* Accent top bar */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(90deg, ${palette.accent}, ${palette.complement})` }}
          />

          <div className="relative p-5">
            {/* Header: destination + status */}
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-display truncate text-xl font-medium tracking-tight">
                  {trip.destination}
                </h3>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateRange(trip.depart_date, trip.return_date)}</span>
                </div>
              </div>
              <Badge variant="outline" className={cn("shrink-0", status.className)}>
                {status.label}
              </Badge>
            </div>

            {/* Trip meta */}
            <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {travelerCount} traveler{travelerCount !== 1 ? "s" : ""}
              </span>
              <span className="text-border">·</span>
              <span>{trip.duration_days} days</span>
              <span className="text-border">·</span>
              <span>{trip.origin} → {trip.destination}</span>
            </div>

            {/* Item counts */}
            {totalItems > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                <ItemCount icon={Plane} count={flightCount} label="Flights" accentColor={palette.accent} />
                <ItemCount icon={Building2} count={hotelCount} label="Hotels" accentColor={palette.accent} />
                <ItemCount icon={UtensilsCrossed} count={restaurantCount} label="Dining" accentColor={palette.accent} />
                <ItemCount icon={MapPin} count={attractionCount} label="Things" accentColor={palette.accent} />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic">
                No items yet — start researching with AI
              </p>
            )}
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
}

function ItemCount({
  icon: Icon,
  count,
  label,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  label: string;
  accentColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-background/50 py-2">
      <span style={{ color: count > 0 ? accentColor : undefined }}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span
        className={cn(
          "text-sm font-medium",
          count > 0 ? "text-foreground" : "text-muted-foreground/50",
        )}
      >
        {count}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

/** Skeleton placeholder for loading state */
export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/30 bg-card">
      <div className="h-1 w-full animate-pulse bg-muted" />
      <div className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-28 animate-pulse rounded bg-muted/60" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="mb-4 flex gap-3">
          <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-14 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/50" />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1 rounded-lg bg-background/50 py-2">
              <div className="h-3.5 w-3.5 animate-pulse rounded bg-muted/40" />
              <div className="h-4 w-4 animate-pulse rounded bg-muted/50" />
              <div className="h-2 w-8 animate-pulse rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

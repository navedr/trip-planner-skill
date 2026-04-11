import { motion } from "framer-motion";
import {
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
  Users,
  Calendar,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { stagger, fadeUp } from "@/lib/motion";
import type { Trip } from "@/lib/types";

interface TripOverviewProps {
  trip: Trip;
  accentColor: string;
}

export function TripOverview({ trip, accentColor }: TripOverviewProps) {
  const counts = trip.item_counts;
  const travelers = trip.travelers_json ?? trip.travelers;
  const childrenArr = travelers?.children_ages ?? (travelers as any)?.children ?? [];
  const travelerCount = travelers
    ? travelers.adults + childrenArr.length
    : 0;
  const prefs = trip.preferences_json ?? trip.preferences ?? {};
  const prefEntries = Object.entries(prefs).filter(([, v]) => v);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Key stats */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Duration"
          value={`${trip.duration_days} days`}
          sub={`${formatDate(trip.depart_date)} – ${formatDate(trip.return_date)}`}
          accentColor={accentColor}
        />
        <StatCard
          icon={Users}
          label="Travelers"
          value={`${travelerCount} ${travelerCount === 1 ? "person" : "people"}`}
          sub={travelers ? `${travelers.adults} adults${childrenArr.length > 0 ? `, ${childrenArr.length} children` : ""}` : "Unknown"}
          accentColor={accentColor}
        />
        <StatCard
          icon={Plane}
          label="Route"
          value={`${trip.origin} → ${trip.destination}`}
          sub="Round trip"
          accentColor={accentColor}
        />
        <StatCard
          icon={Tag}
          label="Status"
          value={trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          sub={`Updated ${formatDate(trip.updated_at)}`}
          accentColor={accentColor}
        />
      </motion.div>

      {/* Item counts */}
      {counts && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display mb-3 text-sm font-medium text-muted-foreground">
            Research Progress
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CountCard icon={Plane} label="Flights" count={counts.flight ?? counts.flights ?? 0} accentColor={accentColor} />
            <CountCard icon={Building2} label="Hotels" count={counts.hotel ?? counts.hotels ?? 0} accentColor={accentColor} />
            <CountCard icon={UtensilsCrossed} label="Restaurants" count={counts.restaurant ?? counts.restaurants ?? 0} accentColor={accentColor} />
            <CountCard icon={MapPin} label="Attractions" count={counts.attraction ?? counts.attractions ?? 0} accentColor={accentColor} />
          </div>
        </motion.div>
      )}

      {/* Preferences */}
      {prefEntries.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display mb-3 text-sm font-medium text-muted-foreground">
            Preferences
          </h3>
          <div className="space-y-2">
            {prefEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-start gap-3 rounded-lg border border-border/30 bg-card/50 px-4 py-3"
              >
                <Badge variant="outline" className="mt-0.5 shrink-0 capitalize text-[10px]">
                  {key}
                </Badge>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  accentColor: string;
}) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentColor + "18", color: accentColor }}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  count,
  accentColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
  accentColor: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/30 bg-card/50 px-3 py-2.5">
      <span style={{ color: count > 0 ? accentColor : undefined }}>
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-lg font-semibold leading-none">{count}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + (dateStr.includes("T") ? "" : "T12:00:00")).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

import { motion } from "framer-motion";
import {
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
  Star,
  ExternalLink,
  Sparkles,
  CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { stagger, fadeUp } from "@/lib/motion";
import type {
  Trip,
  FlightOption,
  HotelOption,
  Restaurant,
  Attraction,
  ItineraryDay,
} from "@/lib/types";

interface TripTimelineProps {
  trip: Trip;
  flights: FlightOption[];
  hotels: HotelOption[];
  restaurants: Restaurant[];
  attractions: Attraction[];
  itinerary: ItineraryDay[];
  accentColor: string;
}

export function TripTimeline({
  trip,
  flights,
  hotels,
  restaurants,
  attractions,
  itinerary,
  accentColor,
}: TripTimelineProps) {
  const selectedFlights = flights.filter((f) => f.is_selected);
  const selectedHotel = hotels.find((h) => h.is_selected);
  const hasItinerary = itinerary.length > 0;

  // Build a unified timeline: if itinerary exists, use it; otherwise show planning board
  if (hasItinerary) {
    return (
      <ItineraryTimeline
        trip={trip}
        itinerary={itinerary}
        flights={selectedFlights}
        hotel={selectedHotel}
        restaurants={restaurants}
        attractions={attractions}
        accentColor={accentColor}
      />
    );
  }

  return (
    <PlanningBoard
      trip={trip}
      flights={flights}
      hotels={hotels}
      restaurants={restaurants}
      attractions={attractions}
      accentColor={accentColor}
    />
  );
}

/* ─── Itinerary Timeline ─────────────────────────────────────── */

function ItineraryTimeline({
  itinerary,
  flights,
  hotel,
  accentColor,
}: {
  trip: Trip;
  itinerary: ItineraryDay[];
  flights: FlightOption[];
  hotel?: HotelOption;
  restaurants: Restaurant[];
  attractions: Attraction[];
  accentColor: string;
}) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-1">
      {/* Hotel anchor */}
      {hotel && (
        <motion.div variants={fadeUp} className="mb-4">
          <HotelAnchorCard hotel={hotel} accentColor={accentColor} />
        </motion.div>
      )}

      {itinerary.map((day, i) => {
        const isFirst = i === 0;
        const isLast = i === itinerary.length - 1;
        const getDirection = (f: FlightOption) => (f as any).direction ?? (f as any)._direction;
        const arrivalFlight = isFirst ? flights.find((f) => getDirection(f) === "outbound") : undefined;
        const departureFlight = isLast ? flights.find((f) => getDirection(f) === "return") : undefined;

        return (
          <motion.div key={day.day_number} variants={fadeUp}>
            <DaySection
              day={day}

              arrivalFlight={arrivalFlight}
              departureFlight={departureFlight}
              accentColor={accentColor}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function DaySection({
  day,
  arrivalFlight,
  departureFlight,
  accentColor,
}: {
  day: ItineraryDay;
  arrivalFlight?: FlightOption;
  departureFlight?: FlightOption;
  accentColor: string;
}) {
  const dateStr = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="relative">
      {/* Day header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 bg-background/80 py-3 backdrop-blur-sm">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accentColor }}
        >
          {day.day_number}
        </span>
        <div>
          <h3 className="font-display text-sm font-medium">{dateStr}</h3>
          {day.theme && (
            <p className="text-xs text-muted-foreground">{day.theme}</p>
          )}
        </div>
        {day.is_flight_day && (
          <Badge variant="outline" className="ml-auto text-[10px]">
            <Plane className="mr-1 h-3 w-3" /> Travel day
          </Badge>
        )}
      </div>

      {/* Timeline content */}
      <div className="relative ml-4 border-l-2 border-border/40 pl-6 pb-4" style={{ borderColor: accentColor + "30" }}>
        {/* Arrival flight */}
        {arrivalFlight && (
          <TimelineItem icon={Plane} iconColor={accentColor} label="Arrive">
            <FlightInlineCard flight={arrivalFlight} direction="arrive" accentColor={accentColor} />
          </TimelineItem>
        )}

        {/* Day activities */}
        {day.activities.map((activity, i) => {
          const isFood = activity.tags?.some((t: string) =>
            ["lunch", "dinner", "breakfast", "brunch", "food", "meal", "restaurant"].includes(t.toLowerCase()),
          );
          const icon = isFood ? UtensilsCrossed : MapPin;

          return (
            <TimelineItem
              key={i}
              icon={icon}
              iconColor={isFood ? "#d4a843" : accentColor}
              label={activity.time ?? undefined}
            >
              <div className="group">
                <p className="text-sm font-medium">{activity.name}</p>
                {activity.detail && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{activity.detail}</p>
                )}
                {activity.tags && activity.tags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {activity.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </TimelineItem>
          );
        })}

        {/* Departure flight */}
        {departureFlight && (
          <TimelineItem icon={Plane} iconColor={accentColor} label="Depart">
            <FlightInlineCard flight={departureFlight} direction="depart" accentColor={accentColor} />
          </TimelineItem>
        )}
      </div>
    </div>
  );
}

function TimelineItem({
  icon: Icon,
  iconColor,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative pb-4">
      {/* Dot on timeline */}
      <div
        className="absolute -left-[31px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-background"
        style={{ borderColor: iconColor }}
      >
        <span style={{ color: iconColor }}><Icon className="h-2.5 w-2.5" /></span>
      </div>

      {/* Content */}
      <div>
        {label && (
          <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

/* ─── Inline cards ────────────────────────────────────────────── */

function FlightInlineCard({
  flight,
  accentColor,
}: {
  flight: FlightOption;
  direction: "arrive" | "depart";
  accentColor: string;
}) {
  return (
    <div className="rounded-lg border border-border/30 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}><Plane className="h-3.5 w-3.5" /></span>
          <span className="text-sm font-medium">{flight.airline}</span>
          {flight.flight_number && (
            <span className="text-xs text-muted-foreground">{flight.flight_number}</span>
          )}
        </div>
        {(flight as any).booking_url && (
          <a
            href={(flight as any).booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
        <span>{flight.depart_time} → {flight.arrive_time}</span>
        <span>·</span>
        <span>{flight.duration}</span>
        {flight.stops === 0 && <Badge variant="outline" className="text-[9px] py-0">Nonstop</Badge>}
      </div>
      {flight.price_per_person && (
        <p className="mt-1 text-xs" style={{ color: accentColor }}>
          ${flight.price_per_person}/person
        </p>
      )}
    </div>
  );
}

function HotelAnchorCard({ hotel, accentColor }: { hotel: HotelOption; accentColor: string }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card/50 p-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span style={{ color: accentColor }}><Building2 className="h-3.5 w-3.5" /></span>
        Staying at
      </div>
      <h4 className="font-display mt-1.5 text-base font-medium">{hotel.name}</h4>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {hotel.location && <span>{hotel.location}</span>}
        {hotel.star_rating && (
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-gold text-gold" />
            {hotel.star_rating}
          </span>
        )}
        {hotel.price_per_night && (
          <span style={{ color: accentColor }}>${hotel.price_per_night}/night</span>
        )}
      </div>
      {hotel.amenities && hotel.amenities.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {hotel.amenities.slice(0, 5).map((a: string) => (
            <span key={a} className="rounded-full bg-muted/50 px-2 py-0.5 text-[10px]">{a}</span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Planning Board (no itinerary yet) ──────────────────────── */
/* Shows all saved items in one chronological timeline:            */
/*   outbound flight → hotel → attractions/restaurants → return   */

interface TimelineEntry {
  id: string;
  order: number; // 0=outbound flight, 1=hotel, 2=activities, 9=return flight
  type: "flight" | "hotel" | "restaurant" | "attraction";
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  name: string;
  detail: string;
  url?: string | null;
  raw: FlightOption | HotelOption | Restaurant | Attraction;
}

function PlanningBoard({
  flights,
  hotels,
  restaurants,
  attractions,
  accentColor,
}: {
  trip: Trip;
  flights: FlightOption[];
  hotels: HotelOption[];
  restaurants: Restaurant[];
  attractions: Attraction[];
  accentColor: string;
}) {
  const entries: TimelineEntry[] = [];
  const getDir = (f: FlightOption) => (f as any).direction ?? (f as any)._direction ?? "outbound";

  // Outbound flights first
  for (const f of flights) {
    if (getDir(f) === "outbound") {
      entries.push({
        id: f.id,
        order: 0,
        type: "flight",
        icon: Plane,
        iconColor: accentColor,
        name: `${f.airline}${f.flight_number ? " " + f.flight_number : ""} — Outbound`,
        detail: [f.depart_time + " → " + f.arrive_time, f.duration, f.stops === 0 ? "Nonstop" : `${f.stops} stop(s)`, f.price_per_person ? `$${f.price_per_person}/pp` : null].filter(Boolean).join(" · "),
        url: (f as any).booking_url,
        raw: f,
      });
    }
  }

  // Hotels
  // Selected first, then options
  const sortedHotels = [...hotels].sort((a, b) => (b.is_selected ? 1 : 0) - (a.is_selected ? 1 : 0));
  for (const h of sortedHotels) {
    entries.push({
      id: h.id,
      order: 1,
      type: "hotel",
      icon: Building2,
      iconColor: "#4a9eff",
      name: h.name + (h.is_selected ? "" : ""),
      detail: [h.location, h.star_rating ? `${h.star_rating}★` : null, h.price_per_night ? `$${h.price_per_night}/night` : null, h.guest_rating ? `${h.guest_rating} rating` : null].filter(Boolean).join(" · "),
      url: (h as any).booking_urls ? Object.values((h as any).booking_urls)[0] : (h as any).booking_url,
      raw: h,
    });
  }

  // Attractions
  for (const a of attractions) {
    entries.push({
      id: a.id,
      order: 2,
      type: "attraction",
      icon: MapPin,
      iconColor: "#7c9a72",
      name: a.name,
      detail: [a.type, a.rating ? `★ ${a.rating}` : null, a.duration, a.price, a.family_friendly ? "Family friendly" : null].filter(Boolean).join(" · "),
      url: (a as any).tripadvisor_url ?? (a as any).url,
      raw: a,
    });
  }

  // Restaurants
  for (const r of restaurants) {
    entries.push({
      id: r.id,
      order: 2,
      type: "restaurant",
      icon: UtensilsCrossed,
      iconColor: "#d4a843",
      name: r.name,
      detail: [r.cuisine, r.price_level, r.rating ? `★ ${r.rating}` : null, r.neighborhood].filter(Boolean).join(" · "),
      url: (r as any).tripadvisor_url ?? (r as any).url,
      raw: r,
    });
  }

  // Return flights last
  for (const f of flights) {
    if (getDir(f) === "return") {
      entries.push({
        id: f.id,
        order: 9,
        type: "flight",
        icon: Plane,
        iconColor: accentColor,
        name: `${f.airline}${f.flight_number ? " " + f.flight_number : ""} — Return`,
        detail: [f.depart_time + " → " + f.arrive_time, f.duration, f.stops === 0 ? "Nonstop" : `${f.stops} stop(s)`, f.price_per_person ? `$${f.price_per_person}/pp` : null].filter(Boolean).join(" · "),
        url: (f as any).booking_url,
        raw: f,
      });
    }
  }

  // Sort by order (flights anchor to top/bottom, everything else in middle)
  entries.sort((a, b) => a.order - b.order);

  if (entries.length === 0) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No items yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Search for flights, hotels, or things to do using the AI assistant
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Build itinerary CTA */}
      <motion.div
        variants={fadeUp}
        className="mb-5 flex items-center gap-3 rounded-xl border border-dashed border-border/50 bg-card/30 p-3"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accentColor + "18", color: accentColor }}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Build a day-by-day plan</span> — ask the AI to organize these into an itinerary
        </p>
      </motion.div>

      {/* Unified timeline */}
      <div className="relative ml-3 border-l-2 pl-6" style={{ borderColor: accentColor + "30" }}>
        {entries.map((entry) => {
          const isSelected = (entry.raw as any).is_selected;
          return (
            <motion.div key={entry.id} variants={fadeUp} className="relative pb-4">
              {/* Timeline dot */}
              <div
                className="absolute -left-[29px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background"
                style={{ borderColor: entry.iconColor }}
              >
                <span style={{ color: entry.iconColor }}>
                  <entry.icon className="h-2 w-2" />
                </span>
              </div>

              {/* Card */}
              <div
                className={`rounded-lg border px-3 py-2.5 transition-colors hover:border-border/60 ${
                  isSelected
                    ? "border-border/50 bg-card/60"
                    : "border-border/20 bg-card/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      {isSelected && (
                        <Badge variant="outline" className="shrink-0 text-[9px] py-0" style={{ borderColor: accentColor + "50", color: accentColor }}>
                          Selected
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{entry.detail}</p>
                  </div>
                  {entry.url && (
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

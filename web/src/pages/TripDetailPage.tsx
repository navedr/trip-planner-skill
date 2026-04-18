import { useMemo, useState } from "react";
import { useParams, Link } from "react-router";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
  CalendarDays,
  Map,
  Pencil,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDestinationPalette } from "@/lib/theme";
import { useTrip, useTripItems, useItinerary } from "@/hooks/useTrip";
import { useDeleteItem } from "@/hooks/useTripItems";
import { useTripWeather } from "@/hooks/useTripWeather";
import { useOfflineWarmup } from "@/hooks/useOfflineWarmup";
import { TripTimeline } from "@/components/trip-detail/TripTimeline";
import { FlightsTab } from "@/components/trip-detail/FlightsTab";
import { HotelsTab } from "@/components/trip-detail/HotelsTab";
import { RestaurantsTab } from "@/components/trip-detail/RestaurantsTab";
import { AttractionsTab } from "@/components/trip-detail/AttractionsTab";
import { MapTab } from "@/components/trip-detail/MapTab";
import { NearMePanel } from "@/components/trip-detail/NearMePanel";
import { EditTripDialog } from "@/components/trips/EditTripDialog";

const statusConfig = {
  planning: { label: "Planning", className: "bg-muted text-muted-foreground" },
  researching: { label: "Researching", className: "bg-primary/15 text-primary" },
  ready: { label: "Ready", className: "bg-sage/20 text-sage" },
} as const;

function formatDateRange(depart: string, returnDate: string): string {
  const d = new Date(depart + "T12:00:00");
  const r = new Date(returnDate + "T12:00:00");
  return `${d.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${r.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
}

export function TripDetailPage() {
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const { data: trip } = useTrip(id);
  const { data: flights = [] } = useTripItems(id, "flight");
  const { data: hotels = [] } = useTripItems(id, "hotel");
  const { data: restaurants = [] } = useTripItems(id, "restaurant");
  const { data: attractions = [] } = useTripItems(id, "attraction");
  const { data: itinerary = [] } = useItinerary(id);
  const { data: weather = [] } = useTripWeather(id);
  const deleteItem = useDeleteItem(id);
  useOfflineWarmup(id);

  const palette = useMemo(
    () => getDestinationPalette(trip?.destination ?? ""),
    [trip?.destination],
  );

  if (!trip) {
    return (
      <div className="flex items-center justify-center p-16">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  const status = statusConfig[trip.status];

  return (
    <div className="pb-8">
      {/* ── Compact Hero ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative border-b border-border/30"
        style={{ background: palette.gradient }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 0%, hsl(var(--background)) 100%)`,
          }}
        />

        <div className="relative px-6 py-4 lg:px-8">
          {/* Back + Title row */}
          <div className="flex items-center gap-4">
            <Link
              to="/trips"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1
                  className="font-display truncate text-2xl font-medium tracking-tight lg:text-3xl"
                  style={{ color: palette.accent }}
                >
                  {trip.destination}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span>{formatDateRange(trip.depart_date, trip.return_date)}</span>
                <Badge variant="outline" className={`${status.className} text-[10px]`}>
                  {status.label}
                </Badge>
                <span className="hidden sm:inline">
                  {trip.duration_days}d · {trip.origin} → {trip.destination}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <Tabs defaultValue="itinerary" className="mt-2">
            <TabsList
              variant="line"
              className="mb-5 w-full justify-start overflow-x-auto [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <TabsTrigger value="itinerary">
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Itinerary</span>
              </TabsTrigger>
              <TabsTrigger value="flights">
                <Plane className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Flights</span>
                <CountBadge count={flights.length} />
              </TabsTrigger>
              <TabsTrigger value="hotels">
                <Building2 className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Hotels</span>
                <CountBadge count={hotels.length} />
              </TabsTrigger>
              <TabsTrigger value="restaurants">
                <UtensilsCrossed className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Restaurants</span>
                <CountBadge count={restaurants.length} />
              </TabsTrigger>
              <TabsTrigger value="attractions">
                <MapPin className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Attractions</span>
                <CountBadge count={attractions.length} />
              </TabsTrigger>
              <TabsTrigger value="map">
                <Map className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Map</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="itinerary">
              <TripTimeline
                trip={trip}
                flights={flights}
                hotels={hotels}
                restaurants={restaurants}
                attractions={attractions}
                itinerary={itinerary}
                weather={weather}
                accentColor={palette.accent}
              />
            </TabsContent>

            <TabsContent value="flights">
              <FlightsTab
                flights={flights}
                tripId={trip.id}
                accentColor={palette.accent}
              />
            </TabsContent>

            <TabsContent value="hotels">
              <HotelsTab
                hotels={hotels}
                tripId={trip.id}
                accentColor={palette.accent}
              />
            </TabsContent>

            <TabsContent value="restaurants">
              <RestaurantsTab
                restaurants={restaurants}
                tripId={trip.id}
                accentColor={palette.accent}
              />
            </TabsContent>

            <TabsContent value="attractions">
              <AttractionsTab
                attractions={attractions}
                tripId={trip.id}
                accentColor={palette.accent}
              />
            </TabsContent>

            <TabsContent value="map">
              <MapTab
                tripId={trip.id}
                itinerary={itinerary}
                accentColor={palette.accent}
                onRemoveItem={(itemId) => deleteItem.mutate(itemId)}
              />
              <div className="mt-6">
                <NearMePanel tripId={trip.id} accentColor={palette.accent} />
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      <EditTripDialog trip={trip} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-muted px-1 text-[10px] font-medium text-muted-foreground">
      {count}
    </span>
  );
}

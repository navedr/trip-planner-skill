import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TripCard, TripCardSkeleton } from "@/components/trips/TripCard";
import { NewTripDialog } from "@/components/trips/NewTripDialog";
import { useTrips } from "@/hooks/useTrips";

export function TripsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: trips, isLoading, isPlaceholderData } = useTrips();

  const showSkeletons = isLoading && !trips;

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">
              My Trips
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Plan, research, and organize your adventures
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            New Trip
          </Button>
        </div>

        {/* Loading skeletons */}
        {showSkeletons && (
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
            {Array.from({ length: 3 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Trip grid */}
        {trips && trips.length > 0 && (
          <>
            {isPlaceholderData && (
              <p className="mb-4 text-xs text-muted-foreground/50 italic">
                Showing preview data — connect the backend API for live trips
              </p>
            )}
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]">
              {trips.map((trip, i) => (
                <TripCard key={trip.id} trip={trip} index={i} />
              ))}
            </div>
          </>
        )}

        {/* Empty state */}
        {trips && trips.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 py-24">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <MapPin className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-display mb-2 text-xl font-medium">
              No trips yet
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
              Create your first trip to start researching flights, hotels,
              restaurants, and attractions with AI.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Plan a trip
            </Button>
          </div>
        )}
      </motion.div>

      <NewTripDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

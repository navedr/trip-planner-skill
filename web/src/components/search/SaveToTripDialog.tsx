import { Loader2, MapPin, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTrips } from "@/hooks/useTrips";
import { getDestinationPalette } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Trip } from "@/lib/types";

interface SaveToTripDialogProps {
  open: boolean;
  itemLabel: string | null;
  isSaving: boolean;
  onSelect: (tripId: string) => void;
  onClose: () => void;
  onNewTrip?: () => void;
}

export function SaveToTripDialog({
  open,
  itemLabel,
  isSaving,
  onSelect,
  onClose,
  onNewTrip,
}: SaveToTripDialogProps) {
  const { data: trips, isLoading } = useTrips();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Save to trip
          </DialogTitle>
          {itemLabel && (
            <p className="text-xs text-muted-foreground truncate">
              {itemLabel}
            </p>
          )}
        </DialogHeader>

        <div className="mt-2 space-y-1.5 max-h-[340px] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {trips?.map((trip) => (
            <TripRow
              key={trip.id}
              trip={trip}
              isSaving={isSaving}
              onSelect={onSelect}
            />
          ))}

          {!isLoading && (!trips || trips.length === 0) && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No trips yet — create one to get started.
            </p>
          )}
        </div>

        {onNewTrip && (
          <Button
            variant="outline"
            className="mt-2 w-full gap-2"
            onClick={onNewTrip}
          >
            <Plus className="h-4 w-4" />
            Create new trip
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TripRow({
  trip,
  isSaving,
  onSelect,
}: {
  trip: Trip;
  isSaving: boolean;
  onSelect: (id: string) => void;
}) {
  const palette = getDestinationPalette(trip.destination);
  const dates = `${formatShort(trip.depart_date)} – ${formatShort(trip.return_date)}`;

  return (
    <button
      onClick={() => onSelect(trip.id)}
      disabled={isSaving}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border/30 px-3 py-2.5 text-left transition-colors",
        "hover:bg-muted/50 disabled:opacity-50 disabled:cursor-wait",
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: palette.accent + "18" }}
      >
        <MapPin className="h-4 w-4" style={{ color: palette.accent }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display truncate text-sm font-medium">
          {trip.destination}
        </p>
        <p className="text-[10px] text-muted-foreground">{dates}</p>
      </div>
      <Badge
        variant="outline"
        className="shrink-0 text-[10px] capitalize"
      >
        {trip.status}
      </Badge>
    </button>
  );
}

function formatShort(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

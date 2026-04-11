import { useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useUpdateTrip } from "@/hooks/useTrips";
import type { Trip } from "@/lib/types";

interface EditTripDialogProps {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTripDialog({ trip, open, onOpenChange }: EditTripDialogProps) {
  const updateTrip = useUpdateTrip(trip.id);
  const travelers = trip.travelers_json ?? trip.travelers;
  const prefs = trip.preferences_json ?? trip.preferences;

  const [destination, setDestination] = useState(trip.destination);
  const [origin, setOrigin] = useState(trip.origin);
  const [departDate, setDepartDate] = useState(trip.depart_date);
  const [returnDate, setReturnDate] = useState(trip.return_date);
  const [adults, setAdults] = useState(travelers?.adults ?? 2);
  const [childrenAges, setChildrenAges] = useState<number[]>(travelers?.children_ages ?? []);
  const [status, setStatus] = useState(trip.status);
  const [prefFlights, setPrefFlights] = useState(prefs?.flights ?? "");
  const [prefHotels, setPrefHotels] = useState(prefs?.hotels ?? "");
  const [prefFood, setPrefFood] = useState(prefs?.food ?? "");
  const [prefExcursions, setPrefExcursions] = useState(prefs?.excursions ?? "");

  // Sync state when trip prop changes
  useEffect(() => {
    const t = trip.travelers_json ?? trip.travelers;
    const p = trip.preferences_json ?? trip.preferences;
    setDestination(trip.destination);
    setOrigin(trip.origin);
    setDepartDate(trip.depart_date);
    setReturnDate(trip.return_date);
    setAdults(t?.adults ?? 2);
    setChildrenAges(t?.children_ages ?? []);
    setStatus(trip.status);
    setPrefFlights(p?.flights ?? "");
    setPrefHotels(p?.hotels ?? "");
    setPrefFood(p?.food ?? "");
    setPrefExcursions(p?.excursions ?? "");
  }, [trip]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const preferences: Record<string, string> = {};
    if (prefFlights) preferences.flights = prefFlights;
    if (prefHotels) preferences.hotels = prefHotels;
    if (prefFood) preferences.food = prefFood;
    if (prefExcursions) preferences.excursions = prefExcursions;

    updateTrip.mutate(
      {
        destination,
        origin: origin.toUpperCase(),
        depart_date: departDate,
        return_date: returnDate,
        travelers: { adults, children: childrenAges },
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
        status,
      } as any,
      {
        onSuccess: () => onOpenChange(false),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Edit trip</DialogTitle>
          <DialogDescription>Update your trip details.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-destination">Destination</Label>
              <Input
                id="edit-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-origin">Origin (airport code)</Label>
              <Input
                id="edit-origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                maxLength={4}
                className="uppercase"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-depart">Depart</Label>
              <Input
                id="edit-depart"
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-return">Return</Label>
              <Input
                id="edit-return"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                min={departDate || undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Trip["status"])}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="planning">Planning</option>
              <option value="researching">Researching</option>
              <option value="ready">Ready</option>
            </select>
          </div>

          <Separator />

          <div>
            <Label className="mb-3 block">Travelers</Label>
            <div className="flex items-center gap-3">
              <Label htmlFor="edit-adults" className="text-sm text-muted-foreground">Adults</Label>
              <Input
                id="edit-adults"
                type="number"
                min={1}
                max={10}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-20"
              />
            </div>
            <div className="mt-3 space-y-2">
              {childrenAges.map((age, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Child {i + 1} age</span>
                  <Input
                    type="number"
                    min={0}
                    max={17}
                    value={age}
                    onChange={(e) =>
                      setChildrenAges((prev) => prev.map((a, idx) => (idx === i ? Number(e.target.value) : a)))
                    }
                    className="w-20"
                  />
                  <button
                    type="button"
                    onClick={() => setChildrenAges((prev) => prev.filter((_, idx) => idx !== i))}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setChildrenAges((prev) => [...prev, 5])}
                className="flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-primary/80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add child
              </button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-pref-flights" className="text-xs text-muted-foreground">Flights</Label>
              <Input id="edit-pref-flights" placeholder="e.g. direct, economy" value={prefFlights} onChange={(e) => setPrefFlights(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-pref-hotels" className="text-xs text-muted-foreground">Hotels</Label>
              <Input id="edit-pref-hotels" placeholder="e.g. downtown, pool" value={prefHotels} onChange={(e) => setPrefHotels(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-pref-food" className="text-xs text-muted-foreground">Food</Label>
              <Input id="edit-pref-food" placeholder="e.g. local cuisine" value={prefFood} onChange={(e) => setPrefFood(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-pref-excursions" className="text-xs text-muted-foreground">Excursions</Label>
              <Input id="edit-pref-excursions" placeholder="e.g. hiking, museums" value={prefExcursions} onChange={(e) => setPrefExcursions(e.target.value)} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTrip.isPending}>
              {updateTrip.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

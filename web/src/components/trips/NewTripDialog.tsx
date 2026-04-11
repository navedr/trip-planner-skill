import { useState } from "react";
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
import { useCreateTrip } from "@/hooks/useTrips";

interface NewTripDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewTripDialog({ open, onOpenChange }: NewTripDialogProps) {
  const createTrip = useCreateTrip();

  const [destination, setDestination] = useState("");
  const [origin, setOrigin] = useState("");
  const [departDate, setDepartDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [adults, setAdults] = useState(2);
  const [childrenAges, setChildrenAges] = useState<number[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefFlights, setPrefFlights] = useState("");
  const [prefHotels, setPrefHotels] = useState("");
  const [prefFood, setPrefFood] = useState("");
  const [prefExcursions, setPrefExcursions] = useState("");

  function reset() {
    setDestination("");
    setOrigin("");
    setDepartDate("");
    setReturnDate("");
    setAdults(2);
    setChildrenAges([]);
    setShowPreferences(false);
    setPrefFlights("");
    setPrefHotels("");
    setPrefFood("");
    setPrefExcursions("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const preferences: Record<string, string> = {};
    if (prefFlights) preferences.flights = prefFlights;
    if (prefHotels) preferences.hotels = prefHotels;
    if (prefFood) preferences.food = prefFood;
    if (prefExcursions) preferences.excursions = prefExcursions;

    createTrip.mutate(
      {
        destination,
        origin: origin.toUpperCase(),
        depart_date: departDate,
        return_date: returnDate,
        adults,
        children_ages: childrenAges,
        preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  function addChild() {
    setChildrenAges((prev) => [...prev, 5]);
  }

  function removeChild(index: number) {
    setChildrenAges((prev) => prev.filter((_, i) => i !== index));
  }

  function updateChildAge(index: number, age: number) {
    setChildrenAges((prev) => prev.map((a, i) => (i === index ? age : a)));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            Plan a new trip
          </DialogTitle>
          <DialogDescription>
            Where are you headed? We'll help you research everything.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Destination & Origin */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="e.g. Salt Lake City"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="origin">Origin (airport code)</Label>
              <Input
                id="origin"
                placeholder="e.g. SEA"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                required
                maxLength={4}
                className="uppercase"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="depart">Depart</Label>
              <Input
                id="depart"
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="return">Return</Label>
              <Input
                id="return"
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                min={departDate || undefined}
              />
            </div>
          </div>

          <Separator />

          {/* Travelers */}
          <div>
            <Label className="mb-3 block">Travelers</Label>
            <div className="flex items-center gap-3">
              <Label htmlFor="adults" className="text-sm text-muted-foreground">
                Adults
              </Label>
              <Input
                id="adults"
                type="number"
                min={1}
                max={10}
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="w-20"
              />
            </div>

            {/* Children */}
            <div className="mt-3 space-y-2">
              {childrenAges.map((age, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Child {i + 1} age
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={17}
                    value={age}
                    onChange={(e) => updateChildAge(i, Number(e.target.value))}
                    className="w-20"
                  />
                  <button
                    type="button"
                    onClick={() => removeChild(i)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addChild}
                className="flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-primary/80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add child
              </button>
            </div>
          </div>

          <Separator />

          {/* Preferences (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setShowPreferences((v) => !v)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span
                className="inline-block transition-transform"
                style={{
                  transform: showPreferences ? "rotate(90deg)" : "rotate(0deg)",
                }}
              >
                ›
              </span>
              Preferences{" "}
              <span className="text-xs text-muted-foreground/50">(optional)</span>
            </button>

            {showPreferences && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pref-flights" className="text-xs text-muted-foreground">
                    Flights
                  </Label>
                  <Input
                    id="pref-flights"
                    placeholder="e.g. direct, economy"
                    value={prefFlights}
                    onChange={(e) => setPrefFlights(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pref-hotels" className="text-xs text-muted-foreground">
                    Hotels
                  </Label>
                  <Input
                    id="pref-hotels"
                    placeholder="e.g. downtown, pool"
                    value={prefHotels}
                    onChange={(e) => setPrefHotels(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pref-food" className="text-xs text-muted-foreground">
                    Food
                  </Label>
                  <Input
                    id="pref-food"
                    placeholder="e.g. local cuisine, seafood"
                    value={prefFood}
                    onChange={(e) => setPrefFood(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pref-excursions" className="text-xs text-muted-foreground">
                    Excursions
                  </Label>
                  <Input
                    id="pref-excursions"
                    placeholder="e.g. hiking, museums"
                    value={prefExcursions}
                    onChange={(e) => setPrefExcursions(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTrip.isPending}>
              {createTrip.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Create trip"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

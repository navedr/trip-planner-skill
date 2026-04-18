import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { FlightCard } from "./FlightCard";
import { ClearAllButton } from "./ClearAllButton";
import { useSelectItem, useDeleteItem } from "@/hooks/useTripItems";
import { stagger, fadeUp } from "@/lib/motion";
import type { FlightOption } from "@/lib/types";

interface FlightsTabProps {
  flights: FlightOption[];
  tripId: string;
  accentColor: string;
}

export function FlightsTab({ flights, tripId, accentColor }: FlightsTabProps) {
  const selectItem = useSelectItem(tripId);
  const deleteItem = useDeleteItem(tripId);
  const getDirection = (f: FlightOption) => f.direction ?? (f as any)._direction ?? "outbound";
  const outbound = flights.filter((f) => getDirection(f) === "outbound");
  const returnFlights = flights.filter((f) => getDirection(f) === "return");

  if (flights.length === 0) {
    return <EmptyState />;
  }

  const clearable = flights.filter((f) => !f.is_selected).map((f) => f.id);
  const hasSelected = flights.some((f) => f.is_selected);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      <motion.div variants={fadeUp} className="flex justify-end">
        <ClearAllButton
          tripId={tripId}
          itemIds={clearable}
          label="flight options"
          note={hasSelected ? "Your selected flight(s) will be kept." : undefined}
        />
      </motion.div>
      {outbound.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display mb-3 text-sm font-medium text-muted-foreground">
            Outbound Flights
          </h3>
          <div className="space-y-3">
            {outbound.map((f) => (
              <FlightCard
                key={f.id}
                flight={f}
                accentColor={accentColor}
                onSelect={() => selectItem.mutate(f.id)}
                onRemove={() => deleteItem.mutate(f.id)}
              />
            ))}
          </div>
        </motion.div>
      )}

      {returnFlights.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="font-display mb-3 text-sm font-medium text-muted-foreground">
            Return Flights
          </h3>
          <div className="space-y-3">
            {returnFlights.map((f) => (
              <FlightCard
                key={f.id}
                flight={f}
                accentColor={accentColor}
                onSelect={() => selectItem.mutate(f.id)}
                onRemove={() => deleteItem.mutate(f.id)}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Plane className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        No flights yet — ask the AI to search for flights
      </p>
    </div>
  );
}

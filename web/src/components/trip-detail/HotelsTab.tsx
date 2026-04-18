import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { HotelCard } from "./HotelCard";
import { ClearAllButton } from "./ClearAllButton";
import { useSelectItem, useDeleteItem } from "@/hooks/useTripItems";
import { staggerSlow, fadeUp } from "@/lib/motion";
import type { HotelOption } from "@/lib/types";

interface HotelsTabProps {
  hotels: HotelOption[];
  tripId: string;
  accentColor: string;
}

export function HotelsTab({ hotels, tripId, accentColor }: HotelsTabProps) {
  const selectItem = useSelectItem(tripId);
  const deleteItem = useDeleteItem(tripId);

  if (hotels.length === 0) {
    return <EmptyState />;
  }

  const clearable = hotels.filter((h) => !h.is_selected).map((h) => h.id);
  const hasSelected = hotels.some((h) => h.is_selected);

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ClearAllButton
          tripId={tripId}
          itemIds={clearable}
          label="hotel options"
          note={hasSelected ? "Your selected hotel will be kept." : undefined}
        />
      </div>
      <motion.div
        variants={staggerSlow}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2"
      >
        {hotels.map((h) => (
          <motion.div key={h.id} variants={fadeUp} className="min-w-0">
            <HotelCard
              hotel={h}
              accentColor={accentColor}
              onSelect={() => selectItem.mutate(h.id)}
              onRemove={() => deleteItem.mutate(h.id)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">
        No hotels yet — ask the AI to find accommodations
      </p>
    </div>
  );
}

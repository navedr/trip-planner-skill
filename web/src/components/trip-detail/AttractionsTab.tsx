import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { AttractionCard } from "./AttractionCard";
import { ClearAllButton } from "./ClearAllButton";
import { useDeleteItem } from "@/hooks/useTripItems";
import { stagger, fadeUp } from "@/lib/motion";
import type { Attraction } from "@/lib/types";

interface AttractionsTabProps {
  attractions: Attraction[];
  tripId: string;
  accentColor: string;
}

export function AttractionsTab({ attractions, tripId, accentColor }: AttractionsTabProps) {
  const deleteItem = useDeleteItem(tripId);
  if (attractions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <MapPin className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No attractions yet — ask the AI for things to do
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <ClearAllButton
          tripId={tripId}
          itemIds={attractions.map((a) => a.id)}
          label="attractions"
        />
      </div>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2"
      >
        {attractions.map((a) => (
          <motion.div key={a.id} variants={fadeUp} className="min-w-0">
            <AttractionCard attraction={a} accentColor={accentColor} onRemove={() => deleteItem.mutate(a.id)} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

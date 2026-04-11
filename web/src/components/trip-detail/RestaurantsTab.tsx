import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";
import { RestaurantCard } from "./RestaurantCard";
import { useDeleteItem } from "@/hooks/useTripItems";
import { stagger, fadeUp } from "@/lib/motion";
import type { Restaurant } from "@/lib/types";

interface RestaurantsTabProps {
  restaurants: Restaurant[];
  tripId: string;
  accentColor: string;
}

export function RestaurantsTab({ restaurants, tripId, accentColor }: RestaurantsTabProps) {
  const deleteItem = useDeleteItem(tripId);
  if (restaurants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No restaurants yet — ask the AI for dining recommendations
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="grid gap-4 sm:grid-cols-2"
    >
      {restaurants.map((r) => (
        <motion.div key={r.id} variants={fadeUp}>
          <RestaurantCard restaurant={r} accentColor={accentColor} onRemove={() => deleteItem.mutate(r.id)} />
        </motion.div>
      ))}
    </motion.div>
  );
}

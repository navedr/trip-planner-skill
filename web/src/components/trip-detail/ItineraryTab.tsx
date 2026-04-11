import { motion } from "framer-motion";
import { CalendarDays } from "lucide-react";
import { ItineraryDayCard } from "./ItineraryDayCard";
import { staggerSlow, fadeUp } from "@/lib/motion";
import type { ItineraryDay } from "@/lib/types";

interface ItineraryTabProps {
  days: ItineraryDay[];
  accentColor: string;
}

export function ItineraryTab({ days, accentColor }: ItineraryTabProps) {
  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          No itinerary yet — ask the AI to build a day-by-day plan
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerSlow}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {days.map((day) => (
        <motion.div key={day.day_number} variants={fadeUp}>
          <ItineraryDayCard day={day} accentColor={accentColor} />
        </motion.div>
      ))}
    </motion.div>
  );
}

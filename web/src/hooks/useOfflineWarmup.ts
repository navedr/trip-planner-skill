import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api";

const CATEGORIES = ["flight", "hotel", "restaurant", "attraction"] as const;

export function useOfflineWarmup(tripId: string | undefined): void {
  const warmedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!tripId) return;
    if (!navigator.onLine) return;
    if (warmedRef.current === tripId) return;
    warmedRef.current = tripId;

    const paths = [
      `/trips/${tripId}`,
      ...CATEGORIES.map((c) => `/trips/${tripId}/items?category=${c}`),
      `/trips/${tripId}/itinerary`,
      `/trips/${tripId}/items/map`,
      `/trips/${tripId}/weather`,
    ];

    for (const path of paths) {
      apiFetch(path).catch(() => {
        /* fire-and-forget; errors are expected for some endpoints */
      });
    }
  }, [tripId]);
}

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { DayWeather } from "@/lib/types";

export function useTripWeather(tripId: string | undefined) {
  return useQuery({
    queryKey: ["trip-weather", tripId],
    queryFn: async () => {
      try {
        return await apiFetch<DayWeather[]>(`/trips/${tripId}/weather`);
      } catch {
        return [] as DayWeather[];
      }
    },
    enabled: !!tripId,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}

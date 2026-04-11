import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { MOCK_TRIPS } from "@/lib/mock-data";
import type { Trip, TripCreate } from "@/lib/types";

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: () => apiFetch<Trip[]>("/trips"),
    placeholderData: MOCK_TRIPS,
    retry: false,
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TripCreate) =>
      apiFetch<Trip>("/trips", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useUpdateTrip(tripId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<TripCreate>) =>
      apiFetch<Trip>(`/trips/${tripId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

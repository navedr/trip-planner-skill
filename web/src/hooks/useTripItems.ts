import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { TripItemCategory } from "@/lib/types";

interface CreateItemPayload {
  category: TripItemCategory;
  data: Record<string, unknown>;
}

export function useCreateItem(tripId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) =>
      apiFetch(`/trips/${tripId}/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trip-items", tripId],
      });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
  });
}

export function useSelectItem(tripId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/trips/${tripId}/items/${itemId}/select`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trip-items", tripId],
      });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

export function useDeleteItem(tripId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) =>
      apiFetch(`/trips/${tripId}/items/${itemId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["trip-items", tripId],
      });
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
    },
  });
}

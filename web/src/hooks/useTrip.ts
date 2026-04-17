import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { getMockTrip, getMockItems, getMockItinerary, getMockMapItems } from "@/lib/mock-data";
import type {
  Trip,
  FlightOption,
  HotelOption,
  Restaurant,
  Attraction,
  ItineraryDay,
  TripItemCategory,
  MapItem,
} from "@/lib/types";

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => apiFetch<Trip>(`/trips/${id}`),
    enabled: !!id,
    placeholderData: id ? getMockTrip(id) : undefined,
    retry: false,
  });
}

type ItemMap = {
  flight: FlightOption[];
  hotel: HotelOption[];
  restaurant: Restaurant[];
  attraction: Attraction[];
};

/** Raw shape returned by GET /trips/:id/items */
interface TripItemResponse {
  id: string;
  trip_id: string;
  category: string;
  data: Record<string, unknown> | null;
  is_selected: boolean;
  source_url: string | null;
  created_at: string | null;
}

export function useTripItems<C extends TripItemCategory>(
  tripId: string | undefined,
  category: C,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic placeholder data needs cast
  const placeholder = tripId ? getMockItems(tripId, category) : undefined;

  return useQuery<ItemMap[C]>({
    queryKey: ["trip-items", tripId, category],
    queryFn: async () => {
      const raw = await apiFetch<TripItemResponse[]>(
        `/trips/${tripId}/items?category=${category}`,
      );
      // Unwrap: merge data_json fields + id/is_selected onto a flat object
      return raw.map((item) => {
        const data = (item.data ?? {}) as Record<string, unknown>;
        // Hotels store multiple booking sources as a dict (kayak, booking_com, ...).
        // Flatten to a single booking_url so HotelCard renders a link.
        if (category === "hotel" && !data.booking_url) {
          const urls = data.booking_urls as Record<string, string> | undefined;
          const first = urls ? Object.values(urls)[0] : undefined;
          data.booking_url = first ?? item.source_url ?? null;
        }
        return {
          ...data,
          id: item.id,
          is_selected: item.is_selected,
          source_url: item.source_url,
        };
      }) as unknown as ItemMap[C];
    },
    enabled: !!tripId,
    placeholderData: placeholder as any,
    retry: false,
  });
}

export function useItinerary(tripId: string | undefined) {
  return useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: () => apiFetch<ItineraryDay[]>(`/trips/${tripId}/itinerary`),
    enabled: !!tripId,
    placeholderData: tripId ? getMockItinerary(tripId) : undefined,
    retry: false,
  });
}

/** Fetch all geocoded items for the map view */
export function useMapItems(tripId: string | undefined) {
  return useQuery({
    queryKey: ["map-items", tripId],
    queryFn: () => apiFetch<MapItem[]>(`/trips/${tripId}/items/map`),
    enabled: !!tripId,
    placeholderData: tripId ? getMockMapItems(tripId) : undefined,
    retry: false,
  });
}

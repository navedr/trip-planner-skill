import { useEffect, useRef } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { MapItem } from "@/lib/types";

/**
 * Geocode items missing coordinates client-side and PATCH the result back.
 *
 * Why client-side: our `GOOGLE_MAPS_API_KEY` is referer-restricted, which
 * Google's server Geocoding API rejects. The JS Geocoder honors referer
 * restrictions, so this is the only path that works without issuing a
 * second, unrestricted key.
 *
 * Results are persisted on the server so this cost is paid once per item.
 */
export function useClientGeocode(tripId: string | undefined, items: MapItem[]) {
  const geocodingLib = useMapsLibrary("geocoding");
  const queryClient = useQueryClient();
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!geocodingLib || !tripId) return;
    const geocoder = new geocodingLib.Geocoder();

    const pending = items.filter(
      (i) => !i.location && i.address_hint && !pendingRef.current.has(i.id),
    );
    if (pending.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const item of pending) {
        pendingRef.current.add(item.id);
        try {
          const res = await geocoder.geocode({ address: item.address_hint! });
          const first = res.results[0];
          if (!first) continue;
          const loc = first.geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          await apiFetch(`/trips/${tripId}/items/${item.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              data: {
                ...(item.data ?? {}),
                latitude: lat,
                longitude: lng,
                formatted_address: first.formatted_address,
              },
            }),
          });
          if (cancelled) return;
        } catch {
          // Non-fatal — leave item un-mapped, try again on next mount.
          pendingRef.current.delete(item.id);
        }
      }
      if (!cancelled) {
        queryClient.invalidateQueries({ queryKey: ["map-items", tripId] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [geocodingLib, tripId, items, queryClient]);
}

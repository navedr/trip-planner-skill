import { useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { ExternalLink, Loader2, MapPinOff, WifiOff } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { useMapItems } from "@/hooks/useTrip";
import { useClientGeocode } from "@/hooks/useClientGeocode";
import { useOnline } from "@/hooks/useOnline";
import { DaySelector } from "./DaySelector";
import { MapMarker } from "./MapMarker";
import { MapInfoWindow } from "./MapInfoWindow";
import type { MapItem, GeoLocation, ItineraryDay } from "@/lib/types";

type LocatedMapItem = MapItem & { location: GeoLocation };

interface MapTabProps {
  tripId: string;
  itinerary: ItineraryDay[];
  accentColor: string;
  onRemoveItem?: (id: string) => void;
}

export function MapTab({
  tripId,
  itinerary,
  accentColor,
  onRemoveItem,
}: MapTabProps) {
  const { apiKey, isLoading: keyLoading } = useGoogleMapsKey();
  const { data: mapItems = [], isLoading: itemsLoading } = useMapItems(tripId);
  const online = useOnline();

  if (!online) {
    return <OfflineMapList mapItems={mapItems} />;
  }

  if (keyLoading || itemsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
          <MapPinOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-display mb-1 text-base font-medium">
          Map unavailable
        </h3>
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Add a Google Maps API key in Settings to enable the map view.
        </p>
      </div>
    );
  }

  if (mapItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
          <MapPinOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-display mb-1 text-base font-medium">
          No locations to display
        </h3>
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Search for hotels, restaurants, or attractions to populate the map.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey} libraries={["geocoding"]}>
      <MapContent
        tripId={tripId}
        mapItems={mapItems}
        itinerary={itinerary}
        accentColor={accentColor}
        onRemoveItem={onRemoveItem}
      />
    </APIProvider>
  );
}

/* ─── Inner map content (needs APIProvider ancestor) ─── */

function MapContent({
  tripId,
  mapItems,
  itinerary,
  accentColor,
  onRemoveItem,
}: {
  tripId: string;
  mapItems: MapItem[];
  itinerary: ItineraryDay[];
  accentColor: string;
  onRemoveItem?: (id: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeItem, setActiveItem] = useState<{
    item: LocatedMapItem;
    marker: google.maps.marker.AdvancedMarkerElement;
  } | null>(null);

  // Geocode items missing coords (client-side, referer-restricted key).
  useClientGeocode(tripId, mapItems);
  const pendingCount = mapItems.filter((i) => !i.location).length;
  const locatedItems = useMemo(
    () => mapItems.filter((i): i is LocatedMapItem => i.location !== null),
    [mapItems],
  );

  // Filter items by selected day
  const visibleItems = useMemo(() => {
    if (selectedDay === null) return locatedItems;

    const day = itinerary.find((d) => d.day_number === selectedDay);
    if (!day) return locatedItems;

    // Collect activity names for matching
    const activityNames = new Set(
      day.activities.map((a) => a.name.toLowerCase()),
    );

    return locatedItems.filter((item) => {
      // Hotels always visible
      if (item.category === "hotel") return true;
      // Match by name (case-insensitive, partial)
      const itemName = item.name.toLowerCase();
      for (const actName of activityNames) {
        if (actName.includes(itemName) || itemName.includes(actName))
          return true;
      }
      return false;
    });
  }, [locatedItems, itinerary, selectedDay]);

  const handleMarkerClick = useCallback(
    (item: LocatedMapItem, marker: google.maps.marker.AdvancedMarkerElement) => {
      setActiveItem({ item, marker });
    },
    [],
  );

  const handleInfoWindowClose = useCallback(() => {
    setActiveItem(null);
  }, []);

  // Compute center from items
  const defaultCenter = useMemo(() => {
    if (locatedItems.length === 0) return { lat: 40.76, lng: -111.89 };
    const sumLat = locatedItems.reduce((s, i) => s + i.location.lat, 0);
    const sumLng = locatedItems.reduce((s, i) => s + i.location.lng, 0);
    return { lat: sumLat / locatedItems.length, lng: sumLng / locatedItems.length };
  }, [locatedItems]);

  return (
    <div className="flex flex-col gap-3">
      {/* Day selector */}
      {itinerary.length > 0 && (
        <DaySelector
          totalDays={itinerary.length}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          accentColor={accentColor}
        />
      )}

      {pendingCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-border/40 bg-card/50 px-3 py-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Looking up coordinates for {pendingCount} item{pendingCount === 1 ? "" : "s"}…
        </div>
      )}

      {/* Map */}
      <div className="relative overflow-hidden rounded-xl border border-border/30" style={{ height: "500px" }}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="voyager-trip-map"
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          {visibleItems.map((item) => (
            <MapMarker
              key={item.id}
              item={item}
              onClick={handleMarkerClick}
            />
          ))}

          {activeItem && (
            <MapInfoWindow
              item={activeItem.item}
              anchor={activeItem.marker}
              onClose={handleInfoWindowClose}
              onRemove={onRemoveItem}
            />
          )}

          <AutoFitBounds items={visibleItems} />
        </Map>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <LegendDot color="#3b82f6" label="Hotel" />
        <LegendDot color="#f97316" label="Restaurant" />
        <LegendDot color="#22c55e" label="Attraction" />
        <LegendDot color="#6b7280" label="Airport" />
      </div>
    </div>
  );
}

/* ─── Auto-fit bounds to visible markers ─── */

function AutoFitBounds({ items }: { items: LocatedMapItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || items.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const item of items) {
      bounds.extend(item.location);
    }
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }, [map, items]);

  return null;
}

/* ─── Offline fallback list ─── */

function OfflineMapList({ mapItems }: { mapItems: MapItem[] }) {
  if (mapItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
          <WifiOff className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="font-display mb-1 text-base font-medium">
          Offline — no cached locations
        </h3>
        <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
          Reconnect to load the map and your pinned places.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <WifiOff className="h-3.5 w-3.5" />
        Offline — showing pinned places as a list. The map will return once you&apos;re back online.
      </div>
      <ul className="flex flex-col gap-2">
        {mapItems.map((item) => {
          const address = item.address_hint ?? item.detail ?? null;
          const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            address ? `${item.name} ${address}` : item.name,
          )}`;
          return (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-border/30 bg-card/50 px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                {address && (
                  <p className="truncate text-xs text-muted-foreground">{address}</p>
                )}
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground/70">
                  {item.category}
                </p>
              </div>
              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/40 px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                Directions
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ─── Legend dot ─── */

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

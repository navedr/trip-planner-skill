import { useCallback, useEffect, useMemo, useState } from "react";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { Loader2, MapPinOff } from "lucide-react";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { useMapItems } from "@/hooks/useTrip";
import { DaySelector } from "./DaySelector";
import { MapMarker } from "./MapMarker";
import { MapInfoWindow } from "./MapInfoWindow";
import type { MapItem, ItineraryDay } from "@/lib/types";

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
          Items need geocoded coordinates to appear on the map. Search for
          hotels, restaurants, or attractions to populate the map.
        </p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <MapContent
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
  mapItems,
  itinerary,
  accentColor,
  onRemoveItem,
}: {
  mapItems: MapItem[];
  itinerary: ItineraryDay[];
  accentColor: string;
  onRemoveItem?: (id: string) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [activeItem, setActiveItem] = useState<{
    item: MapItem;
    marker: google.maps.marker.AdvancedMarkerElement;
  } | null>(null);

  // Filter items by selected day
  const visibleItems = useMemo(() => {
    if (selectedDay === null) return mapItems;

    const day = itinerary.find((d) => d.day_number === selectedDay);
    if (!day) return mapItems;

    // Collect activity names for matching
    const activityNames = new Set(
      day.activities.map((a) => a.name.toLowerCase()),
    );

    return mapItems.filter((item) => {
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
  }, [mapItems, itinerary, selectedDay]);

  const handleMarkerClick = useCallback(
    (item: MapItem, marker: google.maps.marker.AdvancedMarkerElement) => {
      setActiveItem({ item, marker });
    },
    [],
  );

  const handleInfoWindowClose = useCallback(() => {
    setActiveItem(null);
  }, []);

  // Compute center from items
  const defaultCenter = useMemo(() => {
    if (mapItems.length === 0) return { lat: 40.76, lng: -111.89 };
    const sumLat = mapItems.reduce((s, i) => s + i.location.lat, 0);
    const sumLng = mapItems.reduce((s, i) => s + i.location.lng, 0);
    return { lat: sumLat / mapItems.length, lng: sumLng / mapItems.length };
  }, [mapItems]);

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

function AutoFitBounds({ items }: { items: MapItem[] }) {
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

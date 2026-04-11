import { useCallback } from "react";
import {
  AdvancedMarker,
  Pin,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import type { MapItem, TripItemCategory } from "@/lib/types";

/** Category → marker colors */
const categoryColors: Record<
  TripItemCategory,
  { background: string; border: string; glyph: string }
> = {
  hotel: { background: "#3b82f6", border: "#1d4ed8", glyph: "#dbeafe" },
  restaurant: { background: "#f97316", border: "#c2410c", glyph: "#ffedd5" },
  attraction: { background: "#22c55e", border: "#15803d", glyph: "#dcfce7" },
  flight: { background: "#6b7280", border: "#374151", glyph: "#e5e7eb" },
};

interface MapMarkerProps {
  item: MapItem;
  onClick: (item: MapItem, marker: google.maps.marker.AdvancedMarkerElement) => void;
}

export function MapMarker({ item, onClick }: MapMarkerProps) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const colors = categoryColors[item.category];

  const handleClick = useCallback(() => {
    if (marker) onClick(item, marker);
  }, [marker, item, onClick]);

  return (
    <AdvancedMarker
      ref={markerRef}
      position={item.location}
      onClick={handleClick}
    >
      <Pin
        background={colors.background}
        borderColor={colors.border}
        glyphColor={colors.glyph}
      />
    </AdvancedMarker>
  );
}

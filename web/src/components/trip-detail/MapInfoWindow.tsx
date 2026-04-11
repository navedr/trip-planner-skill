import { InfoWindow } from "@vis.gl/react-google-maps";
import { ExternalLink, Trash2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MapItem, TripItemCategory } from "@/lib/types";

const categoryLabels: Record<TripItemCategory, string> = {
  hotel: "Hotel",
  restaurant: "Restaurant",
  attraction: "Attraction",
  flight: "Airport",
};

const categoryBadgeColors: Record<TripItemCategory, string> = {
  hotel: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  restaurant: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  attraction: "bg-green-500/15 text-green-400 border-green-500/30",
  flight: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

interface MapInfoWindowProps {
  item: MapItem;
  anchor: google.maps.marker.AdvancedMarkerElement;
  onClose: () => void;
  onRemove?: (id: string) => void;
}

export function MapInfoWindow({
  item,
  anchor,
  onClose,
  onRemove,
}: MapInfoWindowProps) {
  return (
    <InfoWindow anchor={anchor} onClose={onClose} maxWidth={260}>
      <div style={{ padding: "4px 0" }}>
        {/* Category badge */}
        <Badge
          variant="outline"
          className={`mb-1.5 text-[10px] ${categoryBadgeColors[item.category]}`}
        >
          {categoryLabels[item.category]}
        </Badge>

        {/* Name */}
        <h4 style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 600, color: "#1a1a1a" }}>
          {item.name}
        </h4>

        {/* Detail / time */}
        {(item.detail || item.time) && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
            {item.time && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", fontSize: "12px", color: "#666" }}>
                <Clock style={{ width: "12px", height: "12px" }} />
                {item.time}
              </span>
            )}
            {item.detail && (
              <span style={{ fontSize: "12px", color: "#666" }}>
                {item.detail}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#3b82f6",
                textDecoration: "none",
              }}
            >
              <ExternalLink style={{ width: "12px", height: "12px" }} />
              View
            </a>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(item.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "#ef4444",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              <Trash2 style={{ width: "12px", height: "12px" }} />
              Remove
            </button>
          )}
        </div>
      </div>
    </InfoWindow>
  );
}

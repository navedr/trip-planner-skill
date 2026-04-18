import { useMemo, useState } from "react";
import {
  Building2,
  ChevronDown,
  Loader2,
  MapPin,
  Navigation,
  UtensilsCrossed,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMapItems } from "@/hooks/useTrip";
import type { MapItem, TripItemCategory } from "@/lib/types";

interface NearMePanelProps {
  tripId: string;
  accentColor: string;
}

type LocatedItem = MapItem & { location: { lat: number; lng: number } };

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function useMiles(): boolean {
  return typeof navigator !== "undefined"
    ? navigator.language?.startsWith("en-US") ?? false
    : false;
}

function formatDistance(meters: number, miles: boolean): string {
  if (miles) {
    const mi = meters / 1609.344;
    if (mi < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return `${mi.toFixed(1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function iconForCategory(category: TripItemCategory) {
  switch (category) {
    case "hotel":
      return Building2;
    case "restaurant":
      return UtensilsCrossed;
    default:
      return MapPin;
  }
}

export function NearMePanel({ tripId, accentColor }: NearMePanelProps) {
  const { data: mapItems = [] } = useMapItems(tripId);
  const [open, setOpen] = useState(false);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const miles = useMiles();

  const located = useMemo(
    () =>
      mapItems.filter(
        (i): i is LocatedItem =>
          i.location !== null &&
          typeof i.location?.lat === "number" &&
          typeof i.location?.lng === "number",
      ),
    [mapItems],
  );

  const nearest = useMemo(() => {
    if (!userPos) return [];
    return located
      .map((item) => ({
        item,
        distance: haversineMeters(
          userPos.lat,
          userPos.lng,
          item.location.lat,
          item.location.lng,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [located, userPos]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setErrorMsg("Geolocation not supported on this device.");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("idle");
      },
      () => {
        setStatus("error");
        setErrorMsg("Enable location to see nearby stops.");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !userPos && status !== "loading") {
      requestLocation();
    }
  };

  return (
    <div className="rounded-xl border border-border/30 bg-card/30 p-4">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2">
          <Navigation
            className="h-4 w-4"
            style={{ color: accentColor }}
          />
          <span className="font-display text-sm font-medium">Near me</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="mt-3">
          {status === "loading" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Getting your location…
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{errorMsg}</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={requestLocation}
                className="w-fit"
              >
                Retry
              </Button>
            </div>
          )}

          {status === "idle" && userPos && located.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No pinned locations yet.
            </p>
          )}

          {status === "idle" && userPos && nearest.length > 0 && (
            <ul className="flex flex-col gap-2">
              {nearest.map(({ item, distance }) => {
                const Icon = iconForCategory(item.category);
                const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.location.lat},${item.location.lng}`;
                return (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/20 bg-background/40 px-3 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon
                        className="h-4 w-4 shrink-0 text-muted-foreground"
                        style={{ color: accentColor }}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {formatDistance(distance, miles)} away
                        </p>
                      </div>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                    >
                      <a
                        href={dirUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Directions
                      </a>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

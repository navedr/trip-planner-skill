import {
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
  Star,
  Clock,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type {
  FlightOption,
  HotelOption,
  Restaurant,
  Attraction,
  TripItemCategory,
} from "@/lib/types";

type SearchItem =
  | { category: "flight"; data: FlightOption }
  | { category: "hotel"; data: HotelOption }
  | { category: "restaurant"; data: Restaurant }
  | { category: "attraction"; data: Attraction };

interface SearchResultCardProps {
  item: SearchItem;
  accentColor: string;
  onSave: (
    category: TripItemCategory,
    data: Record<string, unknown>,
    label: string,
  ) => void;
}

export function SearchResultCard({
  item,
  accentColor,
  onSave,
}: SearchResultCardProps) {
  switch (item.category) {
    case "flight":
      return (
        <FlightResult
          flight={item.data}
          accent={accentColor}
          onSave={onSave}
        />
      );
    case "hotel":
      return (
        <HotelResult
          hotel={item.data}
          accent={accentColor}
          onSave={onSave}
        />
      );
    case "restaurant":
      return (
        <RestaurantResult
          restaurant={item.data}
          accent={accentColor}
          onSave={onSave}
        />
      );
    case "attraction":
      return (
        <AttractionResult
          attraction={item.data}
          accent={accentColor}
          onSave={onSave}
        />
      );
  }
}

/* ─── Shared save button ─── */

function SaveButton({
  onClick,
  accent,
}: {
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
      style={{ color: accent }}
    >
      <Bookmark className="h-3 w-3" />
      Save to trip
    </button>
  );
}

/* ─── Flight ─── */

function FlightResult({
  flight,
  accent,
  onSave,
}: {
  flight: FlightOption;
  accent: string;
  onSave: SearchResultCardProps["onSave"];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-border/70">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: accent + "18" }}
          >
            <Plane className="h-4 w-4" style={{ color: accent }} />
          </span>
          <div>
            <p className="text-sm font-medium">{flight.airline}</p>
            <p className="text-[10px] text-muted-foreground">
              {flight.flight_number ?? flight.class} · {flight.direction}
            </p>
          </div>
        </div>
        <div className="text-center">
          <p className="text-xs font-medium">
            {flight.depart_time} → {flight.arrive_time}
          </p>
          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {flight.duration}
            {flight.stops === 0 && (
              <Badge variant="outline" className="ml-1 text-[9px] border-sage/30 text-sage">
                Nonstop
              </Badge>
            )}
          </div>
        </div>
        <p className="text-lg font-semibold" style={{ color: accent }}>
          ${flight.price_per_person}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
        <div className="flex items-center gap-2">
          {flight.booking_url && (
            <a
              href={flight.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              Book
            </a>
          )}
        </div>
        <SaveButton
          accent={accent}
          onClick={() =>
            onSave("flight", flight as unknown as Record<string, unknown>, `${flight.airline} ${flight.depart_time}`)
          }
        />
      </div>
    </div>
  );
}

/* ─── Hotel ─── */

function HotelResult({
  hotel,
  accent,
  onSave,
}: {
  hotel: HotelOption;
  accent: string;
  onSave: SearchResultCardProps["onSave"];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-display truncate text-base font-medium">{hotel.name}</h4>
          <p className="text-xs text-muted-foreground">{hotel.location}</p>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent + "18" }}
        >
          <Building2 className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        {hotel.guest_rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="text-sm font-medium">{hotel.guest_rating}</span>
          </div>
        )}
        {hotel.amenities.length > 0 && (
          <div className="flex gap-1">
            {hotel.amenities.slice(0, 3).map((a) => (
              <Badge key={a} variant="outline" className="text-[10px] font-normal">
                {a}
              </Badge>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border/30 pt-3">
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold" style={{ color: accent }}>
            ${hotel.price_per_night}
          </p>
          <span className="text-[10px] text-muted-foreground">/ night</span>
          {hotel.booking_url && (
            <a
              href={hotel.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <SaveButton
          accent={accent}
          onClick={() =>
            onSave("hotel", hotel as unknown as Record<string, unknown>, hotel.name)
          }
        />
      </div>
    </div>
  );
}

/* ─── Restaurant ─── */

function RestaurantResult({
  restaurant,
  accent,
  onSave,
}: {
  restaurant: Restaurant;
  accent: string;
  onSave: SearchResultCardProps["onSave"];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display truncate text-base font-medium">
              {restaurant.name}
            </h4>
            {restaurant.url && (
              <a
                href={restaurant.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{restaurant.cuisine}</span>
            {restaurant.price_level && (
              <span style={{ color: accent }}>{restaurant.price_level}</span>
            )}
          </div>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent + "18" }}
        >
          <UtensilsCrossed className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>
      {restaurant.rating && (
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold text-gold" />
          <span className="text-sm font-medium">{restaurant.rating}</span>
        </div>
      )}
      {restaurant.highlights && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {restaurant.highlights}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end border-t border-border/30 pt-3">
        <SaveButton
          accent={accent}
          onClick={() =>
            onSave("restaurant", restaurant as unknown as Record<string, unknown>, restaurant.name)
          }
        />
      </div>
    </div>
  );
}

/* ─── Attraction ─── */

function AttractionResult({
  attraction,
  accent,
  onSave,
}: {
  attraction: Attraction;
  accent: string;
  onSave: SearchResultCardProps["onSave"];
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card p-4 transition-colors hover:border-border/70">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display truncate text-base font-medium">
              {attraction.name}
            </h4>
            {attraction.url && (
              <a
                href={attraction.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <Badge
            variant="outline"
            className="mt-1 text-[10px] capitalize"
            style={{ borderColor: accent + "40", color: accent }}
          >
            {attraction.type}
          </Badge>
        </div>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent + "18" }}
        >
          <MapPin className="h-4 w-4" style={{ color: accent }} />
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {attraction.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="font-medium">{attraction.rating}</span>
          </div>
        )}
        {attraction.price && (
          <span className="text-muted-foreground">{attraction.price}</span>
        )}
      </div>
      {attraction.highlights && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
          {attraction.highlights}
        </p>
      )}
      <div className="mt-3 flex items-center justify-end border-t border-border/30 pt-3">
        <SaveButton
          accent={accent}
          onClick={() =>
            onSave("attraction", attraction as unknown as Record<string, unknown>, attraction.name)
          }
        />
      </div>
    </div>
  );
}

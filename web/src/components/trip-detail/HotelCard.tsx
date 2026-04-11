import { Building2, Star, ExternalLink, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HotelOption } from "@/lib/types";

interface HotelCardProps {
  hotel: HotelOption;
  accentColor: string;
  onSelect?: () => void;
  onRemove?: () => void;
}

export function HotelCard({ hotel, accentColor, onSelect, onRemove }: HotelCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl border bg-card transition-colors",
        hotel.is_selected
          ? "border-sage/50 ring-1 ring-sage/30"
          : "border-border/40 hover:border-border/70",
      )}
    >
      {hotel.is_selected && (
        <div className="absolute -top-2 -right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-sage">
          <Check className="h-3 w-3 text-white" />
        </div>
      )}

      <div className="flex-1 p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-display text-base font-medium leading-tight">
              {hotel.name}
            </h4>
            <p className="mt-0.5 text-xs text-muted-foreground">{hotel.location}</p>
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentColor + "18" }}
          >
            <Building2 className="h-4 w-4" style={{ color: accentColor }} />
          </span>
        </div>

        {/* Rating */}
        <div className="mb-3 flex items-center gap-2">
          {hotel.guest_rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="text-sm font-medium">{hotel.guest_rating}</span>
              {hotel.guest_rating_source && (
                <span className="text-[10px] text-muted-foreground">
                  ({hotel.guest_rating_source})
                </span>
              )}
            </div>
          )}
          {hotel.review_count && (
            <span className="text-[10px] text-muted-foreground">
              {hotel.review_count.toLocaleString()} reviews
            </span>
          )}
          {hotel.star_rating && (
            <Badge variant="outline" className="text-[10px]">
              {hotel.star_rating}★
            </Badge>
          )}
        </div>

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {hotel.amenities.slice(0, 4).map((a) => (
              <Badge key={a} variant="outline" className="text-[10px] font-normal">
                {a}
              </Badge>
            ))}
            {hotel.amenities.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                +{hotel.amenities.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Review summary */}
        {hotel.review_summary && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            "{hotel.review_summary}"
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
        <div>
          <p className="text-lg font-semibold" style={{ color: accentColor }}>
            ${hotel.price_per_night}
          </p>
          <p className="text-[10px] text-muted-foreground">
            per night{hotel.price_total ? ` · $${hotel.price_total} total` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hotel.booking_url && (
            <a
              href={hotel.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {onRemove && (
            <Button size="icon-xs" variant="ghost" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
          {!hotel.is_selected && onSelect && (
            <Button size="sm" variant="outline" onClick={onSelect}>
              Select
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

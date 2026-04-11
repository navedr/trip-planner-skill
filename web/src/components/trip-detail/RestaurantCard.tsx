import { UtensilsCrossed, Star, ExternalLink, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Restaurant } from "@/lib/types";

interface RestaurantCardProps {
  restaurant: Restaurant;
  accentColor: string;
  onRemove?: () => void;
}

export function RestaurantCard({ restaurant, accentColor, onRemove }: RestaurantCardProps) {
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
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{restaurant.cuisine}</span>
            {restaurant.price_level && (
              <>
                <span className="text-border">·</span>
                <span style={{ color: accentColor }}>{restaurant.price_level}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {onRemove && (
            <Button size="icon-xs" variant="ghost" onClick={onRemove}>
              <X className="h-3 w-3" />
            </Button>
          )}
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentColor + "18" }}
          >
            <UtensilsCrossed className="h-4 w-4" style={{ color: accentColor }} />
          </span>
        </div>
      </div>

      {/* Rating */}
      <div className="mt-3 flex items-center gap-2">
        {restaurant.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="text-sm font-medium">{restaurant.rating}</span>
          </div>
        )}
        {restaurant.review_count && (
          <span className="text-[10px] text-muted-foreground">
            {restaurant.review_count.toLocaleString()} reviews
          </span>
        )}
        {restaurant.best_for && (
          <Badge variant="outline" className="text-[10px] font-normal">
            {restaurant.best_for}
          </Badge>
        )}
      </div>

      {/* Highlights */}
      {restaurant.highlights && (
        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
          {restaurant.highlights}
        </p>
      )}

      {/* Location */}
      {(restaurant.neighborhood ?? restaurant.address) && (
        <div className="mt-2.5 flex items-center gap-1 text-[10px] text-muted-foreground/70">
          <MapPin className="h-2.5 w-2.5" />
          <span>{restaurant.neighborhood ?? restaurant.address}</span>
        </div>
      )}
    </div>
  );
}

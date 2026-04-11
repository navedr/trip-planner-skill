import { MapPin, Star, Clock, ExternalLink, Baby, Ticket, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Attraction } from "@/lib/types";

interface AttractionCardProps {
  attraction: Attraction;
  accentColor: string;
  onRemove?: () => void;
}

export function AttractionCard({ attraction, accentColor, onRemove }: AttractionCardProps) {
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
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[10px] capitalize"
              style={{ borderColor: accentColor + "40", color: accentColor }}
            >
              {attraction.type}
            </Badge>
            {attraction.family_friendly && (
              <Badge variant="outline" className="text-[10px] border-sage/30 text-sage">
                <Baby className="mr-0.5 h-2.5 w-2.5" />
                Family
              </Badge>
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
            <MapPin className="h-4 w-4" style={{ color: accentColor }} />
          </span>
        </div>
      </div>

      {/* Rating & meta */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        {attraction.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-gold text-gold" />
            <span className="font-medium">{attraction.rating}</span>
            {attraction.review_count && (
              <span className="text-[10px] text-muted-foreground">
                ({attraction.review_count.toLocaleString()})
              </span>
            )}
          </div>
        )}
        {attraction.duration && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {attraction.duration}
          </div>
        )}
        {attraction.price && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Ticket className="h-3 w-3" />
            {attraction.price}
          </div>
        )}
      </div>

      {/* Highlights */}
      {attraction.highlights && (
        <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
          {attraction.highlights}
        </p>
      )}

      {/* Hours */}
      {attraction.hours && (
        <p className="mt-2 text-[10px] text-muted-foreground/70">
          Hours: {attraction.hours}
        </p>
      )}
    </div>
  );
}

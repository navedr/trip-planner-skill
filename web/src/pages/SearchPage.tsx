import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Compass,
  Plane,
  Building2,
  UtensilsCrossed,
  MapPin,
} from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useSaveToTrip } from "@/hooks/useSaveToTrip";
import { SearchResultCard } from "@/components/search/SearchResultCard";
import { SaveToTripDialog } from "@/components/search/SaveToTripDialog";
import { stagger, fadeUp } from "@/lib/motion";
import type {
  FlightOption,
  HotelOption,
  Restaurant,
  Attraction,
  TripItemCategory,
} from "@/lib/types";

const ACCENT = "#c2703e";

const quickFilters = [
  {
    label: "Flights",
    icon: Plane,
    template: "Find flights from SEA to ",
  },
  {
    label: "Hotels",
    icon: Building2,
    template: "Search hotels in ",
  },
  {
    label: "Restaurants",
    icon: UtensilsCrossed,
    template: "Find restaurants in ",
  },
  {
    label: "Attractions",
    icon: MapPin,
    template: "Find things to do in ",
  },
] as const;

export function SearchPage() {
  const { messages, prefillInput, openPanel } = useChat();
  const saveToTrip = useSaveToTrip();

  const recentResults = useMemo(() => extractResults(messages), [messages]);

  const handleQuickFilter = (template: string) => {
    prefillInput(template);
    openPanel();
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
      >
        {/* Hero */}
        <div className="relative mb-10 overflow-hidden rounded-2xl border border-border/30 bg-card/50 p-8 lg:p-12">
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse at 30% 40%, hsla(24, 52%, 50%, 0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, hsla(40, 56%, 55%, 0.08) 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
              <Compass className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-display mb-2 text-3xl font-medium tracking-tight lg:text-4xl">
              Discover your next adventure
            </h1>
            <p className="max-w-lg text-sm text-muted-foreground leading-relaxed">
              Search for flights, hotels, restaurants, and attractions. Use the
              chat panel to describe what you're looking for — or pick a quick
              filter below.
            </p>

            {/* Quick-filter buttons */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="mt-6 flex flex-wrap gap-2"
            >
              {quickFilters.map(({ label, icon: Icon, template }) => (
                <motion.button
                  key={label}
                  variants={fadeUp}
                  onClick={() => handleQuickFilter(template)}
                  className="group flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-4 py-2.5 text-sm font-medium transition-all hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </span>
                  {label}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Results area */}
        {recentResults.length > 0 ? (
          <div>
            <h2 className="font-display mb-4 text-lg font-medium">
              Recent results
            </h2>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid gap-3 sm:grid-cols-2"
            >
              {recentResults.map((item, i) => (
                <motion.div key={i} variants={fadeUp}>
                  <SearchResultCard
                    item={item}
                    accentColor={ACCENT}
                    onSave={saveToTrip.openDialog}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          <EmptyResults />
        )}
      </motion.div>

      <SaveToTripDialog
        open={saveToTrip.isOpen}
        itemLabel={saveToTrip.pendingItem?.label ?? null}
        isSaving={saveToTrip.isSaving}
        onSelect={saveToTrip.confirmSave}
        onClose={saveToTrip.closeDialog}
      />
    </div>
  );
}

function EmptyResults() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/40 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/50">
        <Compass className="h-5 w-5 text-muted-foreground" />
      </div>
      <h3 className="font-display mb-1 text-base font-medium">
        No results yet
      </h3>
      <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
        Use the chat panel or quick filters above to search for flights, hotels,
        restaurants, and attractions.
      </p>
    </div>
  );
}

/**
 * Extract typed search results from assistant chat messages.
 *
 * The backend sends structured data via items_updated SSE events which
 * update TanStack Query caches. For the search page, we also parse
 * assistant messages that include JSON code blocks with a category hint:
 *
 * ```search-results:flight
 * [{ ... }, { ... }]
 * ```
 */
type SearchItem =
  | { category: "flight"; data: FlightOption }
  | { category: "hotel"; data: HotelOption }
  | { category: "restaurant"; data: Restaurant }
  | { category: "attraction"; data: Attraction };

const CODE_BLOCK_RE =
  /```search-results:(flight|hotel|restaurant|attraction)\s*\n([\s\S]*?)```/g;

function extractResults(
  messages: Array<{ role: string; content: string }>,
): SearchItem[] {
  const results: SearchItem[] = [];

  for (const msg of messages) {
    if (msg.role !== "assistant") continue;
    let match: RegExpExecArray | null;
    CODE_BLOCK_RE.lastIndex = 0;
    while ((match = CODE_BLOCK_RE.exec(msg.content)) !== null) {
      const category = match[1] as TripItemCategory;
      try {
        const items = JSON.parse(match[2]!) as Record<string, unknown>[];
        for (const item of items) {
          results.push({ category, data: item } as unknown as SearchItem);
        }
      } catch {
        // skip malformed blocks
      }
    }
  }
  return results;
}

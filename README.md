# Trip Planner Skills for Claude Code

A set of [Claude Code](https://claude.ai/code) skills that plan trips end-to-end — finding flights, hotels, attractions, and restaurants by automating real travel websites with Selenium Grid and Playwright. No application code, no APIs, no affiliate links. Just browser automation that researches like a human would, writing structured results into a single JSON file and generating a polished HTML travel plan.

## How It Works

```
"Plan a trip to Tokyo in June"
        │
        ▼
  ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Flights    │ ──▶ │    Hotels    │ ──▶ │  Attractions │ ──▶ │  Restaurants │
  │   (Kayak)   │     │(Kayak/Airbnb)│     │  (Google →   │     │   (Yelp)     │
  │              │     │              │     │  TripAdvisor)│     │              │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                    │                    │
         ▼                    ▼                    ▼                    ▼
  ┌──────────────────────────────────────────────────────────────────────────────┐
  │                          trip-data.json                                      │
  │  Single source of truth — travelers, dates, preferences, all research       │
  └──────────────────────────────────┬───────────────────────────────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  trip-plan.html  │
                            │  Visual plan     │
                            │  (self-contained)│
                            └─────────────────┘
```

Each skill reads context from `trip-data.json` (so you don't repeat yourself) and writes its findings back. The research order matters — flight times inform hotel check-in, hotel location narrows restaurant search, and so on.

## Project Structure

```
travel-planner/
├── CLAUDE.md                           # Project instructions for Claude Code
├── requirements.txt                    # Python deps (selenium, webdriver-manager)
├── .gitignore                          # Ignores plans/ (personal travel data)
├── .claude/
│   ├── settings.local.json             # Permission whitelist
│   └── skills/
│       ├── plan-trip/                  # Orchestrator — gathers info, coordinates skills
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── trip-data-schema.json
│       │   └── templates/
│       │       └── trip-plan.md        # HTML design spec
│       ├── flights/                    # Searches Kayak for flights
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── sites.md            # Kayak URL patterns & selectors
│       │   └── scripts/
│       │       └── search_kayak.py
│       ├── hotels/                     # Searches Kayak Hotels & Airbnb
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── sites.md
│       │   └── scripts/
│       │       ├── search_kayak_hotels.py
│       │       └── search_airbnb.py
│       ├── attractions/                # Finds things to do via Google → TripAdvisor
│       │   ├── SKILL.md
│       │   ├── references/
│       │   │   └── sites.md
│       │   └── scripts/
│       │       └── search_tripadvisor.py
│       └── restaurants/                # Searches Yelp + Google → TripAdvisor
│           ├── SKILL.md
│           ├── references/
│           │   └── sites.md
│           └── scripts/
│               ├── search_yelp.py
│               └── search_tripadvisor.py
└── plans/                              # Trip folders (gitignored)
    └── tokyo-june-2026/
        ├── trip-data.json              # All structured trip data
        └── trip-plan.html              # Generated visual plan
```

## Skills

### plan-trip (orchestrator)

The entry point. Gathers traveler details (names, ages, dates, preferences, budget), creates the plan folder, and coordinates the other skills in order.

**Trigger:** "plan a trip to...", "start a new travel plan", "organize a vacation to..."

**What it does:**
1. Asks for travelers, destination, dates, origin, and preferences
2. Creates `plans/{destination}-{month}-{year}/trip-data.json` from the schema
3. Runs research in order: flights → hotels → attractions → restaurants
4. When you select/book something, promotes it to the `selected` field and clears the options array (saves tokens)
5. Generates `trip-plan.html` — a self-contained visual plan with hero section, flight cards, hotel recommendations, day-by-day itinerary, food guide, and tips

### flights

Searches [Kayak](https://www.kayak.com) for flights using direct URL construction (no form filling needed).

**Trigger:** "find flights to...", "search for airfare", "compare flight prices"

**Extracts:** Airline, times, duration, stops, price per person, booking URL  
**Presents:** Outbound and return in separate tables with best combo recommendations  
**Writes to:** `trip-data.json` → `flights.outbound`, `flights.return`, `flights.search_url`

**URL pattern:**
```
https://www.kayak.com/flights/SEA-NRT/2026-06-15/2026-06-25/2adults/children-2-9?sort=bestflight_a&fs=stops%3D0
```

### hotels

Searches [Kayak Hotels](https://www.kayak.com/hotels) and [Airbnb](https://www.airbnb.com), with review data pulled from TripAdvisor via Google search proxy.

**Trigger:** "find hotels in...", "search for places to stay", "look for Airbnbs"

**Extracts:** Star rating, guest rating, price/night, amenities, room type, review summaries  
**Presents:** Combined hotel + Airbnb comparison table with direct booking links  
**Writes to:** `trip-data.json` → `hotels.search_urls`, `hotels.options`, `hotels.selected`

### attractions

Finds things to do by searching Google for TripAdvisor results (TripAdvisor blocks direct scraping on both Selenium and Playwright).

**Trigger:** "what to do in...", "find attractions", "things to see in..."

**Extracts:** Name, type, rating, review count, price, duration, family/stroller-friendly status  
**Presents:** Tables grouped by category (Landmarks, Museums, Outdoor, Family-Friendly) with drive times from hotel  
**Writes to:** `trip-data.json` → `attractions`

### restaurants

Searches [Yelp](https://www.yelp.com) (primary) with supplementary data from Google Maps and TripAdvisor (via Google proxy).

**Trigger:** "find restaurants in...", "where to eat", "food recommendations for..."

**Extracts:** Cuisine, price level, rating, reviews, neighborhood, standout dishes  
**Presents:** Tables grouped by category (Fine Dining, Local Favorites, Casual) with highlights  
**Writes to:** `trip-data.json` → `restaurants`

## Data Model

All trip data lives in a single `trip-data.json` per trip. The [JSON schema](/.claude/skills/plan-trip/references/trip-data-schema.json) defines the full structure:

```jsonc
{
  "destination": "Salt Lake City, UT",
  "origin": "SEA",
  "dates": { "depart": "2026-05-26", "return": "2026-06-02", "duration_days": 8 },
  "travelers": { "adults": 2, "children": [2, 9], "names": ["Nav", "Sana", "Ayan", "Zara"] },
  "preferences": {
    "flights": { "class": "economy", "nonstop": true },
    "hotels": { "budget_per_night": 150, "amenities": ["pool", "breakfast"] },
    "food": { "cuisines": ["Indian", "Thai", "Mexican"], "budget_level": "$$" },
    "excursions": { "interests": ["nature", "family", "museums"], "pace": "moderate" }
  },
  "flights": {
    "search_url": "https://www.kayak.com/flights/...",
    "outbound": [ /* FlightOption[] */ ],
    "return": [ /* FlightOption[] */ ],
    "selected": { "outbound": { /* ... */ }, "return": { /* ... */ }, "total_price": 1336 }
  },
  "hotels": {
    "search_urls": { "kayak": "...", "airbnb": "..." },
    "options": [ /* HotelOption[] */ ],
    "selected": null
  },
  "restaurants": [ /* Restaurant[] */ ],
  "attractions": [ /* Attraction[] */ ],
  "itinerary": {
    "day1": { "date": "2026-05-26", "theme": "Arrival Day", "activities": [ /* ... */ ] },
    "day2": { "date": "2026-05-27", "theme": "Zoo & Natural History", "activities": [ /* ... */ ] }
    // ...
  },
  "notes": ["Zara needs stroller access", "Ayan wants to see dinosaur exhibits"]
}
```

**Key types:** `FlightOption`, `HotelOption`, `Restaurant`, `Attraction`, `ItineraryDay` — all defined in `$defs` of the schema.

The schema is extensible — car rentals, event tickets, spa packages, etc. can be added as new top-level properties.

## Browser Automation

### Selenium Grid (default)

A Selenium Grid instance provides Chrome 144.0 on Linux. This is the primary method — Kayak, Yelp, and most travel sites work reliably. Each skill has Python scripts in its `scripts/` folder that connect to the grid:

```python
from selenium import webdriver

options = webdriver.ChromeOptions()
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_experimental_option("excludeSwitches", ["enable-automation"])

driver = webdriver.Remote(command_executor="http://192.168.68.168:4444", options=options)
driver.get("https://www.kayak.com/flights/SEA-NRT/2026-06-15/2026-06-25/2adults")
# ... extract results ...
driver.quit()
```

### Playwright MCP (fallback)

Used only when Selenium Grid is unavailable. Claude Code's built-in Playwright MCP tools (`browser_navigate`, `browser_snapshot`, `browser_click`, etc.) provide the automation. `browser_snapshot` is preferred over screenshots for data extraction — it returns structured accessible content.

### The TripAdvisor Problem

TripAdvisor blocks both Selenium and Playwright. The workaround is using Google as a proxy:

```
https://www.google.com/search?q=site:tripadvisor.com+"things to do"+"Tokyo"
```

Google returns TripAdvisor listings with ratings, review counts, and snippets — enough for research without hitting TripAdvisor directly.

## Generating the HTML Plan

After all research is complete, `trip-plan.html` is generated from `trip-data.json`. The output is a single self-contained HTML file (no external assets except Google Fonts) with:

- **Hero section** — destination, dates, tagline, stat cards (flight duration, weather, travelers, cost)
- **Flights** — outbound/return cards with times, airlines, prices, and booking links
- **Where to Stay** — hotel/Airbnb recommendation cards with TOP PICK badges
- **Weather bar** — day-by-day forecast grid colored by temperature
- **Day-by-day itinerary** — themed day cards with activities, times, and tags (stroller-ok, 30-min-drive, flight-day)
- **Food guide** — restaurant cards grouped by cuisine
- **Tips & packing** — practical cards for weather, kids, getting around

**Design system:** Fraunces (serif headings) + Outfit (sans body), destination-adapted color palette, responsive cards, scroll-reveal animations.

## Usage

### Prerequisites

- [Claude Code](https://claude.ai/code) CLI or desktop app
- Python 3.10+ with `selenium` and `webdriver-manager`:
  ```bash
  pip install -r requirements.txt
  ```
- A running Selenium Grid instance (or rely on Playwright MCP fallback)

### Starting a New Trip

Open Claude Code in this project directory and say:

```
plan a trip to Tokyo in June
```

The `plan-trip` skill activates, asks for details, and starts the research pipeline.

### Running Individual Skills

You can also invoke skills directly:

```
find flights from SEA to NRT for 2 adults and 2 kids (ages 2 and 9), June 15-25
find hotels in Shinjuku, Tokyo for 10 nights
find attractions in Tokyo for families with young kids
find restaurants in Tokyo — sushi, ramen, izakaya
```

Each skill reads from `trip-data.json` if a plan exists, or asks for details if run standalone.

### Resuming an Existing Plan

```
resume the Tokyo June trip
```

Claude reads `trip-data.json`, checks which sections are populated vs. empty, and picks up where you left off.

## Reference Files

Each skill stores site-specific URL patterns, CSS selectors, and navigation flows in its `references/` folder. When a site changes its layout, update the reference file — skill logic stays the same.

| Skill | Reference | What's inside |
|-------|-----------|---------------|
| plan-trip | `trip-data-schema.json` | JSON schema — the contract for trip-data.json |
| plan-trip | `trip-plan.md` | HTML template spec — sections, design system, layout |
| flights | `sites.md` | Kayak URL patterns, query params, CAPTCHA handling |
| hotels | `sites.md` | Kayak Hotels + Airbnb URL construction, TripAdvisor proxy |
| attractions | `sites.md` | Google → TripAdvisor proxy patterns, seasonal tips |
| restaurants | `sites.md` | Yelp URL patterns, sort/filter options, family-friendly attrs |

## Design Decisions

**Why JSON instead of markdown for trip data?** Token efficiency. Skills read/write specific fields (`flights.selected.outbound.price_per_person`) without parsing tables. When a flight is booked, clear the options array — the file stays small across a multi-day planning session.

**Why Selenium Grid over Playwright?** Travel sites (Kayak especially) detect Playwright as a bot and block it. Selenium Grid with Chrome on a separate machine passes bot detection reliably. Playwright MCP is kept as a fallback for when the grid is down.

**Why Google as a TripAdvisor proxy?** TripAdvisor blocks automated browsers aggressively — both Selenium and Playwright. Google indexes TripAdvisor listings with ratings and snippets, giving us the data we need without triggering blocks.

**Why `plans/` is gitignored?** Trip plans contain personal data — traveler names, travel dates, home airport. The skills and infrastructure are version-controlled; the plans are local-only.

**Why research in a specific order?** Flight arrival time determines hotel check-in. Hotel neighborhood determines where to search for restaurants. Attraction locations inform the day-by-day itinerary. Each step feeds the next.

## Extending

To add a new research type (e.g., car rentals):

1. Add a new top-level property and `$defs` type in `trip-data-schema.json`
2. Create a new skill folder under `.claude/skills/` with `SKILL.md`, `references/`, and `scripts/`
3. The skill reads from `trip-data.json` for context and writes its findings to the new section
4. Update `plan-trip/SKILL.md` to include the new skill in the research pipeline
5. Update `plan-trip/templates/trip-plan.md` to render the new section in the HTML output

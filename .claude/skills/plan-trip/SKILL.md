---
name: plan-trip
description: Create and manage a full travel plan. Use when the user wants to plan a trip, start a new travel plan, organize a vacation, or work on an existing travel plan. This is the primary entry point for travel planning — it orchestrates the other skills (flights, hotels, restaurants, attractions).
metadata:
  author: narangwa
  version: "0.2.0"
---

# Plan Trip

Orchestrate a full travel plan — gather traveler details, create a plan folder, then use the individual skills (flights, hotels, restaurants, attractions) to fill it in. All data is stored in `trip-data.json`; the final output is `trip-plan.html`.

## When to Use

Activate when the user:
- Wants to plan a new trip or vacation
- Says they're going somewhere and need help organizing it
- Wants to resume or update an existing travel plan
- Asks to "plan", "organize", or "put together" a trip

## Workflow

### 1. Gather Trip Details

Ask the user for the following. Collect everything before creating the plan — don't start searching until the plan is set up.

**Required:**
- **Travelers** — who is going? Names, number of adults/children, ages of children if any
- **Destination** — where are they going? Can be multiple cities/stops
- **Dates** — departure date, return date, and dates for each stop if multi-city
- **Origin** — where are they flying from?

**Preferences (ask which apply):**
- **Flights** — class preference, airline preferences, nonstop preference, time-of-day preference
- **Hotels** — budget per night, star rating, must-have amenities (pool, parking, breakfast, etc.), preferred neighborhood or proximity
- **Food** — cuisine preferences, dietary restrictions, budget level ($–$$$$), interest in local food / fine dining / casual
- **Excursions** — types of activities (museums, outdoors, nightlife, family, adventure, relaxation), pace preference (packed days vs. leisurely)
- **Budget** — overall trip budget if they have one

### 2. Create the Plan Folder

Create a folder under `plans/` with a descriptive, slugified name:

```
plans/{destination}-{month}-{year}/
```

Examples:
- `plans/tokyo-june-2026/`
- `plans/italy-rome-florence-sept-2026/`
- `plans/hawaii-maui-dec-2026/`

For multi-destination trips, include the main stops in the folder name.

Inside the folder, create `trip-data.json` following the schema defined in `references/trip-data-schema.json`. **Always read the schema before creating or modifying `trip-data.json`** to ensure the structure is correct. Here's an example:

```json
{
  "destination": "Salt Lake City",
  "origin": "SEA",
  "dates": {
    "depart": "2026-05-26",
    "return": "2026-06-02",
    "duration_days": 8
  },
  "travelers": {
    "adults": 2,
    "children": [2, 9],
    "names": ["optional"]
  },
  "preferences": {
    "flights": {
      "class": "economy",
      "nonstop": true,
      "time_preference": "no early morning",
      "airline_preference": null
    },
    "hotels": {
      "budget_per_night": null,
      "star_rating": null,
      "amenities": ["pool", "breakfast", "parking"],
      "type": "suite",
      "neighborhood": null
    },
    "food": {
      "cuisines": [],
      "dietary": [],
      "budget_level": "$$",
      "interests": ["local food", "family-friendly"]
    },
    "excursions": {
      "interests": ["museums", "outdoors", "family"],
      "pace": "moderate"
    },
    "budget_total": null
  },
  "flights": {
    "search_url": null,
    "outbound": [],
    "return": [],
    "selected": null
  },
  "hotels": {
    "search_urls": {},
    "options": [],
    "selected": null
  },
  "restaurants": [],
  "attractions": [],
  "itinerary": {},
  "notes": []
}
```

**The full JSON schema is at `references/trip-data-schema.json`.** Always read it before creating or updating `trip-data.json`. The schema defines the exact structure for flights, hotels, restaurants, attractions, and itinerary objects.

**Schema evolution:** If the user asks to find something new that doesn't fit the current schema (e.g., car rentals, spa recommendations, event tickets), update the schema first:
1. Read `references/trip-data-schema.json`
2. Add a new top-level property and its `$defs` type definition following the existing patterns
3. Write the updated schema
4. Then add the new section to `trip-data.json`

This keeps the schema as the single source of truth and ensures all new data follows a consistent structure.

### 3. Research and Fill the Plan

Use the individual skills to populate the plan, **passing the dates and preferences from `trip-data.json`**:

**Order of operations:**
1. **Flights first** — search using origin, destination, dates, and flight preferences. Write options into `flights.outbound` and `flights.return`. Set `flights.selected` when the user picks.
2. **Hotels next** — search using destination, check-in/check-out dates (from selected flights), guest count, and hotel preferences. Write options into `hotels.options`. Set `hotels.selected` when picked.
3. **Attractions** — search using destination, dates, and excursion preferences. Append to `attractions` array.
4. **Restaurants** — search using destination, food preferences, and dietary restrictions. Find options near the selected hotel or planned attractions. Append to `restaurants` array.
5. **Day-by-day itinerary** — organize attractions, restaurants, and activities into `itinerary`, respecting the user's pace preference.

After each research step, update `trip-data.json` with the findings. Only update the relevant section — don't rewrite the entire file.

**When something is finalized** (user books a flight, selects a hotel, confirms an itinerary day):
1. `trip-data.json` — promote the chosen item to the `selected` field, then **clear the options arrays** to save tokens. For example, when a flight is booked:
   - Set `flights.selected` with the booked flight details and `"status": "booked"`
   - Clear `flights.outbound` and `flights.return` to empty arrays `[]`
   - Similarly for hotels: set `hotels.selected`, clear `hotels.options` to `[]`
2. `trip-plan.html` — regenerate or update the relevant HTML section to reflect the finalized choice

This keeps `trip-data.json` compact — finalized sections carry only the chosen option, not the full research list.

### 4. Generate the Trip Plan HTML

Generate or update the HTML trip plan page using the `frontend-design` skill whenever:
- **All research is complete** — generate the full page from `trip-data.json`
- **A major item is finalized** (flight booked, hotel selected, itinerary confirmed) — update the relevant section in the existing HTML
- **The user asks to see/update the plan** — regenerate from current `trip-data.json`

**Read all data from `trip-data.json`** to populate the HTML.

**Before generating**, read the template reference at `templates/trip-plan.md` and the example file at `~/slc-trip-plan.html` to match the design conventions exactly.

**The HTML page must include these sections in order:**
1. **Hero** — destination name, date range, tagline, stat cards (flight duration, weather, travelers, est. cost)
2. **Flights** — dark-themed section with outbound/return flight cards, prices, and booking links (Kayak URL + airline direct links)
3. **Where to Stay** — neighborhood or hotel recommendation cards with "TOP PICK" badges, booking links with dates pre-filled
4. **Weather** — day-by-day weather bar with highs/lows
5. **Day-by-Day Itinerary** — daily cards with themed titles, activity lists with colored dots and tags
6. **Food Guide** — restaurant cards grouped by cuisine/category
7. **Tips & Packing** — grid of practical tip cards by category

**Design requirements:**
- Single self-contained HTML file, no external assets except Google Fonts CDN
- Adapt the color palette to the destination (tropical = teals + coral, European = muted blues, mountain = earth tones, etc.)
- Scroll-reveal animations on sections, hover effects on cards
- Responsive layout
- Kayak booking links constructed from `trip-data.json` flight/hotel parameters
- Airbnb/hotel links with dates and guest count pre-filled in the URL where possible

**Output:**
```
plans/{destination}-{month}-{year}/trip-plan.html
```

Open in browser after generation:
```bash
open plans/{destination}-{month}-{year}/trip-plan.html
```

### 5. Resuming an Existing Plan

If the user wants to work on an existing plan:
1. List folders in `plans/` to show available plans
2. Read `trip-data.json` from the selected plan to reload context
3. Check which sections are populated vs empty to understand what's done
4. Ask what they want to add or change
5. Use the relevant skills to research and update

### 6. Plan Updates

When the user wants to modify a plan:
- Read `trip-data.json` to understand what's already decided
- Only research what changed (e.g., if dates shift, re-search flights and hotels but keep restaurant preferences)
- Update only the affected sections in `trip-data.json`
- Regenerate `trip-plan.html` if the changes affect the visual plan

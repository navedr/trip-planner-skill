# Trip Plan HTML Template Reference

This documents the structure and design conventions for generating the final trip plan HTML page. The page is a single self-contained `.html` file generated using the `frontend-design` skill.

Use `~/slc-trip-plan.html` as the canonical design reference. Read it before generating any plan HTML.

## Design System

### Fonts
- **Fraunces** (serif) — headings, hero text, stat values, day numbers, prices
- **Outfit** (sans-serif) — body text, labels, details

### Color Palette (CSS custom properties)
Pick a destination-appropriate palette. The SLC example uses earthy/mountain tones:
```css
:root {
  --terracotta: #C2654A;      /* Primary accent — section labels, links, dots */
  --sage: #7A9E7E;            /* Secondary — nature/activity tags */
  --cream: #F5F0E8;           /* Page background */
  --sand: #E8DFD0;            /* Card borders, dividers */
  --slate: #2C3539;           /* Text, dark sections (flights) */
  --warm-white: #FDFBF7;      /* Card backgrounds */
  --gold: #C9A84C;            /* Flight prices, highlights */
  --sky: #6BA3C7;             /* Drive tags, weather lows */
  --rose: #D4A0A0;            /* Optional accent */
}
```
Adapt colors to the destination: tropical = teals + coral, European = muted blues + cream, mountain = earth tones, beach = sand + ocean.

## Page Sections (in order)

### 1. Hero
Full-viewport intro with:
- **Badge** — trip type ("Family Adventure 2026", "Romantic Getaway", etc.)
- **Destination name** — large Fraunces heading, italic on the secondary word
- **Date range and tagline** — one-line subtitle
- **Stat cards** — 4 key stats: flight duration, weather, travelers, estimated cost
- **Scroll hint** — down arrow at bottom

Background: radial gradients using palette colors on the cream base + subtle grid lines.

### 2. Flights Section
Dark-themed card (slate gradient) with:
- **Section label** — "Flights" in gold
- **Route heading** — "Seattle → Salt Lake City"
- **Description** — airline summary
- **Flight cards** (grid) — one for outbound, one for return. Each card shows:
  - Route (airport codes with arrow connector)
  - Details: date, duration, airlines, tip
  - Price (large Fraunces gold text)
- **Booking links** — Kayak, Google Flights, direct airline links

### 3. Where to Stay
Neighborhood/hotel recommendation cards:
- **Card grid** — each card: name, vibe tagline (italic), details (safety, food, kids, drives, airbnb/hotel), booking link
- **"TOP PICK" badge** on recommended options via `.recommended` class
- Include Airbnb/hotel search links with dates and guest count pre-filled in the URL

### 4. Weather Bar
8-column grid (one per trip day):
- Day name, date, weather emoji icon, high/low temps
- Color-coded: highs in terracotta, lows in sky blue

### 5. Day-by-Day Itinerary
This is the core of the plan. Each day is a `.day-card`:
- **Day number** — large circled number
- **Title** — theme for the day ("Zoo & Natural History")
- **Date tag** — colored badge
- **Subtitle** — one-line description
- **Activities list** — each activity has:
  - Colored dot (terracotta, sage, sky, gold for variety)
  - Activity name and detail text
  - Optional tag: "Stroller OK", "30 min drive", "All Day", "Flight"

**Flight days** get special dark styling (`.flight-day` class) with gold accents.

### 6. Food Guide
Restaurant recommendation cards in a grid:
- **Name** — Fraunces heading
- **Cuisine label** — uppercase, terracotta colored
- **Description** — what to order, kid-friendliness, vibe
- **Area tag** — neighborhood + distance from hotel

Group into sub-sections if there are many (e.g., "Ethnic Eats", "Yelp Favorites by cuisine").

### 7. Tips & Packing
Grid of tip cards by category:
- For kids (age-specific)
- Weather & packing
- Getting around
- Any destination-specific tips
Each card: emoji + heading, bulleted list items.

### 8. Footer
- Trip summary line (family name, dates, destination)
- Link to live flight prices on Kayak

## Interaction & Animation

- **Scroll reveal** — elements with `.reveal` class fade up as they enter viewport via IntersectionObserver
- **Hero animation** — staggered `fadeDown` keyframes on badge, title, subtitle, stats
- **Hover effects** — subtle lift (`translateY(-2px to -4px)`) and shadow on cards
- **Scroll hint** — bouncing arrow at hero bottom

## Responsive

- Day cards switch from 2-column (number + content) to single column on mobile
- Weather bar goes from 8 columns to 4 on small screens
- Flight cards, hood cards, food cards all use `auto-fit` with `minmax` for natural reflow
- Activity tags reposition below activity text on mobile

## Output

Write the HTML file into the plan folder:
```
plans/{destination}-{month}-{year}/trip-plan.html
```

Open it in the browser after generation:
```bash
open plans/{destination}-{month}-{year}/trip-plan.html
```

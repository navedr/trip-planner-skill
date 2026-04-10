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

## Navigation

Every trip plan HTML **must include a sticky navigation bar** for jumping between sections. The nav appears after scrolling past the hero.

### Implementation

- Fixed/sticky `<nav>` bar at the top of the viewport, hidden until the user scrolls past the hero
- Uses `IntersectionObserver` on the hero to toggle a `scrolled` class on the nav
- Each section gets an `id` attribute: `flights`, `stay`, `weather`, `itinerary`, `food`, `tips`
- Nav links use `scroll-behavior: smooth` anchor links (`#flights`, `#stay`, etc.)
- Active section is highlighted as the user scrolls (use `IntersectionObserver` on each section)

### Styling

```css
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--warm-white);
  border-bottom: 1px solid var(--sand);
  padding: 0.6rem 1.5rem;
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  transform: translateY(-100%);
  transition: transform 0.3s ease;
}

.nav-bar.visible {
  transform: translateY(0);
}

.nav-bar a {
  font-size: 0.8rem;
  font-weight: 500;
  text-decoration: none;
  color: var(--slate-light);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 0.3rem 0;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}

.nav-bar a.active,
.nav-bar a:hover {
  color: var(--terracotta);
  border-bottom-color: var(--terracotta);
}
```

### HTML structure

```html
<nav class="nav-bar" id="nav">
  <a href="#flights">Flights</a>
  <a href="#stay">Stay</a>
  <a href="#weather">Weather</a>
  <a href="#itinerary">Itinerary</a>
  <a href="#food">Food</a>
  <a href="#tips">Tips</a>
</nav>
```

### JavaScript

```javascript
// Show/hide nav based on hero visibility
const hero = document.querySelector('.hero');
const nav = document.getElementById('nav');
const heroObserver = new IntersectionObserver(([entry]) => {
  nav.classList.toggle('visible', !entry.isIntersecting);
}, { threshold: 0.1 });
heroObserver.observe(hero);

// Highlight active section
const sections = document.querySelectorAll('section[id], div[id]');
const navLinks = document.querySelectorAll('.nav-bar a');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-bar a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
sections.forEach(s => sectionObserver.observe(s));
```

### Mobile

On screens < 700px, the nav bar scrolls horizontally:
```css
@media (max-width: 700px) {
  .nav-bar {
    overflow-x: auto;
    justify-content: flex-start;
    gap: 1rem;
    padding: 0.5rem 1rem;
    -webkit-overflow-scrolling: touch;
  }
  .nav-bar a { white-space: nowrap; }
}
```

## Page Sections (in order)

Each section must have an `id` matching the nav links above.

### 1. Hero
Full-viewport intro with:
- **Badge** — trip type ("Family Adventure 2026", "Romantic Getaway", etc.)
- **Destination name** — large Fraunces heading, italic on the secondary word
- **Date range and tagline** — one-line subtitle
- **Stat cards** — 4 key stats: flight duration, weather, travelers, estimated cost
- **Table of Contents** — a row of styled anchor links below the stats, acting as a visual TOC and quick-jump navigation. Each links to the corresponding section `id`.

```html
<div class="hero-toc">
  <a href="#flights">&#9992; Flights</a>
  <a href="#stay">&#127968; Stay</a>
  <a href="#weather">&#9728; Weather</a>
  <a href="#itinerary">&#128197; Itinerary</a>
  <a href="#food">&#127860; Food</a>
  <a href="#tips">&#127890; Tips</a>
</div>
```

```css
.hero-toc {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 2rem;
  animation: fadeDown 0.8s ease-out 0.5s both;
}

.hero-toc a {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--warm-white);
  border: 1px solid var(--sand);
  border-radius: 10px;
  padding: 0.6rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--slate);
  text-decoration: none;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.hero-toc a:hover {
  transform: translateY(-2px);
  border-color: var(--terracotta-light);
  box-shadow: 0 4px 12px rgba(44,53,57,0.08);
}
```

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

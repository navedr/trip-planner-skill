---
name: find-flights
description: Find flights between destinations. Use when the user asks about flights, airfare, flying somewhere, booking flights, or comparing flight prices and airlines.
metadata:
  author: narangwa
  version: "0.1.0"
---

# Find Flights

Search for flights using browser automation on Kayak.

## When to Use

Activate when the user asks about:
- Flights between destinations
- Airfare or flight prices
- Airline comparisons
- Best time to fly somewhere
- Layover and routing options

## Plan Integration

When invoked as part of a travel plan (from `plan-trip` skill):
1. Read the active plan's `trip-data.json` to get `origin`, `destination`, `dates`, `travelers`, and `preferences.flights`
2. Do not re-ask for details already in the JSON
3. After finding results, write options into `flights.outbound` and `flights.return` arrays in `trip-data.json`. Set `flights.search_url` to the Kayak URL used

When invoked standalone (no active plan), proceed with the clarify step below.

## Workflow

### 1. Clarify the Search

Determine from the user's message or the active plan (ask only if unclear):
- **Origin** — departure city or airport code
- **Destination** — arrival city or airport code
- **Dates** — departure date, return date (or one-way)
- **Passengers** — number and type (adults, children)
- **Class** — economy, business, first
- **Preferences** — nonstop only, specific airline, time of day, bags included

### 2. Search for Flights

Search Kayak for flights. Build the URL directly from the search parameters — no form interaction needed.

**Primary method: Selenium Grid** — use the scripts in `scripts/` that connect to `http://192.168.68.168:4444/`. Kayak works reliably with Selenium Grid + Chrome. Fall back to Playwright MCP only if Selenium Grid is unavailable.

**URL pattern:**
```
https://www.kayak.com/flights/{origin}-{destination}/{departure}/{return}/{passengers}?sort=bestflight_a
```

**URL construction rules:**
- `{origin}` and `{destination}` — 3-letter airport codes (e.g., SEA, SLC, JFK)
- `{departure}` and `{return}` — dates as `YYYY-MM-DD`. Omit `/{return}` for one-way
- `{passengers}` — `{N}adults` for adults only. Append `/children-{age1}-{age2}` with dash-separated ages for children
- `sort=bestflight_a` — sort by best flight (default)
- `fs=stops%3D0` — add to filter nonstop only. `stops%3D1` for 1 stop max

**Examples:**
- Round-trip, 2 adults: `https://www.kayak.com/flights/SEA-SLC/2026-05-05/2026-05-12/2adults?sort=bestflight_a`
- 2 adults + kids ages 2,9: `https://www.kayak.com/flights/SEA-SLC/2026-05-05/2026-05-12/2adults/children-2-9?sort=bestflight_a`
- Nonstop only: append `&fs=stops%3D0`
- One-way: `https://www.kayak.com/flights/SEA-SLC/2026-05-05/1adults?sort=bestflight_a`

**Steps (Selenium Grid):**
1. Build the Kayak URL from the search parameters
2. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
3. Navigate to the constructed URL
4. Wait for results to load (Kayak has a loading animation while fetching prices)
5. Extract flight options — airline, times, duration, stops, price, booking source
6. For detailed itinerary, click into a specific flight for layover info, baggage, aircraft type
7. `driver.quit()` when done

**Fallback (Playwright MCP) — use only if Selenium Grid is down:**
1. `browser_navigate` to the constructed URL
2. `browser_wait_for` results to load
3. `browser_snapshot` to read flight results
4. `browser_click` for additional filters
5. `browser_close` when done

### 3. Present Results

**Always present results in markdown tables** for easy scanning.

**Outbound and return as separate tables:**
```markdown
### Outbound (Date)
| # | Depart | Arrive | Airline | Duration | Stops | $/person | Link |
|---|--------|--------|---------|----------|-------|----------|------|
| 1 | **9:25 AM** | 12:34 PM | Delta | 2h 09m | Nonstop | $167 | [Kayak](url) |

### Return (Date)
| # | Depart | Arrive | Airline | Duration | Stops | $/person | Link |
|---|--------|--------|---------|----------|-------|----------|------|
| A | **3:25 PM** | 4:42 PM | Delta | 2h 17m | Nonstop | $167 | [Kayak](url) |
```

**Then a best combos table:**
```markdown
### Best Combos
| Combo | Outbound | Return | Total (N pax) | Why |
|-------|----------|--------|---------------|-----|
| **Best overall** | 9:25 AM → 12:34 PM | 3:25 PM → 4:42 PM | $668 | Arrive by lunch, home for dinner |
```

Include links so the user can go directly to results:
- **Kayak search link** — the constructed Kayak URL used for the search
- **Direct airline links** — where possible, include the airline's own booking page

Sort by best overall (balancing price, duration, and stops) unless the user has a preference.

Flag notable options:
- **Cheapest** — lowest price option
- **Fastest** — shortest travel time
- **Best value** — good balance of price and convenience

### 4. Follow-up

Offer to:
- Check alternative dates for cheaper fares (price calendar)
- Compare specific flights in detail
- Search for hotels or car rentals at the destination
- Look at nearby airport alternatives

## Reference Sites

See `references/sites.md` for site-specific navigation patterns and selectors.

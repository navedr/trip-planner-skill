---
name: find-hotels
description: Find hotels and accommodation for a travel destination. Use when the user asks about hotels, places to stay, lodging, hostels, vacation rentals, or accommodation options.
metadata:
  author: narangwa
  version: "0.1.0"
---

# Find Hotels

Search for hotels and accommodation using browser automation.

## When to Use

Activate when the user asks about:
- Hotels or places to stay
- Accommodation options (hostels, B&Bs, vacation rentals)
- Lodging recommendations for a trip
- Hotel price comparisons
- Where to stay in a destination

## Plan Integration

When invoked as part of a travel plan (from `plan-trip` skill):
1. Read the active plan's `trip-data.json` to get `destination`, `dates`, `travelers`, and `preferences.hotels`
2. Use `flights.selected` arrival/departure times for check-in/check-out if available
3. Do not re-ask for details already in the JSON
4. After finding results, write options into `hotels.options` array in `trip-data.json`. Store search URLs in `hotels.search_urls`

When invoked standalone (no active plan), proceed with the clarify step below.

## Workflow

### 1. Clarify the Search

Determine from the user's message or the active plan (ask only if unclear):
- **Destination** — city or area
- **Check-in / check-out dates** — required for pricing
- **Guests** — number of guests, rooms needed
- **Budget** — per night range or overall budget
- **Preferences** — pool, parking, breakfast, proximity to center, etc.

### 2. Search for Hotels (Kayak)

Search Kayak Hotels using Selenium Grid scripts (in `scripts/`) as the primary method. Connect to `http://192.168.68.168:4444/`. Fall back to Playwright MCP only if Selenium Grid is unavailable. Build the URL directly from search parameters — no form filling needed.

**URL pattern:**
```
https://www.kayak.com/hotels/{City},{State},{Country}-c{cityId}/{checkin}/{checkout}/{adults}adults/{children}?sort=rank_a
```

**Examples:**
- `https://www.kayak.com/hotels/Salt-Lake-City,Utah,United-States-c31915/2026-05-26/2026-06-02/2adults/2children-2-9?sort=rank_a`
- `https://www.kayak.com/hotels/Tokyo,Japan-c11037/2026-06-10/2026-06-17/2adults?sort=rank_a`

**URL construction rules:**
- `{City}` — hyphenated city name (e.g., `Salt-Lake-City`, `New-York`)
- `{State},{Country}` — state and country with hyphens (e.g., `Utah,United-States`)
- `-c{cityId}` — Kayak city ID. Navigate to Kayak manually first to discover the ID if unknown, or omit and let Kayak resolve
- `{checkin}/{checkout}` — dates as `YYYY-MM-DD`
- `{adults}adults` — e.g., `2adults`
- `{children}` — `{N}children-{age1}-{age2}` with dash-separated ages
- `sort=rank_a` — sort by recommended
- Append `;map` to show map view

**Steps (Selenium Grid):**
1. Build the Kayak Hotels URL from search parameters
2. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
3. Navigate to the constructed URL
4. Wait for results to load
5. Apply additional filters if needed (star rating, price range, amenities)
6. Extract hotel listings — name, star rating, guest rating, price per night, amenities, location
7. `driver.quit()` when done

**Fallback (Playwright MCP) — use only if Selenium Grid is down:**
1. `browser_navigate` to the constructed URL
2. `browser_wait_for` results to load
3. `browser_snapshot` to read hotel results
4. `browser_click` for additional filters
5. `browser_close` when done

### 2b. Search Airbnb (if applicable)

If the user is interested in vacation rentals or neighborhood-specific stays, also search Airbnb. Use Selenium Grid scripts as the primary method; fall back to Playwright MCP if unavailable.

**URL pattern:**
```
https://www.airbnb.com/s/{Neighborhood}--{City}--{State}/homes?checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&adults={N}&children={N}
```

**Examples:**
- `https://www.airbnb.com/s/Sugar-House--Salt-Lake-City--UT/homes?checkin=2026-05-26&checkout=2026-06-02&adults=2&children=2`
- `https://www.airbnb.com/s/Shibuya--Tokyo--Japan/homes?checkin=2026-06-10&checkout=2026-06-17&adults=2`

**URL construction rules:**
- `{Neighborhood}` — hyphenated neighborhood name
- `{City}` — hyphenated city name
- `{State}` — state abbreviation (US) or country name
- Dates, adults, children as query params

**Steps (Selenium Grid):**
1. Build the Airbnb URL for each recommended neighborhood
2. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
3. Navigate to the URL
4. Extract listings — name, price per night, rating, review count, type (entire home, private room), amenities, **and the listing URL**
5. **Always include a direct link to each listing.** Airbnb listing URLs follow the pattern `https://www.airbnb.com/rooms/{listing_id}?checkin={date}&checkout={date}&adults={N}&children={N}`. Extract the listing ID from the card's `<a>` href.
6. **Prioritize listings with high review counts** (50+ reviews preferred, 100+ ideal) — these are established, reliable properties. Skip listings with fewer than 10 reviews unless no better options exist.
7. Sort results by review count descending to surface the most-vetted listings first
8. `driver.quit()` when done

**Fallback (Playwright MCP):**
1. `browser_navigate` to the URL
2. `browser_snapshot` to read listings
3. Extract top options
4. `browser_close` when done

### 3. Get Reviews (TripAdvisor via Google)

TripAdvisor blocks both Playwright and Selenium Grid. Instead, use Google search as a proxy to find TripAdvisor review data without hitting TripAdvisor directly.

**Approach: Google as proxy for TripAdvisor**

Search Google for: `site:tripadvisor.com "{hotel name}" "{destination}"`

Google results often show TripAdvisor ratings, review counts, and review snippets directly in the search results — extract this data without clicking through to TripAdvisor.

**Steps (Selenium Grid):**
1. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
2. Navigate to `https://www.google.com/search?q=site:tripadvisor.com+"{hotel name}"+"{destination}"`
3. Extract from Google results:
   - TripAdvisor rating (star rating shown in search snippet)
   - Review count
   - Review snippet text (Google often shows preview quotes)
   - TripAdvisor URL (for user reference, not for scraping)
4. Repeat for each shortlisted hotel
5. `driver.quit()` when done

**Fallback (Playwright MCP):**
1. `browser_navigate` to the Google search URL above
2. `browser_snapshot` to read results
3. Extract TripAdvisor data from Google snippets
4. `browser_close` when done

### 4. Present Results

**Every listing must include a direct link.** No exceptions — the user should be able to click through to any option immediately.

**Always present results in a markdown table** for easy scanning. Use this format:

**For hotels:**
```markdown
| # | Name | Area | Rating | Reviews | $/night | Total | Amenities | Link |
|---|------|------|--------|---------|---------|-------|-----------|------|
| 1 | **Hotel Name** | Neighborhood | 4.5/5 | 392 | $128 | $895 | breakfast, pool, kitchen | [Book](url) |
```

**For Airbnb:**
```markdown
| # | Name | Area | Beds | Rating | Reviews | $/night | Total | Link |
|---|------|------|------|--------|---------|---------|-------|------|
| 1 | **Listing Name** | Sugar House | 2BR/3bed | 4.97 | 392 | $128 | $895 | [View](url) |
```

**When comparing hotels vs Airbnb**, use a combined table:
```markdown
| # | Name | Type | Area | Rating | Reviews | $/night | Total | Key perks | Link |
|---|------|------|------|--------|---------|---------|-------|-----------|------|
| 1 | **Home2 Suites** | Hotel | Sugar House | 4.5/5 | 579 | $165 | $1,155 | free breakfast, kitchen | [Book](url) |
| 2 | **"Family Favorite"** | Airbnb | Sugar House | 4.97 | 392 | $128 | $895 | full home, 2BR | [View](url) |
```

After the table, add a brief **Top picks** section calling out 2-3 standout options with one line each explaining why.

**Link formats by source:**
- **Airbnb**: `https://www.airbnb.com/rooms/{listing_id}?checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&adults={N}&children={N}`
- **Kayak**: `https://www.kayak.com/hotels/{hotel-name-slugified}/{checkin}/{checkout}/{adults}adults/{children}`
- **Booking.com**: `https://www.booking.com/searchresults.html?ss={hotel name}&checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&group_adults={N}&group_children={N}`
- **Hotel direct**: brand website (Hilton, Marriott, etc.) where possible

Sort by best value (rating-to-price ratio) unless the user has a different preference.

### 5. Follow-up

Offer to:
- Compare specific hotels in detail
- Check room types and availability
- Find restaurants or attractions near the hotel
- Look at alternative dates for better prices

## Reference Sites

See `references/sites.md` for site-specific navigation patterns and selectors.

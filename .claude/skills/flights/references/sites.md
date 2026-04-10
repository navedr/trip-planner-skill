# Flight Search Sites

## Kayak (primary)

**URL pattern:**
```
https://www.kayak.com/flights/{origin}-{destination}/{departure}/{return}/{passengers}?sort=bestflight_a
```

**URL construction:**
- Origin/destination: 3-letter IATA airport codes (SEA, JFK, LAX, etc.)
- Dates: `YYYY-MM-DD` format
- Passengers: `{N}adults` — e.g., `2adults`
- Children: append `/children-{age1}-{age2}` with dash-separated ages — e.g., `/children-2-9` for kids aged 2 and 9
- One-way: omit the return date segment

**Query parameters:**
- `sort=bestflight_a` — best flight (default recommended)
- `sort=price_a` — cheapest first
- `sort=duration_a` — shortest duration first
- `fs=stops%3D0` — nonstop only
- `fs=stops%3D1` — 1 stop max
- `ucs=13pgc0n` — optional, can be omitted

**Full examples:**
```
# Round-trip, 2 adults, best flight sort
https://www.kayak.com/flights/SEA-SLC/2026-05-05/2026-05-12/2adults?sort=bestflight_a

# 2 adults + children aged 2 and 9
https://www.kayak.com/flights/SEA-SLC/2026-05-05/2026-05-12/2adults/children-2-9?sort=bestflight_a

# Nonstop only
https://www.kayak.com/flights/SEA-SLC/2026-05-05/2026-05-12/2adults?sort=bestflight_a&fs=stops%3D0

# One-way, 1 adult
https://www.kayak.com/flights/SEA-SLC/2026-05-05/1adults?sort=bestflight_a
```

**Navigation flow:**
1. Navigate to the constructed URL — results page loads directly, no form filling needed
2. Kayak shows a loading/searching animation while fetching prices — wait for it to complete
3. Results show: airline, times, duration, stops, price per person
4. Left sidebar has additional filters: airlines, times, airports, duration
5. Click a result to expand itinerary details

**Result structure:**
- Results grouped as "Best", "Cheapest", "Quickest" at the top
- Each result card: airline logo, departure→arrival times, duration, stops, price
- Click to expand: full itinerary, layover details, baggage info, booking links
- "Price Alert" button for tracking fare changes

**Common blockers:**
- Kayak may show a CAPTCHA on automated access — if encountered, retry after a brief wait
- Cookie consent banner on first visit (EU regions)
- Kayak sometimes redirects to a regional domain (kayak.co.uk, etc.) — the .com URL should work globally
- Price results load progressively — wait for the loading indicator to finish before snapshotting

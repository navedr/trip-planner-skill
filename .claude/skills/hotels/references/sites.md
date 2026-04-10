# Hotel & Accommodation Search Sites

## Kayak Hotels (primary — pricing & comparison)

**URL pattern:**
```
https://www.kayak.com/hotels/{City},{State},{Country}-c{cityId}/{checkin}/{checkout}/{adults}adults/{children}?sort=rank_a
```

**URL construction:**
- City: hyphenated (e.g., `Salt-Lake-City`, `New-York`, `San-Francisco`)
- State/Country: comma-separated, hyphenated (e.g., `Utah,United-States`, `Japan`)
- City ID: Kayak's internal ID, appended as `-c{id}` (e.g., `-c31915` for SLC). If unknown, omit the `-c{id}` part and let Kayak resolve from the city name
- Dates: `YYYY-MM-DD` format
- Passengers: `{N}adults` then optionally `/{N}children-{age1}-{age2}`
- `;map` — append before `?` to show map view

**Query parameters:**
- `sort=rank_a` — recommended (default)
- `sort=price_a` — cheapest first
- `sort=review_a` — best reviewed

**Full examples:**
```
# 2 adults, 2 kids (ages 2 and 9), recommended sort
https://www.kayak.com/hotels/Salt-Lake-City,Utah,United-States-c31915/2026-05-26/2026-06-02/2adults/2children-2-9?sort=rank_a

# Map view
https://www.kayak.com/hotels/Salt-Lake-City,Utah,United-States-c31915/2026-05-26/2026-06-02/2adults/2children-2-9;map?sort=rank_a

# Adults only, cheapest first
https://www.kayak.com/hotels/Tokyo,Japan-c11037/2026-06-10/2026-06-17/2adults?sort=price_a
```

**Navigation flow:**
1. Navigate to constructed URL — results load directly
2. Kayak shows a loading animation while fetching prices — wait for completion
3. Results show: hotel name, star rating, guest rating, price per night, amenities icons
4. Left sidebar has filters: star rating, price, guest rating, amenities, neighborhood
5. Click a hotel for full details, photos, and booking links from multiple sources

**Common blockers:**
- CAPTCHA on automated access — retry after a brief wait
- Cookie consent on first visit (EU)
- Price results load progressively — wait for loading indicator to finish

## Airbnb (vacation rentals & neighborhood stays)

**URL pattern:**
```
https://www.airbnb.com/s/{Neighborhood}--{City}--{State}/homes?checkin={YYYY-MM-DD}&checkout={YYYY-MM-DD}&adults={N}&children={N}
```

**URL construction:**
- Neighborhood: hyphenated (e.g., `Sugar-House`, `Liberty-Wells`, `The-Avenues`)
- City: hyphenated (e.g., `Salt-Lake-City`)
- State: abbreviation for US (e.g., `UT`, `CA`), full country name for international
- Dates and guests as query params

**Optional query parameters:**
- `children_ages={age1}%2C{age2}` — comma-separated ages URL-encoded
- `flexible_cancellation=true` — filter for flexible cancellation
- `price_filter_num_nights={N}` — price per N nights
- `search_type=filter_change` — use after applying filters

**Full examples:**
```
# Sugar House neighborhood, SLC, 2 adults + 2 kids
https://www.airbnb.com/s/Sugar-House--Salt-Lake-City--UT/homes?checkin=2026-05-26&checkout=2026-06-02&adults=2&children=2

# With children ages and flexible cancellation
https://www.airbnb.com/s/Sugar-House--Salt-Lake-City--UT/homes?checkin=2026-05-26&checkout=2026-06-02&adults=2&children=2&children_ages=2%2C9&flexible_cancellation=true
```

**Navigation flow:**
1. Navigate to constructed URL — listings load with map
2. Results show: listing name, type (entire home/private room), price per night, rating, photo
3. Filter bar at top: price, type of place, rooms, amenities
4. Click a listing for full details, photos, reviews, house rules

**Common blockers:**
- Airbnb may require login for some features — browsing results works without login
- Rate limiting on rapid navigation between listings

## TripAdvisor (reviews & detailed ratings) — via Google proxy

**Important:** TripAdvisor blocks both Playwright and Selenium Grid. Do NOT navigate to TripAdvisor directly. Instead, use Google search as a proxy to extract TripAdvisor data.

### Google-as-proxy approach

**Search URL:** `https://www.google.com/search?q=site:tripadvisor.com+"{hotel name}"+"{destination}"`

**Examples:**
```
https://www.google.com/search?q=site:tripadvisor.com+"Hilton+Salt+Lake+City+Center"+"Salt+Lake+City"
https://www.google.com/search?q=site:tripadvisor.com+"Grand+Hyatt+Tokyo"+"Tokyo"
```

**What Google results typically show:**
- TripAdvisor star rating (displayed in search snippet)
- Total review count
- Review snippet text (Google often shows 1-2 preview quotes)
- TripAdvisor page URL (provide to user as reference link, but do not scrape it)

**Data to extract from Google snippets:**
- Overall rating (out of 5) and total review count
- Review highlights visible in Google's preview text
- Price range or category if shown
- TripAdvisor URL for the user to visit manually

**Tips:**
- Use quotes around the hotel name for exact match
- Add the city name in quotes to disambiguate chains with multiple locations
- If the first result isn't the right property, scan the top 3-5 results
- Google may also show ratings from other review sites (Google Reviews, Booking.com) — useful for cross-referencing

**Legacy direct approach (blocked — do not use):**
TripAdvisor direct navigation (`tripadvisor.com/Search?q=...`) is blocked by bot detection on both Playwright and Selenium Grid. The Google proxy approach above is the reliable alternative.

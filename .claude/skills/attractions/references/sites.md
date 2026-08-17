# Attraction Search Sites

## TripAdvisor — via DuckDuckGo proxy

**Important:** TripAdvisor blocks both Playwright and Selenium Grid. Do NOT navigate to TripAdvisor directly — it serves an empty page shell (body length 0). Use a search engine as a proxy.

### Use DuckDuckGo, not Google

**Google no longer works from the Grid.** It blocks the Grid's datacenter exit IP with an "Our systems have detected unusual traffic from your computer network" interstitial and returns zero results. Google-as-proxy only works from a residential IP.

**DuckDuckGo's HTML endpoint serves datacenter IPs fine.**

**Search URLs:**
```
# General attractions for a destination
https://duckduckgo.com/html/?q=site:tripadvisor.com+things+to+do+"{destination}"

# Specific interest
https://duckduckgo.com/html/?q=site:tripadvisor.com+{interest}+"{destination}"

# Specific attraction
https://duckduckgo.com/html/?q=site:tripadvisor.com+"{attraction name}"+"{destination}"
```

**Examples:**
```
https://duckduckgo.com/html/?q=site:tripadvisor.com+things+to+do+"Salt+Lake+City"
https://duckduckgo.com/html/?q=site:tripadvisor.com+hiking+"Salt+Lake+City"
https://duckduckgo.com/html/?q=site:tripadvisor.com+"Temple+Square"+"Salt+Lake+City"
```

**Result selectors:** `.result, .web-result, #links > div`

**What DuckDuckGo results reliably give:**
- TripAdvisor URLs, including "Top Things to Do" list pages (provide as reference links, do not scrape them)
- Page titles and description snippets
- **Review counts embedded in description text** (e.g. "See Tripadvisor's 837,434 traveler reviews")
- Attraction rank where present (e.g. "#532 of 944 things to do in San Diego")

**What it does NOT give:** star-rating rich snippets. Google used to surface the bubble rating directly; DuckDuckGo does not. Expect review counts and snippet text but often not the numeric rating.

**Because of that, prefer Yelp for ratings** — the Grid loads Yelp pages in full including rating and review count. Use TripAdvisor for cross-referencing or when the venue isn't on Yelp.

**Tips:**
- Use specific interest keywords (hiking, museums, family, nightlife) to filter results
- For seasonal activities, add the month or season to the query
- The first 1-2 results are often ads (marked `AD`) — skip them
- Newly opened venues frequently have several duplicate TripAdvisor listings with single-digit review counts each; check the count before trusting any rating or rank

**Legacy approaches (blocked — do not use):**
- TripAdvisor direct navigation (`tripadvisor.com/Search?q=...`, `tripadvisor.com/Attractions-...`) — bot-detected on Playwright and Selenium Grid alike
- Google-as-proxy from the Grid — datacenter IP blocked

## Google Search

**Query pattern:** `things to do in {destination} site:tripadvisor.com`

This is now the **primary** method (not a fallback) since TripAdvisor blocks direct access. Google results show TripAdvisor ratings and snippets directly, and link to TripAdvisor listing pages the user can visit manually.

# Attraction Search Sites

## TripAdvisor — via Google proxy

**Important:** TripAdvisor blocks both Playwright and Selenium Grid. Do NOT navigate to TripAdvisor directly. Instead, use Google search as a proxy to extract TripAdvisor attraction data.

### Google-as-proxy approach

**Search URLs:**
```
# General attractions for a destination
https://www.google.com/search?q=site:tripadvisor.com+things+to+do+"{destination}"

# Specific interest
https://www.google.com/search?q=site:tripadvisor.com+{interest}+"{destination}"

# Specific attraction
https://www.google.com/search?q=site:tripadvisor.com+"{attraction name}"+"{destination}"
```

**Examples:**
```
https://www.google.com/search?q=site:tripadvisor.com+things+to+do+"Salt+Lake+City"
https://www.google.com/search?q=site:tripadvisor.com+hiking+"Salt+Lake+City"
https://www.google.com/search?q=site:tripadvisor.com+"Temple+Square"+"Salt+Lake+City"
```

**What Google results typically show:**
- TripAdvisor star rating in the search snippet
- Review count
- Attraction type/category
- Review snippet text with visitor highlights
- TripAdvisor URL (provide to user as reference, do not scrape it)

**Tips:**
- Google often returns TripAdvisor "Top Things to Do" list pages — these contain ranked attractions with ratings
- Use specific interest keywords (hiking, museums, family, nightlife) to filter results
- For seasonal activities, add the month or season to the query
- Google may also show Knowledge Panel data with hours, address, and photos

**Legacy direct approach (blocked — do not use):**
TripAdvisor direct navigation (`tripadvisor.com/Search?q=...` and `tripadvisor.com/Attractions-...`) is blocked by bot detection on both Playwright and Selenium Grid. The Google proxy approach above is the reliable alternative.

## Google Search

**Query pattern:** `things to do in {destination} site:tripadvisor.com`

This is now the **primary** method (not a fallback) since TripAdvisor blocks direct access. Google results show TripAdvisor ratings and snippets directly, and link to TripAdvisor listing pages the user can visit manually.

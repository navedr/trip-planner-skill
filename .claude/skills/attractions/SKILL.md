---
name: find-attractions
description: Find tourist attractions, things to do, and points of interest for a travel destination. Use when the user asks about sightseeing, activities, landmarks, tours, or what to do in a city or region.
metadata:
  author: narangwa
  version: "0.1.0"
---

# Find Attractions

Search for tourist attractions, activities, and points of interest using browser automation.

## When to Use

Activate when the user asks about:
- Things to do in a destination
- Tourist attractions or landmarks
- Activities, tours, or experiences
- Sightseeing recommendations
- Day trips or excursions

## Plan Integration

When invoked as part of a travel plan (from `plan-trip` skill):
1. Read the active plan's `trip-data.json` to get `destination`, `dates`, and `preferences.excursions`
2. Do not re-ask for details already in the JSON
3. After finding results, append to the `attractions` array in `trip-data.json`

When invoked standalone (no active plan), proceed with the clarify step below.

## Workflow

### 1. Clarify the Search

Determine from the user's message or the active plan (ask only if unclear):
- **Destination** — city, region, or country
- **Interests** — museums, nature, adventure, history, food tours, nightlife, family-friendly, etc.
- **Travel dates** — some attractions are seasonal
- **Budget** — free, budget, mid-range, luxury

### 2. Search for Attractions

TripAdvisor blocks both Playwright and Selenium Grid. Use Google search as a proxy to find TripAdvisor attraction data without hitting TripAdvisor directly.

**Primary method: Selenium Grid** — use scripts in `scripts/` that connect to `http://192.168.68.168:4444/`. Fall back to Playwright MCP only if Selenium Grid is unavailable.

**Google as proxy for TripAdvisor (recommended):**
```
https://www.google.com/search?q=site:tripadvisor.com+things+to+do+{destination}
```
Or for specific interests:
```
https://www.google.com/search?q=site:tripadvisor.com+{interest}+{destination}
```
Google results show TripAdvisor ratings, review counts, and snippets directly — extract this data without clicking through to TripAdvisor.

**Steps (Selenium Grid):**
1. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
2. Navigate to Google search URL with `site:tripadvisor.com` query
3. Extract attraction data from Google snippets — name, rating, review count, type, price level
4. For details on a specific attraction, search Google for `site:tripadvisor.com "{attraction name}" "{destination}"` to get review snippets, hours, tips
5. `driver.quit()` when done

**Fallback (Playwright MCP):**
1. `browser_navigate` to the Google search URL above
2. `browser_snapshot` to read results
3. Extract attraction data from Google snippets
4. `browser_close` when done

### 3. Present Results

**Always present results in a markdown table** for easy scanning:

```markdown
| # | Name | Type | Rating | Reviews | Price | Duration | Kid-friendly | Link |
|---|------|------|--------|---------|-------|----------|-------------|------|
| 1 | **Hogle Zoo** | Zoo | 4.5 | 1,200 | $$ | 3-4 hrs | Yes (stroller OK) | [TripAdvisor](url) |
```

Group into separate tables by category if the user hasn't specified interests (e.g., "Top Landmarks", "Museums & Culture", "Outdoor Activities").

After the table, add a brief **Highlights** section with 1-line tips for the top 3-4 picks.

### 4. Follow-up

Offer to:
- Get more details on any specific attraction
- Search for nearby restaurants or hotels
- Find similar attractions in the area
- Check opening hours and ticket prices

## Reference Sites

See `references/sites.md` for site-specific navigation patterns and selectors.

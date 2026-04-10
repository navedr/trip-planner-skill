---
name: find-restaurants
description: Find restaurants and dining options for a travel destination. Use when the user asks about restaurants, places to eat, dining, cafes, food recommendations, or local cuisine.
metadata:
  author: narangwa
  version: "0.1.0"
---

# Find Restaurants

Search for restaurants and dining options using browser automation.

## When to Use

Activate when the user asks about:
- Restaurants or places to eat
- Dining recommendations
- Local food and cuisine
- Cafes, bars, or specific food types
- Best restaurants in a destination

## Plan Integration

When invoked as part of a travel plan (from `plan-trip` skill):
1. Read the active plan's `trip-data.json` to get `destination`, `preferences.food`, and `hotels.selected` location
2. Prioritize restaurants near the selected hotel or planned attractions
3. Do not re-ask for details already in the JSON
4. After finding results, append to the `restaurants` array in `trip-data.json`

When invoked standalone (no active plan), proceed with the clarify step below.

## Workflow

### 1. Clarify the Search

Determine from the user's message or the active plan (ask only if unclear):
- **Destination** — city or specific neighborhood
- **Cuisine** — Italian, Japanese, local, vegetarian, etc.
- **Budget** — cheap eats, mid-range, fine dining
- **Meal** — breakfast, lunch, dinner, brunch
- **Dietary needs** — vegetarian, vegan, gluten-free, halal, kosher

### 2. Search for Restaurants

Use Yelp as the primary source for restaurant discovery and reviews. Yelp works reliably with Selenium Grid.

**Primary method: Selenium Grid** — use scripts in `scripts/` that connect to `http://192.168.68.168:4444/`. Fall back to Playwright MCP only if Selenium Grid is unavailable.

**Yelp search URL:**
```
https://www.yelp.com/search?find_desc=Restaurants&find_loc={destination}&sortby=rating
```
For specific cuisines:
```
https://www.yelp.com/search?find_desc={cuisine}+Restaurants&find_loc={destination}&sortby=rating
```
For family-friendly:
```
https://www.yelp.com/search?find_desc=Restaurants&find_loc={destination}&sortby=rating&attrs=GoodForKids
```

**Google Maps approach (supplementary — hours, popular times):**
```
https://www.google.com/maps/search/restaurants+in+{destination}
```

**Steps (Selenium Grid):**
1. Connect to Selenium Grid at `http://192.168.68.168:4444/` with Chrome
2. Navigate to Yelp search URL
3. Extract restaurant data — name, rating, review count, cuisine, price level, neighborhood, review snippets
4. Optionally navigate to Google Maps for hours, popular times, menu links
5. For a specific restaurant, navigate to its Yelp page for detailed reviews
6. `driver.quit()` when done

**Fallback (Playwright MCP):**
1. `browser_navigate` to the Yelp search URL
2. `browser_snapshot` to read results
3. Extract restaurant data
4. `browser_close` when done

### 3. Present Results

**Always present results in a markdown table** for easy scanning:

```markdown
| # | Name | Cuisine | Price | Rating | Reviews | Neighborhood | Best for | Link |
|---|------|---------|-------|--------|---------|-------------|----------|------|
| 1 | **Red Iguana** | Mexican | $$ | 4.5 | 2,100 | North Temple | family dinner | [Yelp](url) |
```

Group into separate tables by category if the user hasn't specified (e.g., "Fine Dining", "Local Favorites", "Casual & Budget-Friendly").

After the table, add a brief **Highlights** section with 1-line notes on standout dishes or tips for the top 3-4 picks.

### 4. Follow-up

Offer to:
- Get the full menu or prices for a specific restaurant
- Find restaurants near their hotel or a specific attraction
- Search for a different cuisine or price range
- Check reservation availability

## Reference Sites

See `references/sites.md` for site-specific navigation patterns and selectors.

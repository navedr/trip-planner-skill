# Restaurant Search Sites

## Yelp (primary — reviews & discovery)

Yelp works reliably with Selenium Grid. Use it as the primary source for restaurant search and reviews.

**Search URLs:**
```
# General restaurant search
https://www.yelp.com/search?find_desc=Restaurants&find_loc={City}%2C+{State}&sortby=rating

# Specific cuisine
https://www.yelp.com/search?find_desc={cuisine}+Restaurants&find_loc={City}%2C+{State}&sortby=rating

# Family-friendly filter
https://www.yelp.com/search?find_desc=Restaurants&find_loc={City}%2C+{State}&sortby=rating&attrs=GoodForKids
```

**Examples:**
```
https://www.yelp.com/search?find_desc=Restaurants&find_loc=Salt+Lake+City%2C+UT&sortby=rating
https://www.yelp.com/search?find_desc=Indian+Restaurants&find_loc=Salt+Lake+City%2C+UT&sortby=rating
https://www.yelp.com/search?find_desc=Restaurants&find_loc=Salt+Lake+City%2C+UT&sortby=rating&attrs=GoodForKids
```

**Sort options:**
- `sortby=rating` — highest rated
- `sortby=review_count` — most reviewed
- `sortby=recommended` — Yelp's algorithm (default if omitted)

**Filter parameters:**
- `attrs=GoodForKids` — family-friendly
- `attrs=OutdoorSeating` — outdoor seating
- `attrs=GoodForGroups` — good for groups
- Price filters: `l=1` ($), `l=2` ($$), `l=3` ($$$), `l=4` ($$$$)

**Result data to extract:**
- Restaurant name
- Rating (out of 5 stars) and review count
- Price level ($–$$$$)
- Cuisine categories
- Neighborhood/area
- Review snippet quotes
- Open/closed status and hours

**Common blockers:**
- Yelp may show a "Not a Robot" CAPTCHA on rapid access — add delays between page loads
- Sponsored listings appear first — look for "Sponsored" labels and skip them
- Some results are ads (e.g., Culver's) — filter by review count > 50 for quality

## Google Maps (supplementary — hours, popular times)

**Base URL:** `https://www.google.com/maps/search/restaurants+in+{destination}`

**Navigation flow:**
1. Results appear in left panel alongside map
2. Scroll the panel to load more results
3. Click a result for details — reviews, hours, popular dishes, price level
4. Filter pills at top: cuisine type, price, rating, hours

**Advantages:**
- Shows current open/closed status
- "Popular times" data for busy hour avoidance
- Direct links to menus and reservation platforms

## TripAdvisor (blocked — use Google proxy if needed)

TripAdvisor blocks both Playwright and Selenium Grid. If TripAdvisor data is specifically needed, use Google search as a proxy:
```
https://www.google.com/search?q=site:tripadvisor.com+"{restaurant name}"+"{destination}"
```
Google results show TripAdvisor ratings and snippets without hitting TripAdvisor directly.

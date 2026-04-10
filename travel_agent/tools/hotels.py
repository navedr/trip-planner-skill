"""Kayak hotel & Airbnb search wrappers — return structured dicts."""

from __future__ import annotations

import time
import urllib.parse

from ._selenium import DEFAULT_GRID_URL, create_driver

_HOTEL_SELECTORS = [
    '[class*="nrc6"]',
    '[class*="resultInner"]',
    '[class*="FLpo"]',
    '[data-resultid]',
]


# ---------------------------------------------------------------------------
# Kayak Hotels
# ---------------------------------------------------------------------------

def _build_kayak_hotel_url(city, checkin, checkout, adults, children_ages, city_id, sort):
    # Kayak needs hyphenated city names: "Salt Lake City" -> "Salt-Lake-City"
    # Also handle "Salt Lake City, Utah, United States" format
    city_part = city.replace(" ", "-").replace(",", ",")
    if city_id:
        city_part += f"-c{city_id}"
    url = f"https://www.kayak.com/hotels/{city_part}/{checkin}/{checkout}/{adults}adults"
    if children_ages:
        ages = "-".join(str(a) for a in children_ages)
        url += f"/{len(children_ages)}children-{ages}"
    url += f"?sort={sort}"
    return url


def search_kayak_hotels(
    city: str,
    checkin: str,
    checkout: str,
    adults: int = 2,
    children_ages: list[int] | None = None,
    city_id: str | None = None,
    sort: str = "rank_a",
    grid_url: str = DEFAULT_GRID_URL,
) -> dict:
    """Search Kayak for hotels and return structured results.

    Returns:
        {"search_url": str, "results": [str], "count": int}
    """
    url = _build_kayak_hotel_url(city, checkin, checkout, adults, children_ages, city_id, sort)

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(12)

        results = driver.execute_script("""
            const selectors = arguments[0];
            for (const sel of selectors) {
                const cards = document.querySelectorAll(sel);
                if (cards.length > 0) {
                    const hotels = [];
                    cards.forEach((card, i) => {
                        if (i >= 15) return;
                        const text = card.innerText.trim();
                        if (text.length > 30) hotels.push(text.substring(0, 600));
                    });
                    if (hotels.length > 0) return hotels;
                }
            }
            return [document.body.innerText.substring(0, 4000)];
        """, _HOTEL_SELECTORS)

        return {"search_url": url, "results": results, "count": len(results)}
    finally:
        driver.quit()


# ---------------------------------------------------------------------------
# Airbnb
# ---------------------------------------------------------------------------

def _build_airbnb_url(
    neighborhood: str,
    city: str,
    state: str,
    checkin: str,
    checkout: str,
    adults: int,
    children: int,
    children_ages: list[int] | None,
    price_max: int | None,
    min_bedrooms: int | None,
) -> str:
    location = f"{neighborhood}--{city}--{state}"
    params: dict[str, str] = {
        "checkin": checkin,
        "checkout": checkout,
        "adults": str(adults),
    }
    if children:
        params["children"] = str(children)
    if children_ages:
        params["children_ages"] = ",".join(str(a) for a in children_ages)
    if price_max is not None:
        params["price_max"] = str(price_max)
    if min_bedrooms is not None:
        params["min_bedrooms"] = str(min_bedrooms)
    params["room_types[]"] = "Entire home/apt"

    url = f"https://www.airbnb.com/s/{location}/homes?{urllib.parse.urlencode(params)}"
    return url


def search_airbnb(
    neighborhood: str,
    city: str,
    state: str,
    checkin: str,
    checkout: str,
    adults: int = 2,
    children: int = 0,
    children_ages: list[int] | None = None,
    price_max: int | None = None,
    min_bedrooms: int | None = None,
    grid_url: str = DEFAULT_GRID_URL,
) -> dict:
    """Search Airbnb for vacation rentals and return structured results.

    Returns:
        {"search_url": str, "listings": [{"id": str, "url": str, "text": str}], "count": int}
    """
    url = _build_airbnb_url(
        neighborhood, city, state, checkin, checkout,
        adults, children, children_ages, price_max, min_bedrooms,
    )

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(10)

        # Build JS with actual param values injected
        js = """
            const results = [];
            const seen = new Set();
            const links = document.querySelectorAll('a[href*="/rooms/"]');
            links.forEach(a => {
                const href = a.getAttribute('href');
                const match = href.match(/\\/rooms\\/(\\d+)/);
                if (match && !seen.has(match[1])) {
                    seen.add(match[1]);
                    const card = a.closest('[itemprop="itemListElement"]') || a.parentElement.parentElement;
                    results.push({
                        id: match[1],
                        url: 'https://www.airbnb.com/rooms/' + match[1]
                            + '?checkin=CHECKIN&checkout=CHECKOUT&adults=ADULTS&children=CHILDREN',
                        text: card ? card.innerText.trim().substring(0, 500) : ''
                    });
                }
            });
            return results;
        """
        js = js.replace("CHECKIN", checkin)
        js = js.replace("CHECKOUT", checkout)
        js = js.replace("ADULTS", str(adults))
        js = js.replace("CHILDREN", str(children))

        listings = driver.execute_script(js)

        return {"search_url": url, "listings": listings, "count": len(listings)}
    finally:
        driver.quit()

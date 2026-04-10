"""Yelp restaurant search wrapper — returns structured dicts."""

from __future__ import annotations

import time
import urllib.parse

from ._selenium import DEFAULT_GRID_URL, create_driver


def _build_yelp_url(
    destination: str,
    cuisine: str | None,
    sort: str,
    family_friendly: bool,
    price: int | None,
) -> str:
    desc = "Restaurants"
    if cuisine:
        desc = f"{cuisine} Restaurants"
    params = {
        "find_desc": desc,
        "find_loc": destination,
        "sortby": sort,
    }
    url = f"https://www.yelp.com/search?{urllib.parse.urlencode(params)}"
    if family_friendly:
        url += "&attrs=GoodForKids"
    if price is not None:
        url += f"&l={price}"
    return url


def search_restaurants(
    destination: str,
    cuisine: str | None = None,
    sort: str = "rating",
    family_friendly: bool = False,
    price: int | None = None,
    grid_url: str = DEFAULT_GRID_URL,
) -> dict:
    """Search Yelp for restaurants and return structured results.

    Returns:
        {"search_url": str, "results": [{"slug": str, "url": str, "text": str}], "count": int}
    """
    url = _build_yelp_url(destination, cuisine, sort, family_friendly, price)

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(10)

        results = driver.execute_script("""
            const r = []; const seen = new Set();
            document.querySelectorAll('a[href*="/biz/"]').forEach(a => {
                const m = a.getAttribute('href').match(/\\/biz\\/([^?]+)/);
                if (!m || seen.has(m[1])) return; seen.add(m[1]);
                const c = a.closest('li') || a.parentElement.parentElement.parentElement;
                if (!c) return; const t = c.innerText.trim();
                if (t.length > 30) r.push({slug: m[1], url: 'https://www.yelp.com/biz/' + m[1], text: t.substring(0, 500)});
            });
            return r.slice(0, 15);
        """)

        # If no results and family_friendly was on, retry without it
        if not results and family_friendly:
            retry_url = _build_yelp_url(destination, cuisine, sort, False, price)
            driver.get(retry_url)
            time.sleep(8)
            results = driver.execute_script("""
                const r = []; const seen = new Set();
                document.querySelectorAll('a[href*="/biz/"]').forEach(a => {
                    const m = a.getAttribute('href').match(/\\/biz\\/([^?]+)/);
                    if (!m || seen.has(m[1])) return; seen.add(m[1]);
                    const c = a.closest('li') || a.parentElement.parentElement.parentElement;
                    if (!c) return; const t = c.innerText.trim();
                    if (t.length > 30) r.push({slug: m[1], url: 'https://www.yelp.com/biz/' + m[1], text: t.substring(0, 500)});
                });
                return r.slice(0, 15);
            """)
            url = retry_url

        return {"search_url": url, "results": results, "count": len(results)}
    finally:
        driver.quit()

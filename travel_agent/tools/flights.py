"""Kayak flight search wrapper — returns structured dicts."""

from __future__ import annotations

import time

from ._selenium import DEFAULT_GRID_URL, create_driver

# Multiple selectors to try — Kayak changes class names frequently
_RESULT_SELECTORS = [
    '[class*="nrc6"]',
    '[class*="resultInner"]',
    '[data-resultid]',
]


def _build_kayak_url(origin, dest, depart, return_date, adults, children_ages, nonstop, sort):
    url = f"https://www.kayak.com/flights/{origin}-{dest}/{depart}"
    if return_date:
        url += f"/{return_date}"
    url += f"/{adults}adults"
    if children_ages:
        ages = "-".join(str(a) for a in children_ages)
        url += f"/children-{ages}"
    params = [f"sort={sort}"]
    if nonstop:
        params.append("fs=stops%3D0")
    url += "?" + "&".join(params)
    return url


def search_flights(
    origin="SEA",
    dest="SLC",
    depart="2026-05-26",
    return_date=None,
    adults=1,
    children_ages=None,
    nonstop=False,
    sort="bestflight_a",
    grid_url=DEFAULT_GRID_URL,
):
    """Search Kayak for flights and return structured results.

    Returns:
        {"search_url": str, "results": [str], "count": int}
    """
    url = _build_kayak_url(origin, dest, depart, return_date, adults, children_ages, nonstop, sort)

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(15)

        # Try multiple selectors — Kayak changes class names
        results = driver.execute_script("""
            const selectors = arguments[0];
            for (const sel of selectors) {
                const cards = document.querySelectorAll(sel);
                if (cards.length > 0) {
                    const flights = [];
                    cards.forEach((card, i) => {
                        if (i >= 15) return;
                        const text = card.innerText.trim();
                        if (text.length > 30) flights.push(text.substring(0, 600));
                    });
                    if (flights.length > 0) return flights;
                }
            }
            // Fallback: grab body text
            return [document.body.innerText.substring(0, 4000)];
        """, _RESULT_SELECTORS)

        return {"search_url": url, "results": results, "count": len(results)}
    finally:
        driver.quit()

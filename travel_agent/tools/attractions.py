"""Attraction search wrapper (Google -> TripAdvisor) — returns structured dicts."""

from __future__ import annotations

import time
import urllib.parse

from ._selenium import DEFAULT_GRID_URL, create_driver


def _build_google_url(destination: str, interest: str | None) -> str:
    if interest:
        query = f'site:tripadvisor.com {interest} "{destination}"'
    else:
        query = f'site:tripadvisor.com things to do "{destination}"'
    return f"https://www.google.com/search?q={urllib.parse.quote(query)}"


def search_attractions(
    destination: str,
    interest: str | None = None,
    grid_url: str = DEFAULT_GRID_URL,
) -> dict:
    """Search Google for TripAdvisor attraction results and return snippets.

    Returns:
        {"search_url": str, "results": [str], "count": int}
    """
    url = _build_google_url(destination, interest)

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(10)

        results = driver.execute_script("""
            const snippets = [];
            const items = document.querySelectorAll('#search .g, #rso > div');
            items.forEach((el, i) => {
                if (i >= 15) return;
                const text = el.innerText.trim();
                if (text.length > 20) snippets.push(text.substring(0, 500));
            });
            return snippets;
        """)

        return {"search_url": url, "results": results, "count": len(results)}
    finally:
        driver.quit()

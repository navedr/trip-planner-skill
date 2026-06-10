"""Kayak flight search wrapper — returns structured dicts."""

from __future__ import annotations

import re
import time

from ._selenium import DEFAULT_GRID_URL, create_driver


_TIME_RE = re.compile(r'^\d+:\d+\s*(am|pm)\s*[–\-]\s*\d+:\d+\s*(am|pm)', re.I)
_NAME_LINE_RE = re.compile(r'^[A-Za-z][A-Za-z &\.\-]{2,49}$')  # text-only line, no digits/$
_PRICE_PP_RE = re.compile(r'\$([0-9,]+)\s*/\s*person', re.I)
_PRICE_TOTAL_RE = re.compile(r'\$([0-9,]+)\s*total', re.I)
_STOPS_RE = re.compile(r'(nonstop|\d+\s*stop)', re.I)
_DURATION_RE = re.compile(r'(\d+h\s*\d*m?)', re.I)


def _build_kayak_url(origin, dest, depart, return_date, adults, children_ages, nonstop, sort, depart_after=None):
    url = f"https://www.kayak.com/flights/{origin}-{dest}/{depart}"
    if return_date:
        url += f"/{return_date}"
    url += f"/{adults}adults"
    if children_ages:
        ages = "-".join(str(a) for a in children_ages)
        url += f"/children-{ages}"
    params = [f"sort={sort}"]
    fs_filters = []
    if nonstop:
        fs_filters.append("stops%3D0")
    if depart_after:
        hhmm = depart_after.replace(":", "")
        # Format: takeoff=OUT_START,OUT_END@RET_START__RET_START,RET_END
        # OUT_END wraps (e.g. 1159 = just before midnight); @0000__0000,2359 = no return filter
        fs_filters.append(f"takeoff%3D{hhmm}%2C1159%400000__0000%2C2359")
    if fs_filters:
        params.append("fs=" + "%3B".join(fs_filters))
    url += "?" + "&".join(params)
    return url


def _depart_hour(times_str: str) -> float:
    """Return departure hour as float (24h), or -1 on failure."""
    m = re.match(r'^(\d+):(\d+)\s*(am|pm)', times_str.strip(), re.I)
    if not m:
        return -1
    h, mi, period = int(m.group(1)), int(m.group(2)), m.group(3).lower()
    if period == 'pm' and h != 12:
        h += 12
    elif period == 'am' and h == 12:
        h = 0
    return h + mi / 60


def _parse_flights(body_text: str, max_results: int = 15, depart_after: str | None = None) -> list[dict]:
    """Extract flight records from Kayak body text.

    depart_after: "HH:MM" (24h) — skip flights departing before this time.
    """
    min_hour = -1.0
    if depart_after:
        parts = depart_after.replace(":", "")
        min_hour = int(parts[:2]) + int(parts[2:]) / 60

    lines = body_text.split('\n')
    flights: list[dict] = []
    seen: set[str] = set()

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not _TIME_RE.match(stripped):
            continue
        if stripped in seen:
            continue
        seen.add(stripped)

        block = '\n'.join(lines[i:i + 20])
        flight: dict = {"times": stripped}

        # Airline is the first text-only line after the time line (works for any carrier)
        for j in range(1, 5):
            if i + j >= len(lines):
                break
            candidate = lines[i + j].strip()
            if candidate and _NAME_LINE_RE.match(candidate):
                flight["airline"] = candidate
                break

        m = _STOPS_RE.search(block)
        if m:
            flight["stops"] = m.group(1)

        m = _DURATION_RE.search(block)
        if m:
            flight["duration"] = m.group(1)

        m = _PRICE_PP_RE.search(block)
        if m:
            flight["price_per_person"] = "$" + m.group(1)

        m = _PRICE_TOTAL_RE.search(block)
        if m:
            flight["price_total"] = "$" + m.group(1)

        if "price_per_person" in flight or "price_total" in flight:
            if min_hour < 0 or _depart_hour(stripped) >= min_hour:
                flights.append(flight)

        if len(flights) >= max_results:
            break

    return flights


def search_flights(
    origin="SEA",
    dest="SLC",
    depart="2026-05-26",
    return_date=None,
    adults=1,
    children_ages=None,
    nonstop=False,
    sort="bestflight_a",
    depart_after=None,
    grid_url=DEFAULT_GRID_URL,
):
    """Search Kayak for flights and return structured results.

    Returns:
        {"search_url": str, "results": [dict], "count": int}
    """
    url = _build_kayak_url(origin, dest, depart, return_date, adults, children_ages, nonstop, sort, depart_after)

    driver = create_driver(grid_url)
    try:
        driver.get(url)
        time.sleep(15)

        # Wait for loading spinner to clear, then give JS filters time to apply
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        try:
            WebDriverWait(driver, 30).until_not(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='loading'], [class*='spinner'], [class*='progress']"))
            )
        except Exception:
            pass
        time.sleep(5)

        body_text = driver.find_element("tag name", "body").text
        results = _parse_flights(body_text, depart_after=depart_after)

        return {"search_url": url, "results": results, "count": len(results)}
    finally:
        driver.quit()


def search_flights_firecrawl(
    origin="SEA",
    dest="SLC",
    depart="2026-05-26",
    return_date=None,
    adults=1,
    children_ages=None,
    nonstop=False,
    sort="bestflight_a",
    depart_after=None,
):
    """Search Kayak via Firecrawl. Same return shape as search_flights."""
    from ._firecrawl import scrape_url

    url = _build_kayak_url(origin, dest, depart, return_date, adults, children_ages, nonstop, sort, depart_after)
    markdown = scrape_url(url, wait_for_ms=15000)

    # Parse structured flights from markdown body using same regex approach
    results = _parse_flights(markdown)
    if not results:
        # Fallback: return raw markdown chunks so the LLM can interpret
        blocks = [b.strip() for b in markdown.split("\n\n") if len(b.strip()) > 30]
        results = [{"raw": b[:600]} for b in blocks[:15]]

    return {"search_url": url, "results": results, "count": len(results)}

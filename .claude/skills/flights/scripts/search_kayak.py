"""Search Kayak for flights using Selenium Grid.

Usage:
    python search_kayak.py --origin SEA --dest SLC \
        --depart 2026-05-26 --return 2026-06-02 \
        --adults 2 --children 2,9 \
        --nonstop --sort bestflight_a

Connects to the Selenium Grid at SELENIUM_GRID_URL env var (default: http://192.168.68.168:4444/)
"""

import argparse
import os
import re
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from _selenium import create_driver  # noqa: E402


_TIME_RE = re.compile(r'^\d+:\d+\s*(am|pm)\s*[–\-]\s*\d+:\d+\s*(am|pm)', re.I)
_NAME_LINE_RE = re.compile(r'^[A-Za-z][A-Za-z &\.\-]{2,49}$')  # text-only line, no digits/$
_PRICE_PP_RE = re.compile(r'\$([0-9,]+)\s*/\s*person', re.I)
_PRICE_TOTAL_RE = re.compile(r'\$([0-9,]+)\s*total', re.I)
_STOPS_RE = re.compile(r'(nonstop|\d+\s*stop)', re.I)
_DURATION_RE = re.compile(r'(\d+h\s*\d*m?)', re.I)


def build_kayak_url(origin, dest, depart, return_date, adults, children, nonstop, sort, depart_after=None):
    url = f"https://www.kayak.com/flights/{origin}-{dest}/{depart}"
    if return_date:
        url += f"/{return_date}"
    url += f"/{adults}adults"
    if children:
        ages = "-".join(str(a) for a in children)
        url += f"/children-{ages}"
    params = [f"sort={sort}"]
    fs_filters = []
    if nonstop:
        fs_filters.append("stops%3D0")
    if depart_after:
        # depart_after is "HH:MM" or "HHMM" — e.g. "12:00" or "1200"
        hhmm = depart_after.replace(":", "")
        # Format: takeoff=OUT_START,OUT_END@RET_START__RET_START,RET_END
        # OUT_END wraps (e.g. 1159 = just before midnight); @0000__0000,2359 = no return filter
        fs_filters.append(f"takeoff%3D{hhmm}%2C1159%400000__0000%2C2359")
    if fs_filters:
        params.append("fs=" + "%3B".join(fs_filters))
    url += "?" + "&".join(params)
    return url


def _depart_hour(times_str):
    """Return departure hour as float (24h) from '1:30 pm – 9:30 pm', or -1 on failure."""
    m = re.match(r'^(\d+):(\d+)\s*(am|pm)', times_str.strip(), re.I)
    if not m:
        return -1
    h, mi, period = int(m.group(1)), int(m.group(2)), m.group(3).lower()
    if period == 'pm' and h != 12:
        h += 12
    elif period == 'am' and h == 12:
        h = 0
    return h + mi / 60


def parse_flights(body_text, max_results=15, depart_after=None):
    """Extract flight records from Kayak body text using regex.

    depart_after: "HH:MM" string (24h) — skip flights departing before this time.
    """
    min_hour = -1
    if depart_after:
        parts = depart_after.replace(":", "")
        min_hour = int(parts[:2]) + int(parts[2:]) / 60

    lines = body_text.split('\n')
    flights = []
    seen = set()

    for i, line in enumerate(lines):
        stripped = line.strip()
        if not _TIME_RE.match(stripped):
            continue
        if stripped in seen:
            continue
        seen.add(stripped)

        block = '\n'.join(lines[i:i + 20])

        flight = {"times": stripped}

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


def search(args):
    children = [int(a) for a in args.children.split(",")] if args.children else []
    url = build_kayak_url(
        args.origin, args.dest, args.depart, args.return_date,
        args.adults, children, args.nonstop, args.sort,
        depart_after=args.depart_after,
    )

    driver = create_driver()

    try:
        print(f"Navigating to: {url}")
        driver.get(url)

        print("Waiting for results to load...")
        time.sleep(15)

        # Wait for Kayak's loading spinner to disappear, then give filters time to apply
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        from selenium.webdriver.common.by import By
        try:
            WebDriverWait(driver, 30).until_not(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='loading'], [class*='spinner'], [class*='progress']"))
            )
        except Exception:
            pass
        time.sleep(5)  # Extra buffer for JS filters to apply after results load

        body_text = driver.find_element("tag name", "body").text
        flights = parse_flights(body_text, depart_after=args.depart_after)

        print(f"\nFound {len(flights)} flight results:\n")
        print(f"{'#':<4} {'Times':<30} {'Airline':<22} {'Stops':<12} {'Duration':<12} {'$/person':<12} {'Total'}")
        print("-" * 105)
        for i, f in enumerate(flights, 1):
            print(
                f"{i:<4} {f.get('times',''):<30} {f.get('airline','?'):<22} "
                f"{f.get('stops','?'):<12} {f.get('duration','?'):<12} "
                f"{f.get('price_per_person','?'):<12} {f.get('price_total','?')}"
            )

        print(f"\nSearch URL: {url}")
        return flights

    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Kayak for flights")
    parser.add_argument("--origin", required=True, help="Origin airport code (e.g., SEA)")
    parser.add_argument("--dest", required=True, help="Destination airport code (e.g., SLC)")
    parser.add_argument("--depart", required=True, help="Departure date (YYYY-MM-DD)")
    parser.add_argument("--return-date", help="Return date (YYYY-MM-DD), omit for one-way")
    parser.add_argument("--adults", type=int, default=1, help="Number of adults")
    parser.add_argument("--children", help="Comma-separated children ages (e.g., 2,9)")
    parser.add_argument("--nonstop", action="store_true", help="Nonstop flights only")
    parser.add_argument("--sort", default="bestflight_a", help="Sort order")
    parser.add_argument("--depart-after", help="Earliest departure time HH:MM (e.g. 12:00)")
    args = parser.parse_args()
    search(args)

"""Search Kayak for flights using Selenium Grid.

Usage:
    python search_kayak.py --origin SEA --dest SLC \
        --depart 2026-05-26 --return 2026-06-02 \
        --adults 2 --children 2,9 \
        --nonstop --sort bestflight_a

Connects to the Selenium Grid at http://192.168.68.168:4444/
"""

import argparse
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def build_kayak_url(origin, dest, depart, return_date, adults, children, nonstop, sort):
    url = f"https://www.kayak.com/flights/{origin}-{dest}/{depart}"
    if return_date:
        url += f"/{return_date}"
    url += f"/{adults}adults"
    if children:
        ages = "-".join(str(a) for a in children)
        url += f"/children-{ages}"
    params = [f"sort={sort}"]
    if nonstop:
        params.append("fs=stops%3D0")
    url += "?" + "&".join(params)
    return url


def search(args):
    children = [int(a) for a in args.children.split(",")] if args.children else []
    url = build_kayak_url(
        args.origin, args.dest, args.depart, args.return_date,
        args.adults, children, args.nonstop, args.sort,
    )

    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")

    driver = webdriver.Remote(
        command_executor="http://192.168.68.168:4444",
        options=options,
    )

    try:
        print(f"Navigating to: {url}")
        driver.get(url)

        # Wait for results to load (Kayak has a progress bar)
        print("Waiting for results...")
        time.sleep(10)  # Kayak's initial search takes a while

        # Wait for flight result cards
        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='resultInner'], [class*='nrc6-inner']"))
        )

        # Extract results
        results = driver.execute_script("""
            const flights = [];
            const cards = document.querySelectorAll('[class*="resultInner"], [class*="nrc6-inner"]');
            cards.forEach((card, i) => {
                if (i >= 10) return;  // Top 10
                const text = card.innerText;
                flights.push(text);
            });
            return flights;
        """)

        print(f"\nFound {len(results)} flight results:\n")
        for i, result in enumerate(results, 1):
            print(f"--- Flight {i} ---")
            print(result)
            print()

        # Take a screenshot for reference
        screenshot_path = f"/tmp/kayak-{args.origin}-{args.dest}-{args.depart}.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        return results

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
    args = parser.parse_args()
    search(args)

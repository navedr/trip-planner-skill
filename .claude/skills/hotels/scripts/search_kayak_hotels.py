"""Search Kayak for hotels using Selenium Grid.

Usage:
    python search_kayak_hotels.py \
        --city "Salt-Lake-City,Utah,United-States" \
        --checkin 2026-05-26 --checkout 2026-06-02 \
        --adults 2 --children 2,9 \
        --sort rank_a

Connects to the Selenium Grid at http://192.168.68.168:4444/
"""

import argparse
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def build_kayak_hotel_url(city, city_id, checkin, checkout, adults, children, sort, map_view):
    city_part = city
    if city_id:
        city_part += f"-c{city_id}"
    url = f"https://www.kayak.com/hotels/{city_part}/{checkin}/{checkout}/{adults}adults"
    if children:
        ages = "-".join(str(a) for a in children)
        url += f"/{len(children)}children-{ages}"
    if map_view:
        url += ";map"
    url += f"?sort={sort}"
    return url


def search(args):
    children = [int(a) for a in args.children.split(",")] if args.children else []
    url = build_kayak_hotel_url(
        args.city, args.city_id, args.checkin, args.checkout,
        args.adults, children, args.sort, args.map,
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

        print("Waiting for results...")
        time.sleep(8)

        WebDriverWait(driver, 30).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='resultInner'], [class*='FLpo']"))
        )

        results = driver.execute_script("""
            const hotels = [];
            const cards = document.querySelectorAll('[class*="resultInner"], [class*="FLpo"]');
            cards.forEach((card, i) => {
                if (i >= 10) return;
                hotels.push(card.innerText);
            });
            return hotels;
        """)

        print(f"\nFound {len(results)} hotel results:\n")
        for i, result in enumerate(results, 1):
            print(f"--- Hotel {i} ---")
            print(result)
            print()

        screenshot_path = f"/tmp/kayak-hotels-{args.checkin}.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        return results

    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Kayak for hotels")
    parser.add_argument("--city", required=True, help="City (e.g., Salt-Lake-City,Utah,United-States)")
    parser.add_argument("--city-id", help="Kayak city ID (e.g., 31915)")
    parser.add_argument("--checkin", required=True, help="Check-in date (YYYY-MM-DD)")
    parser.add_argument("--checkout", required=True, help="Check-out date (YYYY-MM-DD)")
    parser.add_argument("--adults", type=int, default=2, help="Number of adults")
    parser.add_argument("--children", help="Comma-separated children ages (e.g., 2,9)")
    parser.add_argument("--sort", default="rank_a", help="Sort: rank_a, price_a, review_a")
    parser.add_argument("--map", action="store_true", help="Show map view")
    args = parser.parse_args()
    search(args)

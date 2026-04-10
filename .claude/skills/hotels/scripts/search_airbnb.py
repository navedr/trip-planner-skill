"""Search Airbnb for vacation rentals using Selenium Grid.

Usage:
    python search_airbnb.py \
        --neighborhood "Sugar-House" --city "Salt-Lake-City" --state "UT" \
        --checkin 2026-05-26 --checkout 2026-06-02 \
        --adults 2 --children 2 --children-ages 2,9

Connects to the Selenium Grid at http://192.168.68.168:4444/
"""

import argparse
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def build_airbnb_url(neighborhood, city, state, checkin, checkout, adults, children, children_ages):
    location = f"{neighborhood}--{city}--{state}"
    url = f"https://www.airbnb.com/s/{location}/homes?checkin={checkin}&checkout={checkout}&adults={adults}"
    if children:
        url += f"&children={children}"
    if children_ages:
        ages_encoded = "%2C".join(str(a) for a in children_ages)
        url += f"&children_ages={ages_encoded}"
    url += "&flexible_cancellation=true"
    return url


def search(args):
    children_ages = [int(a) for a in args.children_ages.split(",")] if args.children_ages else []
    url = build_airbnb_url(
        args.neighborhood, args.city, args.state,
        args.checkin, args.checkout,
        args.adults, args.children, children_ages,
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
            EC.presence_of_element_located((By.CSS_SELECTOR, "[itemprop='itemListElement'], [data-testid='card-container']"))
        )

        results = driver.execute_script("""
            const listings = [];
            const cards = document.querySelectorAll('[itemprop="itemListElement"], [data-testid="card-container"]');
            cards.forEach((card, i) => {
                if (i >= 10) return;
                listings.push(card.innerText);
            });
            return listings;
        """)

        print(f"\nFound {len(results)} Airbnb listings:\n")
        for i, result in enumerate(results, 1):
            print(f"--- Listing {i} ---")
            print(result)
            print()

        screenshot_path = f"/tmp/airbnb-{args.neighborhood}-{args.checkin}.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        return results

    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Airbnb for vacation rentals")
    parser.add_argument("--neighborhood", required=True, help="Neighborhood (e.g., Sugar-House)")
    parser.add_argument("--city", required=True, help="City (e.g., Salt-Lake-City)")
    parser.add_argument("--state", required=True, help="State/Country (e.g., UT)")
    parser.add_argument("--checkin", required=True, help="Check-in date (YYYY-MM-DD)")
    parser.add_argument("--checkout", required=True, help="Check-out date (YYYY-MM-DD)")
    parser.add_argument("--adults", type=int, default=2, help="Number of adults")
    parser.add_argument("--children", type=int, default=0, help="Number of children")
    parser.add_argument("--children-ages", help="Comma-separated children ages (e.g., 2,9)")
    args = parser.parse_args()
    search(args)

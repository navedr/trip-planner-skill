"""Search TripAdvisor for restaurants using Selenium Grid.

Usage:
    python search_tripadvisor.py --destination "Salt Lake City" --cuisine "Indian"

Connects to the Selenium Grid at http://192.168.68.168:4444/
"""

import argparse
import time
import urllib.parse

from selenium import webdriver
from selenium.webdriver.common.by import By


def search(args):
    query = f"{args.destination} restaurants"
    if args.cuisine:
        query += f" {args.cuisine}"

    url = f"https://www.tripadvisor.com/Search?q={urllib.parse.quote(query)}"

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

        # Handle cookie consent
        time.sleep(3)
        try:
            accept_btn = driver.find_element(By.CSS_SELECTOR, "#onetrust-accept-btn-handler")
            accept_btn.click()
            time.sleep(1)
        except Exception:
            pass  # No cookie banner

        print("Waiting for results...")
        time.sleep(5)

        results = driver.execute_script("""
            const restaurants = [];
            const cards = document.querySelectorAll('[data-test-target="restaurants-list"] > div, .result-card, .search-results-list .result');
            cards.forEach((card, i) => {
                if (i >= 10) return;
                restaurants.push(card.innerText);
            });
            // Fallback: grab any result-like containers
            if (restaurants.length === 0) {
                const fallback = document.querySelectorAll('.search-results-list li, [class*="result"]');
                fallback.forEach((el, i) => {
                    if (i >= 10) return;
                    const text = el.innerText.trim();
                    if (text.length > 20) restaurants.push(text);
                });
            }
            return restaurants;
        """)

        print(f"\nFound {len(results)} restaurant results:\n")
        for i, result in enumerate(results, 1):
            print(f"--- Restaurant {i} ---")
            print(result)
            print()

        screenshot_path = f"/tmp/tripadvisor-restaurants-{args.destination.replace(' ', '-')}.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        return results

    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search TripAdvisor for restaurants")
    parser.add_argument("--destination", required=True, help="City/destination")
    parser.add_argument("--cuisine", help="Cuisine type (e.g., Indian, Thai, Mexican)")
    args = parser.parse_args()
    search(args)

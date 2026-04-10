"""Search Yelp for restaurants using Selenium Grid.

Usage:
    python search_yelp.py --destination "Salt Lake City, UT" --cuisine "Indian" --sort rating
    python search_yelp.py --destination "Salt Lake City, UT" --family-friendly --sort rating

Connects to the Selenium Grid at http://192.168.68.168:4444/
"""

import argparse
import time
import urllib.parse

from selenium import webdriver


def build_yelp_url(destination, cuisine, sort, family_friendly, price):
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
    if price:
        url += f"&l={price}"

    return url


def search(args):
    url = build_yelp_url(
        args.destination, args.cuisine, args.sort,
        args.family_friendly, args.price,
    )

    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    driver = webdriver.Remote(
        command_executor="http://192.168.68.168:4444",
        options=options,
    )

    try:
        print(f"Navigating to: {url}")
        driver.get(url)
        time.sleep(8)
        print(f"Title: {driver.title}")

        results = driver.execute_script("""
            const restaurants = [];
            const items = document.querySelectorAll(
                '[data-testid="serp-ia-card"], li[class*="border"], [class*="searchResult"]'
            );
            items.forEach((item, i) => {
                if (i < 15) {
                    const text = item.innerText.trim();
                    if (text.length > 30) {
                        restaurants.push(text.substring(0, 500));
                    }
                }
            });
            if (restaurants.length === 0) {
                restaurants.push(document.body.innerText.substring(0, 4000));
            }
            return restaurants;
        """)

        print(f"\nFound {len(results)} results:\n")
        for i, r in enumerate(results, 1):
            print(f"--- Restaurant {i} ---")
            print(r)
            print()

        screenshot_path = f"/tmp/yelp-{args.destination.replace(' ', '-').replace(',', '')}.png"
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")

        return results

    finally:
        driver.quit()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Search Yelp for restaurants")
    parser.add_argument("--destination", required=True, help="City, State (e.g., 'Salt Lake City, UT')")
    parser.add_argument("--cuisine", help="Cuisine type (e.g., Indian, Thai, Mexican)")
    parser.add_argument("--sort", default="rating", choices=["rating", "review_count", "recommended"])
    parser.add_argument("--family-friendly", action="store_true", help="Filter for kid-friendly restaurants")
    parser.add_argument("--price", type=int, choices=[1, 2, 3, 4], help="Price level (1=$, 2=$$, 3=$$$, 4=$$$$)")
    args = parser.parse_args()
    search(args)

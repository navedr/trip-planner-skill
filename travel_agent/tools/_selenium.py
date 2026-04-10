"""Shared Selenium WebDriver factory for remote grid connections."""

from selenium import webdriver


DEFAULT_GRID_URL = "http://192.168.68.168:4444"


def create_driver(grid_url: str = DEFAULT_GRID_URL) -> webdriver.Remote:
    """Create a Chrome Remote WebDriver configured to avoid bot detection."""
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    return webdriver.Remote(command_executor=grid_url, options=options)

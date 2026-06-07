"""Shared Selenium WebDriver factory for skill scripts."""

import os
import urllib.parse

from selenium import webdriver
from selenium.webdriver.remote.client_config import ClientConfig


DEFAULT_GRID_URL = os.environ.get("SELENIUM_GRID_URL", "http://192.168.68.168:4444").strip()


def _prepare_grid_url(grid_url: str):
    """Extract (clean_url, username, password) and upgrade http→https for non-local hosts."""
    parsed = urllib.parse.urlparse(grid_url)
    hostname = parsed.hostname or ""
    is_local = (
        hostname in ("localhost", "127.0.0.1")
        or hostname.startswith("192.168.")
        or hostname.startswith("10.")
        or hostname.startswith("172.")
    )
    scheme = "https" if parsed.scheme == "http" and not is_local else parsed.scheme
    netloc = hostname
    if parsed.port:
        netloc += f":{parsed.port}"
    clean = urllib.parse.urlunparse(parsed._replace(scheme=scheme, netloc=netloc))
    username = parsed.username
    password = urllib.parse.unquote(parsed.password or "") if parsed.password else None
    return clean, username, password


def create_driver(grid_url: str = DEFAULT_GRID_URL) -> webdriver.Remote:
    """Create a Chrome Remote WebDriver configured to avoid bot detection."""
    options = webdriver.ChromeOptions()
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--window-size=1920,1080")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])

    clean_url, username, password = _prepare_grid_url(grid_url)
    if username:
        client_config = ClientConfig(
            remote_server_addr=clean_url,
            username=username,
            password=password,
        )
        return webdriver.Remote(command_executor=clean_url, options=options, client_config=client_config)
    return webdriver.Remote(command_executor=clean_url, options=options)

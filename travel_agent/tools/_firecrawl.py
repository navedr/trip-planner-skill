"""Shared Firecrawl client factory for cloud-based scraping."""

from __future__ import annotations

import os

from firecrawl import Firecrawl


_client: Firecrawl | None = None


def get_firecrawl_client() -> Firecrawl:
    """Return a cached Firecrawl client built from FIRECRAWL_API_KEY."""
    global _client
    if _client is None:
        api_key = os.environ.get("FIRECRAWL_API_KEY", "")
        if not api_key:
            raise ValueError("FIRECRAWL_API_KEY is not set")
        _client = Firecrawl(api_key=api_key)
    return _client


def scrape_url(url: str, wait_for_ms: int = 5000) -> str:
    """Scrape a URL with JS rendering, returning markdown (or empty string)."""
    client = get_firecrawl_client()
    result = client.scrape(url, formats=["markdown"], wait_for=wait_for_ms)
    markdown = getattr(result, "markdown", None)
    return markdown or ""

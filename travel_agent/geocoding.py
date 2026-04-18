"""Geocoding via Google Geocoding API — async and sync versions."""

from __future__ import annotations

import logging

import httpx

logger = logging.getLogger(__name__)

_GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


async def geocode_address(address: str, api_key: str) -> tuple[float, float] | None:
    """Geocode an address string to (lat, lng) using Google Geocoding API.

    Returns None if no results or on error.
    """
    if not address or not api_key:
        return None

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                _GEOCODE_URL, params={"address": address, "key": api_key}
            )
            resp.raise_for_status()
            data = resp.json()

        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return (loc["lat"], loc["lng"])

        logger.debug("Geocode returned status=%s for %r", data.get("status"), address)
        return None
    except Exception:
        logger.warning("Geocode failed for %r", address, exc_info=True)
        return None


def geocode_address_sync(address: str, api_key: str) -> tuple[float, float] | None:
    """Synchronous version for use in agent tool execution threads."""
    if not address or not api_key:
        return None

    try:
        with httpx.Client(timeout=10) as client:
            resp = client.get(
                _GEOCODE_URL, params={"address": address, "key": api_key}
            )
            resp.raise_for_status()
            data = resp.json()

        if data.get("status") == "OK" and data.get("results"):
            loc = data["results"][0]["geometry"]["location"]
            return (loc["lat"], loc["lng"])

        logger.debug("Geocode returned status=%s for %r", data.get("status"), address)
        return None
    except Exception:
        logger.warning("Geocode failed for %r", address, exc_info=True)
        return None


def extract_address(data: dict, destination: str | None = None) -> str | None:
    """Extract the best geocodable address string from an item's data_json.

    Always folds in the trip destination when available — "Downtown" alone is
    ambiguous to a geocoder (it picks the biggest matching city); prefixing
    the name and appending the destination pins it to the right region.
    """
    name = data.get("name")

    for field in ("address", "location", "neighborhood"):
        val = data.get(field)
        if val and isinstance(val, str):
            parts = []
            if name:
                parts.append(name)
            parts.append(val)
            if destination and destination.lower() not in val.lower():
                parts.append(destination)
            return ", ".join(parts)

    if name and destination:
        return f"{name}, {destination}"

    return name or None

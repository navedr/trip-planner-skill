"""Weather forecast via Open-Meteo (free, no API key).

Provides shared helpers (geocode, fetch forecast, WMO mapping) used by both
the FastAPI router (`travel_agent/api/weather.py`) and the agent tool.
"""

from __future__ import annotations

import json
import ssl
import sys
import time
import urllib.parse
import urllib.request
from typing import Any

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
MAX_FORECAST_DAYS = 16


def _ssl_context() -> ssl.SSLContext:
    """Build an SSL context using certifi when available (macOS Python often lacks system CA access)."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


_SSL_CTX = _ssl_context()

WMO: dict[int, tuple[str, str]] = {
    0: ("Clear", "☀️"), 1: ("Mainly clear", "🌤️"), 2: ("Partly cloudy", "⛅"), 3: ("Overcast", "☁️"),
    45: ("Fog", "🌫️"), 48: ("Rime fog", "🌫️"),
    51: ("Light drizzle", "🌦️"), 53: ("Drizzle", "🌦️"), 55: ("Dense drizzle", "🌦️"),
    61: ("Light rain", "🌧️"), 63: ("Rain", "🌧️"), 65: ("Heavy rain", "🌧️"),
    71: ("Light snow", "🌨️"), 73: ("Snow", "🌨️"), 75: ("Heavy snow", "❄️"), 77: ("Snow grains", "🌨️"),
    80: ("Rain showers", "🌦️"), 81: ("Rain showers", "🌦️"), 82: ("Violent showers", "⛈️"),
    85: ("Snow showers", "🌨️"), 86: ("Snow showers", "🌨️"),
    95: ("Thunderstorm", "⛈️"), 96: ("Thunderstorm w/ hail", "⛈️"), 99: ("Thunderstorm w/ hail", "⛈️"),
}

# Module-level cache: key -> (expires_at_epoch, forecast_list)
_CACHE: dict[str, tuple[float, list[dict]]] = {}
_TTL_SECONDS = 3600.0


def _http_get_json(url: str, timeout: float = 10.0) -> Any:
    req = urllib.request.Request(url, headers={"User-Agent": "travel-planner/1.0"})
    with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CTX) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _geocode(destination: str) -> tuple[float, float] | None:
    """Return (lat, lng) for destination, or None on miss/error."""
    try:
        qs = urllib.parse.urlencode({"name": destination, "count": 1})
        data = _http_get_json(f"{GEOCODE_URL}?{qs}")
        results = data.get("results") or []
        if not results:
            return None
        r = results[0]
        return float(r["latitude"]), float(r["longitude"])
    except Exception as exc:
        print(f"[weather] geocode failed for {destination!r}: {exc}", file=sys.stderr)
        return None


def _within_forecast_window(start_date: str) -> bool:
    """Open-Meteo supports up to ~16 days ahead. Return False if start is too far."""
    try:
        from datetime import date
        start = date.fromisoformat(start_date)
        delta = (start - date.today()).days
        return delta <= MAX_FORECAST_DAYS
    except Exception:
        return False


def _fmt_time(iso: str | None) -> str:
    """Open-Meteo returns sunrise/sunset as ISO like '2026-05-26T06:05'. Return HH:MM."""
    if not iso:
        return ""
    try:
        return iso.split("T", 1)[1][:5]
    except Exception:
        return ""


def fetch_forecast(destination: str, start_date: str, end_date: str) -> list[dict]:
    """Return per-day forecast between start_date and end_date (inclusive).

    Returns [] on any failure (geocode miss, out-of-window, HTTP/parse error).
    Results cached in-memory for 1 hour.
    """
    cache_key = f"{destination.lower()}|{start_date}|{end_date}"
    now = time.time()
    cached = _CACHE.get(cache_key)
    if cached and cached[0] > now:
        return cached[1]

    if not _within_forecast_window(start_date):
        _CACHE[cache_key] = (now + _TTL_SECONDS, [])
        return []

    coords = _geocode(destination)
    if not coords:
        _CACHE[cache_key] = (now + _TTL_SECONDS, [])
        return []

    lat, lng = coords
    try:
        qs = urllib.parse.urlencode({
            "latitude": lat,
            "longitude": lng,
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset",
            "timezone": "auto",
            "temperature_unit": "fahrenheit",
            "wind_speed_unit": "mph",
            "precipitation_unit": "inch",
            "start_date": start_date,
            "end_date": end_date,
        })
        data = _http_get_json(f"{FORECAST_URL}?{qs}")
    except Exception as exc:
        print(f"[weather] forecast fetch failed for {destination!r}: {exc}", file=sys.stderr)
        return []

    daily = data.get("daily") or {}
    dates = daily.get("time") or []
    if not dates:
        return []

    out: list[dict] = []
    codes = daily.get("weather_code") or []
    highs = daily.get("temperature_2m_max") or []
    lows = daily.get("temperature_2m_min") or []
    precs = daily.get("precipitation_sum") or []
    winds = daily.get("wind_speed_10m_max") or []
    sunrises = daily.get("sunrise") or []
    sunsets = daily.get("sunset") or []

    for i, d in enumerate(dates):
        code = int(codes[i]) if i < len(codes) and codes[i] is not None else -1
        label, emoji = WMO.get(code, ("Unknown", "❓"))
        out.append({
            "date": d,
            "temp_high_f": float(highs[i]) if i < len(highs) and highs[i] is not None else 0.0,
            "temp_low_f": float(lows[i]) if i < len(lows) and lows[i] is not None else 0.0,
            "condition_code": code,
            "condition_label": label,
            "condition_emoji": emoji,
            "precipitation_in": float(precs[i]) if i < len(precs) and precs[i] is not None else 0.0,
            "wind_mph": float(winds[i]) if i < len(winds) and winds[i] is not None else 0.0,
            "sunrise": _fmt_time(sunrises[i] if i < len(sunrises) else None),
            "sunset": _fmt_time(sunsets[i] if i < len(sunsets) else None),
        })

    _CACHE[cache_key] = (now + _TTL_SECONDS, out)
    return out


def get_forecast(destination: str, start_date: str, end_date: str) -> dict:
    """Agent-facing wrapper. Returns {"forecast": [...], "destination": str, "count": int}."""
    forecast = fetch_forecast(destination, start_date, end_date)
    return {
        "forecast": forecast,
        "destination": destination,
        "count": len(forecast),
    }

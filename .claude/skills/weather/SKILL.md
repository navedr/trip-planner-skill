---
name: weather-forecast
description: "Look up per-day weather for a destination during trip dates. Use for 'weather in X' or 'what will it be like in SLC in May'."
metadata:
  author: narangwa
  version: "0.1.0"
---

# Weather Forecast

Fetch per-day weather for a destination and date range via Open-Meteo (free, no API key required).

## When to Use

Activate when the user asks about weather, temperature, rain, snow, or climate for a destination — either standalone ("weather in Salt Lake City next week") or as part of an active trip plan.

## Workflow

1. **Gather inputs** — destination (city name) and date range (start/end, YYYY-MM-DD). If a plan is active, read `dates.depart` and `dates.return` from `trip-data.json`.
2. **Call `get_weather_forecast`** with `destination`, `start_date`, `end_date`. The tool geocodes the destination and fetches Open-Meteo's daily forecast (weather code, temp highs/lows in °C, precipitation in mm, wind kph, sunrise/sunset).
3. **Present as a markdown table** — one row per day: Date, Condition (emoji + label), High/Low, Precip, Wind, Sunrise/Sunset.
4. **Note the 16-day limit** — Open-Meteo only forecasts ~16 days ahead. If the trip is farther out, the tool returns an empty forecast; tell the user to check back closer to the trip.
5. **Do not persist** — weather is not written to `trip-data.json`; the UI fetches it on demand via `GET /api/trips/:id/weather`.

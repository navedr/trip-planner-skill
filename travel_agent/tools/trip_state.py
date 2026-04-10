"""Trip state management — pure file operations, no Selenium."""

from __future__ import annotations

import json
import os
import re
from pathlib import Path


def _slugify(destination: str, depart: str) -> str:
    """Turn 'Salt Lake City' + '2026-05-26' into 'slc-may-2026'."""
    # Build abbreviation from first letters of each word
    words = destination.strip().split()
    if len(words) > 1:
        abbr = "".join(w[0].lower() for w in words)
    else:
        abbr = destination.strip().lower()[:6]

    # Extract month and year from depart date (YYYY-MM-DD)
    parts = depart.split("-")
    months = [
        "", "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec",
    ]
    month = months[int(parts[1])] if len(parts) >= 2 else "trip"
    year = parts[0] if len(parts) >= 1 else ""

    slug = f"{abbr}-{month}-{year}"
    # Clean any non-alphanumeric chars (except hyphens)
    slug = re.sub(r"[^a-z0-9-]", "", slug)
    return slug


def create_trip(
    destination: str,
    origin: str,
    dates: dict,
    travelers: dict,
    preferences: dict,
    plans_dir: str = "./plans",
) -> str:
    """Create plan folder + trip-data.json. Returns the plan directory path."""
    depart = dates.get("depart", "")
    # Ensure duration_days exists
    if "duration_days" not in dates and depart and dates.get("return"):
        try:
            from datetime import datetime
            d1 = datetime.strptime(depart, "%Y-%m-%d")
            d2 = datetime.strptime(dates["return"], "%Y-%m-%d")
            dates["duration_days"] = (d2 - d1).days + 1
        except (ValueError, TypeError):
            pass
    slug = _slugify(destination, depart)
    plan_dir = os.path.join(plans_dir, slug)
    trip_path = os.path.join(plan_dir, "trip-data.json")

    # Don't overwrite an existing plan
    if os.path.exists(trip_path):
        return plan_dir

    os.makedirs(plan_dir, exist_ok=True)

    trip_data = {
        "destination": destination,
        "origin": origin,
        "dates": dates,
        "travelers": travelers,
        "preferences": preferences,
        "flights": {
            "search_url": None,
            "outbound": [],
            "return": [],
            "selected": None,
        },
        "hotels": {
            "search_url": None,
            "options": [],
            "selected": None,
        },
        "restaurants": {
            "search_url": None,
            "options": [],
            "selected": [],
        },
        "attractions": {
            "search_url": None,
            "options": [],
            "selected": [],
        },
        "itinerary": [],
    }

    trip_path = os.path.join(plan_dir, "trip-data.json")
    with open(trip_path, "w") as f:
        json.dump(trip_data, f, indent=2)

    return plan_dir


def load_trip(plan_dir: str) -> dict:
    """Read trip-data.json from a plan directory."""
    trip_path = os.path.join(plan_dir, "trip-data.json")
    with open(trip_path) as f:
        return json.load(f)


def save_trip(plan_dir: str, data: dict) -> None:
    """Write trip-data.json to a plan directory."""
    trip_path = os.path.join(plan_dir, "trip-data.json")
    with open(trip_path, "w") as f:
        json.dump(data, f, indent=2)


def update_section(plan_dir: str, section: str, data) -> None:
    """Update a specific section of trip-data.json using dot notation.

    Examples:
        update_section(dir, 'flights.selected', {...})
        update_section(dir, 'hotels.options', [...])
        update_section(dir, 'itinerary', [...])
    """
    trip = load_trip(plan_dir)
    keys = section.split(".")
    target = trip
    for key in keys[:-1]:
        target = target[key]
    target[keys[-1]] = data
    save_trip(plan_dir, trip)


def list_plans(plans_dir: str = "./plans") -> list[dict]:
    """List all plan directories with basic info (destination, dates)."""
    plans = []
    plans_path = Path(plans_dir)
    if not plans_path.exists():
        return plans

    for entry in sorted(plans_path.iterdir()):
        if not entry.is_dir():
            continue
        trip_file = entry / "trip-data.json"
        if not trip_file.exists():
            continue
        try:
            with open(trip_file) as f:
                data = json.load(f)
            plans.append({
                "slug": entry.name,
                "path": str(entry),
                "destination": data.get("destination"),
                "dates": data.get("dates"),
                "travelers": data.get("travelers"),
            })
        except (json.JSONDecodeError, KeyError):
            plans.append({"slug": entry.name, "path": str(entry), "error": "invalid trip-data.json"})

    return plans


def finalize_selection(plan_dir: str, category: str, selected_data: dict) -> None:
    """Set selected, clear options arrays, add status: booked.

    Example:
        finalize_selection(dir, 'flights', {
            'outbound': {...}, 'return': {...}, 'total_price': 668
        })
        # Sets flights.selected = selected_data + status: booked
        # Clears flights.outbound = [], flights.return = []
    """
    trip = load_trip(plan_dir)
    section = trip.get(category, {})

    selected_data["status"] = "booked"
    section["selected"] = selected_data

    # Clear options/search result arrays
    for key in list(section.keys()):
        if key in ("selected", "search_url"):
            continue
        if isinstance(section[key], list):
            section[key] = []

    trip[category] = section
    save_trip(plan_dir, trip)

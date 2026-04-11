"""SQLite-backed trip storage — same interface as trip_state.py filesystem functions."""

from __future__ import annotations

import json
import logging
import os
import re
import uuid
from datetime import datetime, date

from sqlalchemy.orm import Session

from travel_agent.db.models import Trip, TripItem, ItineraryDay
from travel_agent.geocoding import geocode_address_sync, extract_address

logger = logging.getLogger(__name__)


def _slugify(destination: str, depart: str) -> str:
    """Turn 'Salt Lake City' + '2026-05-26' into 'slc-may-2026'."""
    words = destination.strip().split()
    if len(words) > 1:
        abbr = "".join(w[0].lower() for w in words)
    else:
        abbr = destination.strip().lower()[:6]

    parts = depart.split("-")
    months = [
        "", "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec",
    ]
    month = months[int(parts[1])] if len(parts) >= 2 else "trip"
    year = parts[0] if len(parts) >= 1 else ""

    slug = f"{abbr}-{month}-{year}"
    return re.sub(r"[^a-z0-9-]", "", slug)


class SQLiteTripStorage:
    """Drop-in replacement for trip_state.py functions, backed by SQLite.

    Instantiated per-request with a DB session and the authenticated user ID.
    The `plan_dir` parameter in the interface maps to `trip.id` (UUID string).
    """

    def __init__(self, db: Session, user_id: str):
        self.db = db
        self.user_id = user_id

    # ----- create_trip -----

    def create_trip(
        self,
        destination: str,
        origin: str,
        dates: dict,
        travelers: dict,
        preferences: dict,
        plans_dir: str = "./plans",  # ignored, kept for interface compat
    ) -> str:
        depart = dates.get("depart", "")
        ret = dates.get("return", "")

        # Compute duration_days if not present
        if "duration_days" not in dates and depart and ret:
            try:
                d1 = datetime.strptime(depart, "%Y-%m-%d")
                d2 = datetime.strptime(ret, "%Y-%m-%d")
                dates["duration_days"] = (d2 - d1).days + 1
            except (ValueError, TypeError):
                pass

        slug = _slugify(destination, depart)

        # Check for existing trip with same slug for this user
        existing = (
            self.db.query(Trip)
            .filter(Trip.user_id == self.user_id, Trip.slug == slug)
            .first()
        )
        if existing:
            return existing.id

        trip = Trip(
            id=str(uuid.uuid4()),
            user_id=self.user_id,
            slug=slug,
            destination=destination,
            origin=origin,
            depart_date=date.fromisoformat(depart) if depart else None,
            return_date=date.fromisoformat(ret) if ret else None,
            duration_days=dates.get("duration_days"),
            travelers_json=json.dumps(travelers),
            preferences_json=json.dumps(preferences),
            status="planning",
        )
        self.db.add(trip)
        self.db.commit()
        self.db.refresh(trip)
        return trip.id

    # ----- load_trip -----

    def load_trip(self, plan_dir: str) -> dict:
        """Load trip as a dict matching trip-data.json structure."""
        trip = self._get_trip(plan_dir)
        items = self.db.query(TripItem).filter(TripItem.trip_id == trip.id).all()
        itin_days = (
            self.db.query(ItineraryDay)
            .filter(ItineraryDay.trip_id == trip.id)
            .order_by(ItineraryDay.day_number)
            .all()
        )

        # Group items by category
        flights_outbound = []
        flights_return = []
        flights_selected = None
        hotels_options = []
        hotels_selected = None
        restaurants = []
        attractions = []

        for item in items:
            data = json.loads(item.data_json) if item.data_json else {}
            if item.category == "flight":
                direction = data.pop("_direction", "outbound")
                if item.is_selected:
                    if flights_selected is None:
                        flights_selected = {}
                    flights_selected[direction] = data
                elif direction == "return":
                    flights_return.append(data)
                else:
                    flights_outbound.append(data)
            elif item.category == "hotel":
                if item.is_selected:
                    hotels_selected = data
                else:
                    hotels_options.append(data)
            elif item.category == "restaurant":
                restaurants.append(data)
            elif item.category == "attraction":
                attractions.append(data)

        # Build itinerary
        itinerary = []
        for day in itin_days:
            itinerary.append({
                "date": day.date.isoformat() if day.date else None,
                "theme": day.theme or "",
                "subtitle": day.subtitle,
                "is_flight_day": day.is_flight_day,
                "activities": json.loads(day.activities_json) if day.activities_json else [],
            })

        return {
            "destination": trip.destination,
            "origin": trip.origin,
            "dates": {
                "depart": trip.depart_date.isoformat() if trip.depart_date else "",
                "return": trip.return_date.isoformat() if trip.return_date else "",
                "duration_days": trip.duration_days or 0,
            },
            "travelers": json.loads(trip.travelers_json) if trip.travelers_json else {},
            "preferences": json.loads(trip.preferences_json) if trip.preferences_json else {},
            "flights": {
                "search_url": None,
                "outbound": flights_outbound,
                "return": flights_return,
                "selected": flights_selected,
            },
            "hotels": {
                "search_url": None,
                "options": hotels_options,
                "selected": hotels_selected,
            },
            "restaurants": restaurants,
            "attractions": attractions,
            "itinerary": itinerary,
        }

    # ----- save_trip -----

    def save_trip(self, plan_dir: str, data: dict) -> None:
        """Full overwrite — rebuild trip + items from data dict."""
        trip = self._get_trip(plan_dir)

        # Update trip metadata
        trip.destination = data.get("destination", trip.destination)
        trip.origin = data.get("origin", trip.origin)
        dates = data.get("dates", {})
        if dates.get("depart"):
            trip.depart_date = date.fromisoformat(dates["depart"])
        if dates.get("return"):
            trip.return_date = date.fromisoformat(dates["return"])
        trip.duration_days = dates.get("duration_days", trip.duration_days)
        if "travelers" in data:
            trip.travelers_json = json.dumps(data["travelers"])
        if "preferences" in data:
            trip.preferences_json = json.dumps(data["preferences"])

        # Clear existing items and rebuild
        self.db.query(TripItem).filter(TripItem.trip_id == trip.id).delete()
        self.db.query(ItineraryDay).filter(ItineraryDay.trip_id == trip.id).delete()

        self._insert_items_from_data(trip.id, data)
        self._insert_itinerary_from_data(trip.id, data)

        self.db.commit()

    # ----- update_section -----

    def update_section(self, plan_dir: str, section: str, data) -> None:
        """Partial update using dot notation, e.g. 'flights.outbound', 'hotels.options'."""
        # Geocode items that lack coordinates
        api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
        if api_key and isinstance(data, list):
            trip = self._get_trip(plan_dir)
            for item in data:
                if isinstance(item, dict) and not (item.get("latitude") and item.get("longitude")):
                    address = extract_address(item, trip.destination)
                    if address:
                        coords = geocode_address_sync(address, api_key)
                        if coords:
                            item["latitude"] = coords[0]
                            item["longitude"] = coords[1]

        # Load, patch, save — simple and correct
        trip_data = self.load_trip(plan_dir)
        keys = section.split(".")
        target = trip_data
        for key in keys[:-1]:
            target = target[key]
        target[keys[-1]] = data
        self.save_trip(plan_dir, trip_data)

    # ----- list_plans -----

    def list_plans(self, plans_dir: str = "./plans") -> list[dict]:
        """List all trips for this user."""
        trips = (
            self.db.query(Trip)
            .filter(Trip.user_id == self.user_id)
            .order_by(Trip.created_at)
            .all()
        )
        return [
            {
                "slug": t.slug,
                "path": t.id,  # trip ID replaces filesystem path
                "destination": t.destination,
                "dates": {
                    "depart": t.depart_date.isoformat() if t.depart_date else "",
                    "return": t.return_date.isoformat() if t.return_date else "",
                    "duration_days": t.duration_days or 0,
                },
                "travelers": json.loads(t.travelers_json) if t.travelers_json else {},
            }
            for t in trips
        ]

    # ----- finalize_selection -----

    def finalize_selection(self, plan_dir: str, category: str, selected_data: dict) -> None:
        trip = self._get_trip(plan_dir)

        # Normalize plural category names to singular DB category
        # finalize_selection receives "flights", "hotels" etc. (matching trip-data.json keys)
        # but TripItems use singular: "flight", "hotel", "restaurant", "attraction"
        db_category = category.rstrip("s") if category.endswith("s") else category

        # Delete all non-selected items in this category
        self.db.query(TripItem).filter(
            TripItem.trip_id == trip.id,
            TripItem.category == db_category,
            TripItem.is_selected == False,  # noqa: E712
        ).delete()

        # Also remove any previously selected items (replacing selection)
        self.db.query(TripItem).filter(
            TripItem.trip_id == trip.id,
            TripItem.category == db_category,
            TripItem.is_selected == True,  # noqa: E712
        ).delete()

        # Insert new selected items
        selected_data["status"] = "booked"

        if db_category == "flight":
            for direction in ("outbound", "return"):
                if direction in selected_data:
                    item_data = selected_data[direction].copy()
                    item_data["_direction"] = direction
                    self.db.add(TripItem(
                        trip_id=trip.id,
                        category="flight",
                        data_json=json.dumps(item_data, default=str),
                        is_selected=True,
                        source_url=item_data.get("booking_url"),
                    ))
        else:
            self.db.add(TripItem(
                trip_id=trip.id,
                category=db_category,
                data_json=json.dumps(selected_data, default=str),
                is_selected=True,
                source_url=selected_data.get("booking_url") or selected_data.get("tripadvisor_url"),
            ))

        self.db.commit()

    # ----- internal helpers -----

    def _get_trip(self, plan_dir: str) -> Trip:
        """Resolve plan_dir (which is a trip ID in SQLite mode) to a Trip."""
        trip = (
            self.db.query(Trip)
            .filter(Trip.id == plan_dir, Trip.user_id == self.user_id)
            .first()
        )
        if not trip:
            # Also try matching by slug
            trip = (
                self.db.query(Trip)
                .filter(Trip.slug == plan_dir, Trip.user_id == self.user_id)
                .first()
            )
        if not trip:
            raise ValueError(f"Trip not found: {plan_dir}")
        return trip

    def _insert_items_from_data(self, trip_id: str, data: dict) -> None:
        """Insert TripItems from a trip-data.json-shaped dict."""
        flights = data.get("flights", {})
        for fl in flights.get("outbound", []):
            fl_copy = fl.copy()
            fl_copy["_direction"] = "outbound"
            self.db.add(TripItem(
                trip_id=trip_id, category="flight",
                data_json=json.dumps(fl_copy, default=str),
                source_url=fl.get("booking_url"),
            ))
        for fl in flights.get("return", []):
            fl_copy = fl.copy()
            fl_copy["_direction"] = "return"
            self.db.add(TripItem(
                trip_id=trip_id, category="flight",
                data_json=json.dumps(fl_copy, default=str),
                source_url=fl.get("booking_url"),
            ))
        if flights.get("selected"):
            sel = flights["selected"]
            for direction in ("outbound", "return"):
                if direction in sel:
                    fl_copy = sel[direction].copy()
                    fl_copy["_direction"] = direction
                    self.db.add(TripItem(
                        trip_id=trip_id, category="flight",
                        data_json=json.dumps(fl_copy, default=str),
                        is_selected=True,
                        source_url=fl_copy.get("booking_url"),
                    ))

        hotels = data.get("hotels", {})
        for h in hotels.get("options", []):
            self.db.add(TripItem(
                trip_id=trip_id, category="hotel",
                data_json=json.dumps(h, default=str),
                source_url=next(iter((h.get("booking_urls") or {}).values()), None),
            ))
        if hotels.get("selected"):
            self.db.add(TripItem(
                trip_id=trip_id, category="hotel",
                data_json=json.dumps(hotels["selected"], default=str),
                is_selected=True,
            ))

        for r in data.get("restaurants", []):
            self.db.add(TripItem(
                trip_id=trip_id, category="restaurant",
                data_json=json.dumps(r, default=str),
                source_url=r.get("tripadvisor_url") or r.get("yelp_url"),
            ))

        for a in data.get("attractions", []):
            self.db.add(TripItem(
                trip_id=trip_id, category="attraction",
                data_json=json.dumps(a, default=str),
                source_url=a.get("tripadvisor_url"),
            ))

    def _insert_itinerary_from_data(self, trip_id: str, data: dict) -> None:
        """Insert ItineraryDay rows from trip data."""
        itinerary = data.get("itinerary", [])
        if isinstance(itinerary, dict):
            # Handle keyed format: {"day1": {...}, "day2": {...}}
            sorted_keys = sorted(itinerary.keys(), key=lambda k: int(re.sub(r"\D", "", k) or 0))
            itinerary = [itinerary[k] for k in sorted_keys]

        for i, day in enumerate(itinerary):
            day_date = None
            if day.get("date"):
                try:
                    day_date = date.fromisoformat(day["date"])
                except (ValueError, TypeError):
                    pass

            self.db.add(ItineraryDay(
                trip_id=trip_id,
                day_number=i + 1,
                date=day_date,
                theme=day.get("theme", ""),
                subtitle=day.get("subtitle"),
                activities_json=json.dumps(day.get("activities", []), default=str),
                is_flight_day=day.get("is_flight_day", False),
            ))

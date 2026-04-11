"""Reusable CRUD operations for trips, items, itinerary, and chat messages."""

from __future__ import annotations

import json
import uuid
from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from travel_agent.db.models import Trip, TripItem, ItineraryDay, ChatMessage


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------


def create_trip(
    db: Session,
    user_id: str,
    destination: str,
    origin: str,
    slug: str,
    depart_date: date | None = None,
    return_date: date | None = None,
    duration_days: int | None = None,
    travelers: dict | None = None,
    preferences: dict | None = None,
) -> Trip:
    trip = Trip(
        id=str(uuid.uuid4()),
        user_id=user_id,
        slug=slug,
        destination=destination,
        origin=origin,
        depart_date=depart_date,
        return_date=return_date,
        duration_days=duration_days,
        travelers_json=json.dumps(travelers) if travelers else None,
        preferences_json=json.dumps(preferences) if preferences else None,
        status="planning",
    )
    db.add(trip)
    db.commit()
    db.refresh(trip)
    return trip


def get_trips(db: Session, user_id: str) -> list[dict]:
    """List user's trips with item counts per category."""
    trips = (
        db.query(Trip)
        .filter(Trip.user_id == user_id)
        .order_by(Trip.updated_at.desc())
        .all()
    )
    result = []
    for t in trips:
        # Count items by category
        counts = (
            db.query(TripItem.category, func.count(TripItem.id))
            .filter(TripItem.trip_id == t.id)
            .group_by(TripItem.category)
            .all()
        )
        item_counts = {cat: cnt for cat, cnt in counts}

        result.append({
            "id": t.id,
            "slug": t.slug,
            "destination": t.destination,
            "origin": t.origin,
            "depart_date": t.depart_date.isoformat() if t.depart_date else None,
            "return_date": t.return_date.isoformat() if t.return_date else None,
            "duration_days": t.duration_days,
            "travelers": json.loads(t.travelers_json) if t.travelers_json else None,
            "preferences": json.loads(t.preferences_json) if t.preferences_json else None,
            "status": t.status,
            "item_counts": item_counts,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        })
    return result


def get_trip(db: Session, trip_id: str, user_id: str) -> Trip | None:
    return db.query(Trip).filter(Trip.id == trip_id, Trip.user_id == user_id).first()


def update_trip(db: Session, trip: Trip, **kwargs) -> Trip:
    for key, val in kwargs.items():
        if key in ("travelers", "preferences") and isinstance(val, dict):
            setattr(trip, f"{key}_json", json.dumps(val))
        elif hasattr(trip, key):
            setattr(trip, key, val)
    db.commit()
    db.refresh(trip)
    return trip


def delete_trip(db: Session, trip: Trip) -> None:
    db.delete(trip)
    db.commit()


# ---------------------------------------------------------------------------
# Trip Items
# ---------------------------------------------------------------------------


def get_trip_items(db: Session, trip_id: str, category: str | None = None) -> list[TripItem]:
    q = db.query(TripItem).filter(TripItem.trip_id == trip_id)
    if category:
        q = q.filter(TripItem.category == category)
    return q.order_by(TripItem.created_at).all()


def create_trip_item(
    db: Session, trip_id: str, category: str, data: dict,
    is_selected: bool = False, source_url: str | None = None,
) -> TripItem:
    item = TripItem(
        id=str(uuid.uuid4()),
        trip_id=trip_id,
        category=category,
        data_json=json.dumps(data, default=str),
        is_selected=is_selected,
        source_url=source_url,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_trip_item(db: Session, item_id: str) -> TripItem | None:
    return db.query(TripItem).filter(TripItem.id == item_id).first()


def update_trip_item(db: Session, item: TripItem, **kwargs) -> TripItem:
    for key, val in kwargs.items():
        if key == "data" and isinstance(val, dict):
            item.data_json = json.dumps(val, default=str)
        elif hasattr(item, key):
            setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item


def delete_trip_item(db: Session, item: TripItem) -> None:
    db.delete(item)
    db.commit()


def select_trip_item(db: Session, item: TripItem) -> TripItem:
    """Mark an item as selected. For flights/hotels, deselects other items in same category."""
    # Deselect others in same category for this trip
    db.query(TripItem).filter(
        TripItem.trip_id == item.trip_id,
        TripItem.category == item.category,
        TripItem.is_selected == True,  # noqa: E712
    ).update({"is_selected": False})

    item.is_selected = True
    db.commit()
    db.refresh(item)
    return item


# ---------------------------------------------------------------------------
# Itinerary
# ---------------------------------------------------------------------------


def get_itinerary(db: Session, trip_id: str) -> list[ItineraryDay]:
    return (
        db.query(ItineraryDay)
        .filter(ItineraryDay.trip_id == trip_id)
        .order_by(ItineraryDay.day_number)
        .all()
    )


def replace_itinerary(db: Session, trip_id: str, days: list[dict]) -> list[ItineraryDay]:
    """Replace full itinerary."""
    db.query(ItineraryDay).filter(ItineraryDay.trip_id == trip_id).delete()

    result = []
    for i, day in enumerate(days):
        day_date = None
        if day.get("date"):
            try:
                day_date = date.fromisoformat(day["date"])
            except (ValueError, TypeError):
                pass

        row = ItineraryDay(
            id=str(uuid.uuid4()),
            trip_id=trip_id,
            day_number=i + 1,
            date=day_date,
            theme=day.get("theme", ""),
            subtitle=day.get("subtitle"),
            activities_json=json.dumps(day.get("activities", []), default=str),
            is_flight_day=day.get("is_flight_day", False),
        )
        db.add(row)
        result.append(row)

    db.commit()
    for r in result:
        db.refresh(r)
    return result


# ---------------------------------------------------------------------------
# Chat Messages
# ---------------------------------------------------------------------------


def get_chat_messages(
    db: Session, user_id: str, trip_id: str | None = None, limit: int = 100
) -> list[ChatMessage]:
    q = db.query(ChatMessage).filter(ChatMessage.user_id == user_id)
    if trip_id:
        q = q.filter(ChatMessage.trip_id == trip_id)
    else:
        q = q.filter(ChatMessage.trip_id.is_(None))
    return q.order_by(ChatMessage.created_at).limit(limit).all()


def create_chat_message(
    db: Session, user_id: str, role: str, content: str, trip_id: str | None = None,
) -> ChatMessage:
    msg = ChatMessage(
        id=str(uuid.uuid4()),
        user_id=user_id,
        trip_id=trip_id,
        role=role,
        content=content,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

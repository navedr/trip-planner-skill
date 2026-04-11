"""Itinerary REST router — /api/trips/:id/itinerary."""

from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from travel_agent.auth import get_current_user
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.db import crud
from travel_agent.api.schemas import ItineraryDaySchema, ItineraryDayResponse

router = APIRouter(prefix="/api/trips/{trip_id}/itinerary", tags=["itinerary"])


def _day_to_response(day) -> ItineraryDayResponse:
    return ItineraryDayResponse(
        id=day.id,
        day_number=day.day_number,
        date=day.date.isoformat() if day.date else None,
        theme=day.theme,
        subtitle=day.subtitle,
        is_flight_day=day.is_flight_day,
        activities=json.loads(day.activities_json) if day.activities_json else [],
    )


@router.get("", response_model=list[ItineraryDayResponse])
def get_itinerary(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    days = crud.get_itinerary(db, trip_id)
    return [_day_to_response(d) for d in days]


@router.put("", response_model=list[ItineraryDayResponse])
def replace_itinerary(
    trip_id: str,
    days: list[ItineraryDaySchema],
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    day_dicts = [d.model_dump() for d in days]
    result = crud.replace_itinerary(db, trip_id, day_dicts)
    return [_day_to_response(r) for r in result]

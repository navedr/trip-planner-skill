"""Weather REST router — /api/trips/:id/weather.

Returns per-day forecasts from Open-Meteo (free, no API key) for the trip's
destination and date range. Falls back to [] on geocode miss, out-of-window
dates, or upstream errors — never raises.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from travel_agent.auth import get_current_user
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.db import crud
from travel_agent.api.schemas import DayWeather
from travel_agent.tools.weather import fetch_forecast

router = APIRouter(prefix="/api/trips/{trip_id}/weather", tags=["weather"])


@router.get("", response_model=list[DayWeather])
def get_trip_weather(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DayWeather]:
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if not trip.depart_date or not trip.return_date or not trip.destination:
        return []

    forecast = fetch_forecast(
        destination=trip.destination,
        start_date=trip.depart_date.isoformat(),
        end_date=trip.return_date.isoformat(),
    )
    return [DayWeather(**d) for d in forecast]

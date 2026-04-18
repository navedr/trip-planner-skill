"""Pydantic request/response models for the REST API."""

from __future__ import annotations

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Trips
# ---------------------------------------------------------------------------


class TripCreate(BaseModel):
    destination: str
    origin: str
    depart_date: str | None = None
    return_date: str | None = None
    adults: int = 2
    children_ages: list[int] | None = None
    preferences: dict | None = None


class TripUpdate(BaseModel):
    destination: str | None = None
    origin: str | None = None
    depart_date: str | None = None
    return_date: str | None = None
    duration_days: int | None = None
    status: str | None = None
    travelers: dict | None = None
    preferences: dict | None = None


class TripResponse(BaseModel):
    id: str
    slug: str
    destination: str
    origin: str
    depart_date: str | None = None
    return_date: str | None = None
    duration_days: int | None = None
    travelers: dict | None = None
    preferences: dict | None = None
    status: str
    item_counts: dict | None = None
    created_at: str | None = None
    updated_at: str | None = None


# ---------------------------------------------------------------------------
# Trip Items
# ---------------------------------------------------------------------------


class TripItemCreate(BaseModel):
    category: str
    data: dict
    is_selected: bool = False
    source_url: str | None = None


class TripItemUpdate(BaseModel):
    data: dict | None = None
    is_selected: bool | None = None
    source_url: str | None = None


class TripItemResponse(BaseModel):
    id: str
    trip_id: str
    category: str
    data: dict | None = None
    is_selected: bool
    source_url: str | None = None
    created_at: str | None = None


# ---------------------------------------------------------------------------
# Itinerary
# ---------------------------------------------------------------------------


class ItineraryDaySchema(BaseModel):
    date: str | None = None
    theme: str | None = None
    subtitle: str | None = None
    is_flight_day: bool = False
    activities: list[dict] | None = None


class ItineraryDayResponse(BaseModel):
    id: str
    day_number: int
    date: str | None = None
    theme: str | None = None
    subtitle: str | None = None
    is_flight_day: bool
    activities: list[dict] | None = None


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


class SettingsResponse(BaseModel):
    llm_provider: str | None = None
    llm_model: str | None = None
    has_api_key: bool = False
    name: str
    email: str
    notifications_enabled: bool = False


class SettingsUpdate(BaseModel):
    llm_provider: str | None = None
    llm_model: str | None = None
    llm_api_key: str | None = None  # plaintext — encrypted before storage
    name: str | None = None
    notifications_enabled: bool | None = None


# ---------------------------------------------------------------------------
# Weather
# ---------------------------------------------------------------------------

class DayWeather(BaseModel):
    date: str
    temp_high_f: float
    temp_low_f: float
    condition_code: int
    condition_label: str
    condition_emoji: str
    precipitation_in: float
    wind_mph: float
    sunrise: str
    sunset: str

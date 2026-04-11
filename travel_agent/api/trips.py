"""Trips REST router — /api/trips."""

from __future__ import annotations

import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from travel_agent.auth import get_current_user
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.db import crud
from travel_agent.api.schemas import TripCreate, TripUpdate, TripResponse

router = APIRouter(prefix="/api/trips", tags=["trips"])


def _slugify(destination: str, depart: str | None) -> str:
    words = destination.strip().split()
    abbr = "".join(w[0].lower() for w in words) if len(words) > 1 else destination.strip().lower()[:6]
    if depart:
        parts = depart.split("-")
        months = ["", "jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
        month = months[int(parts[1])] if len(parts) >= 2 else "trip"
        year = parts[0] if parts else ""
        slug = f"{abbr}-{month}-{year}"
    else:
        slug = abbr
    return re.sub(r"[^a-z0-9-]", "", slug)


@router.get("", response_model=list[TripResponse])
def list_trips(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return crud.get_trips(db, user.id)


@router.post("", response_model=TripResponse, status_code=201)
def create_trip(
    req: TripCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    slug = _slugify(req.destination, req.depart_date)
    depart = date.fromisoformat(req.depart_date) if req.depart_date else None
    ret = date.fromisoformat(req.return_date) if req.return_date else None
    duration = None
    if depart and ret:
        duration = (ret - depart).days + 1

    travelers = {"adults": req.adults}
    if req.children_ages:
        travelers["children_ages"] = req.children_ages

    trip = crud.create_trip(
        db,
        user_id=user.id,
        destination=req.destination,
        origin=req.origin,
        slug=slug,
        depart_date=depart,
        return_date=ret,
        duration_days=duration,
        travelers=travelers,
        preferences=req.preferences,
    )
    return crud.get_trips(db, user.id)[-1]  # return with item_counts shape


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    # Return via get_trips to include item_counts
    all_trips = crud.get_trips(db, user.id)
    return next((t for t in all_trips if t["id"] == trip_id), None)


@router.patch("/{trip_id}", response_model=TripResponse)
def update_trip(
    trip_id: str,
    req: TripUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    updates = {}
    if req.destination is not None:
        updates["destination"] = req.destination
    if req.origin is not None:
        updates["origin"] = req.origin
    if req.depart_date is not None:
        updates["depart_date"] = date.fromisoformat(req.depart_date)
    if req.return_date is not None:
        updates["return_date"] = date.fromisoformat(req.return_date)
    if req.duration_days is not None:
        updates["duration_days"] = req.duration_days
    if req.status is not None:
        updates["status"] = req.status
    if req.travelers is not None:
        updates["travelers"] = req.travelers
    if req.preferences is not None:
        updates["preferences"] = req.preferences

    crud.update_trip(db, trip, **updates)
    all_trips = crud.get_trips(db, user.id)
    return next((t for t in all_trips if t["id"] == trip_id), None)


@router.delete("/{trip_id}", status_code=204)
def delete_trip(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    crud.delete_trip(db, trip)

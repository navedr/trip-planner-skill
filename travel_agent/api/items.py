"""Trip Items REST router — /api/trips/:id/items."""

from __future__ import annotations

import json
import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from travel_agent.auth import get_current_user
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.db import crud
from travel_agent.api.schemas import TripItemCreate, TripItemUpdate, TripItemResponse
from travel_agent.geocoding import geocode_address, extract_address

router = APIRouter(prefix="/api/trips/{trip_id}/items", tags=["items"])


def _item_to_response(item) -> TripItemResponse:
    return TripItemResponse(
        id=item.id,
        trip_id=item.trip_id,
        category=item.category,
        data=json.loads(item.data_json) if item.data_json else None,
        is_selected=item.is_selected,
        source_url=item.source_url,
        created_at=item.created_at.isoformat() if item.created_at else None,
    )


@router.get("", response_model=list[TripItemResponse])
def list_items(
    trip_id: str,
    category: str | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    items = crud.get_trip_items(db, trip_id, category)
    return [_item_to_response(i) for i in items]


async def _maybe_geocode(data: dict, destination: str | None) -> dict:
    """If data lacks lat/lng, try to geocode and inject coordinates."""
    if data.get("latitude") and data.get("longitude"):
        return data

    api_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not api_key:
        return data

    address = extract_address(data, destination)
    if not address:
        return data

    coords = await geocode_address(address, api_key)
    if coords:
        data = {**data, "latitude": coords[0], "longitude": coords[1]}
    return data


@router.get("/map")
def list_map_items(
    trip_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    items = crud.get_trip_items(db, trip_id)
    result = []
    for item in items:
        data = json.loads(item.data_json) if item.data_json else {}
        lat = data.get("latitude")
        lng = data.get("longitude")
        if lat is None or lng is None:
            continue
        result.append({
            "id": item.id,
            "name": data.get("name") or data.get("airline") or "Unknown",
            "category": item.category,
            "location": {"lat": lat, "lng": lng},
            "is_selected": item.is_selected,
            "data": data,
        })
    return result


@router.post("", response_model=TripItemResponse, status_code=201)
async def create_item(
    trip_id: str,
    req: TripItemCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    data = await _maybe_geocode(req.data, trip.destination)
    item = crud.create_trip_item(
        db, trip_id, req.category, data, req.is_selected, req.source_url,
    )
    return _item_to_response(item)


@router.patch("/{item_id}", response_model=TripItemResponse)
async def update_item(
    trip_id: str,
    item_id: str,
    req: TripItemUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    item = crud.get_trip_item(db, item_id)
    if not item or item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Item not found")

    updates = {}
    if req.data is not None:
        updates["data"] = await _maybe_geocode(req.data, trip.destination)
    if req.is_selected is not None:
        updates["is_selected"] = req.is_selected
    if req.source_url is not None:
        updates["source_url"] = req.source_url
    crud.update_trip_item(db, item, **updates)
    return _item_to_response(item)


@router.delete("/{item_id}", status_code=204)
def delete_item(
    trip_id: str,
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    item = crud.get_trip_item(db, item_id)
    if not item or item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.delete_trip_item(db, item)


@router.post("/{item_id}/select", response_model=TripItemResponse)
def select_item(
    trip_id: str,
    item_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trip = crud.get_trip(db, trip_id, user.id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    item = crud.get_trip_item(db, item_id)
    if not item or item.trip_id != trip_id:
        raise HTTPException(status_code=404, detail="Item not found")
    crud.select_trip_item(db, item)
    return _item_to_response(item)

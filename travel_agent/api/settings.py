"""Settings REST router — /api/settings."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from travel_agent.auth import encrypt_api_key, get_current_user
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.api.schemas import SettingsResponse, SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(user: User = Depends(get_current_user)):
    return SettingsResponse(
        llm_provider=user.llm_provider,
        llm_model=user.llm_model,
        has_api_key=user.llm_api_key_encrypted is not None,
        name=user.name,
        email=user.email,
        notifications_enabled=bool(user.notifications_enabled),
    )


@router.patch("", response_model=SettingsResponse)
def update_settings(
    req: SettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.llm_provider is not None:
        user.llm_provider = req.llm_provider
    if req.llm_model is not None:
        user.llm_model = req.llm_model
    if req.llm_api_key is not None:
        user.llm_api_key_encrypted = encrypt_api_key(req.llm_api_key)
    if req.name is not None:
        user.name = req.name
    if req.notifications_enabled is not None:
        user.notifications_enabled = req.notifications_enabled
    db.commit()
    db.refresh(user)
    return SettingsResponse(
        llm_provider=user.llm_provider,
        llm_model=user.llm_model,
        has_api_key=user.llm_api_key_encrypted is not None,
        name=user.name,
        email=user.email,
        notifications_enabled=bool(user.notifications_enabled),
    )


@router.get("/maps-key")
def get_maps_key(user: User = Depends(get_current_user)):
    key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    return {"key": key}

"""Push notifications REST router — /api/notifications."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from travel_agent.auth import get_current_user
from travel_agent.db import crud
from travel_agent.db.database import get_db
from travel_agent.db.models import User
from travel_agent.push import send_push_to_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class Keys(BaseModel):
    p256dh: str
    auth: str


class SubscribeReq(BaseModel):
    endpoint: str
    keys: Keys


class UnsubscribeReq(BaseModel):
    endpoint: str


@router.get("/vapid-public-key")
def vapid_public_key(user: User = Depends(get_current_user)):
    return {"key": os.environ.get("VAPID_PUBLIC_KEY", "")}


@router.post("/subscribe")
def subscribe(
    req: SubscribeReq,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    crud.create_push_subscription(
        db, user.id, req.endpoint, req.keys.p256dh, req.keys.auth, user_agent
    )
    user.notifications_enabled = True
    db.commit()
    return {"ok": True}


@router.delete("/subscribe")
def unsubscribe(
    req: UnsubscribeReq,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted = crud.delete_push_subscription(db, user.id, req.endpoint)
    return {"ok": True, "deleted": deleted}


@router.post("/test")
def test_push(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sent = send_push_to_user(
        db, user.id,
        title="Voyager test",
        body="Push notifications are working.",
    )
    return {"sent": sent}

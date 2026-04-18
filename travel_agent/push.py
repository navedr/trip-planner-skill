"""Web Push helper — send notifications to subscribed browsers via VAPID."""

from __future__ import annotations

import json
import logging
import os

from travel_agent.db import crud
from travel_agent.db.models import User

logger = logging.getLogger(__name__)


def _get_vapid_config() -> tuple[str, str] | None:
    """Return (private_key_b64url, subject) or None if VAPID env is not configured.

    py_vapid's Vapid.from_string expects the raw 32-byte private scalar encoded
    as URL-safe base64 (len=32 after decoding). Passing a PKCS8 PEM here falls
    through to DER parsing and fails, so we forward the env value verbatim.
    """
    priv_b64 = os.environ.get("VAPID_PRIVATE_KEY", "").strip()
    pub = os.environ.get("VAPID_PUBLIC_KEY", "").strip()
    subject = os.environ.get("VAPID_SUBJECT", "").strip()
    if not priv_b64 or not pub or not subject:
        return None
    return priv_b64, subject


def send_push_to_user(
    db,
    user_id: str,
    title: str,
    body: str,
    url: str | None = None,
    tag: str | None = None,
) -> int:
    """Send a Web Push notification to all active subscriptions for a user.

    Returns the number of pushes successfully delivered.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        return 0
    if not user.notifications_enabled:
        return 0

    subs = crud.get_push_subscriptions(db, user_id)
    if not subs:
        return 0

    vapid = _get_vapid_config()
    if vapid is None:
        logger.warning("VAPID env not configured — skipping push for user %s", user_id)
        return 0
    private_key, subject = vapid

    # Import pywebpush lazily so the module imports cleanly without the dep.
    try:
        from pywebpush import WebPushException, webpush
    except Exception:
        logger.exception("pywebpush not available — cannot send push")
        return 0

    payload = json.dumps({"title": title, "body": body, "url": url, "tag": tag})
    delivered = 0

    for sub in subs:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
        }
        try:
            webpush(
                subscription_info=subscription_info,
                data=payload,
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
            )
            delivered += 1
        except WebPushException as e:
            status = getattr(getattr(e, "response", None), "status_code", None)
            if status in (404, 410):
                try:
                    crud.delete_push_subscription(db, user_id, sub.endpoint)
                except Exception:
                    logger.exception("failed to delete stale subscription %s", sub.endpoint)
            else:
                logger.warning("WebPushException for %s: %s", sub.endpoint, e)
        except Exception:
            logger.exception("unexpected error sending push to %s", sub.endpoint)

    return delivered

"""Storage backends for trip data."""
from __future__ import annotations

import os


def make_storage():
    """Return S3TripStorage if AWS_S3_BUCKET is configured, else None (filesystem fallback)."""
    bucket = os.environ.get("AWS_S3_BUCKET", "").strip()
    if not bucket:
        return None
    from .s3_storage import S3TripStorage
    return S3TripStorage(
        bucket=bucket,
        prefix=os.environ.get("AWS_S3_PREFIX", "plans"),
        endpoint_url=os.environ.get("AWS_S3_ENDPOINT_URL") or None,
        region=os.environ.get("AWS_S3_REGION", "us-east-1"),
        access_key=os.environ.get("AWS_ACCESS_KEY_ID") or None,
        secret_key=os.environ.get("AWS_SECRET_ACCESS_KEY") or None,
    )

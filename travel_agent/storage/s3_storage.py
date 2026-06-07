"""AWS S3-compatible trip storage — same interface as trip_state.py filesystem functions.

Works with AWS S3, Cloudflare R2, Backblaze B2, or any S3-compatible service.

Configuration (env vars):
    AWS_S3_BUCKET         — bucket name (required)
    AWS_S3_PREFIX         — key prefix within bucket (default: "plans")
    AWS_S3_ENDPOINT_URL   — custom endpoint for R2/B2/MinIO (omit for standard AWS)
    AWS_S3_REGION         — region (default: us-east-1)
    AWS_ACCESS_KEY_ID     — access key
    AWS_SECRET_ACCESS_KEY — secret key

plan_dir in this backend is the trip slug (e.g. "slc-may-2026").
The S3 object key is: {prefix}/{slug}/trip-data.json
"""
from __future__ import annotations

import json
import re
from datetime import datetime


def _slugify(destination: str, depart: str) -> str:
    words = destination.strip().split()
    if len(words) > 1:
        abbr = "".join(w[0].lower() for w in words)
    else:
        abbr = destination.strip().lower()[:6]
    parts = depart.split("-")
    months = ["", "jan", "feb", "mar", "apr", "may", "jun",
              "jul", "aug", "sep", "oct", "nov", "dec"]
    month = months[int(parts[1])] if len(parts) >= 2 else "trip"
    year = parts[0] if len(parts) >= 1 else ""
    return re.sub(r"[^a-z0-9-]", "", f"{abbr}-{month}-{year}")


class S3TripStorage:
    """S3-compatible drop-in replacement for trip_state.py functions."""

    def __init__(
        self,
        bucket: str,
        prefix: str = "plans",
        endpoint_url: str | None = None,
        region: str = "us-east-1",
        access_key: str | None = None,
        secret_key: str | None = None,
    ):
        import boto3
        kwargs: dict = {"region_name": region}
        if endpoint_url:
            kwargs["endpoint_url"] = endpoint_url
        if access_key:
            kwargs["aws_access_key_id"] = access_key
        if secret_key:
            kwargs["aws_secret_access_key"] = secret_key
        self._s3 = boto3.client("s3", **kwargs)
        self._bucket = bucket
        self._prefix = prefix.rstrip("/")

    def _key(self, slug: str) -> str:
        return f"{self._prefix}/{slug}/trip-data.json"

    def create_trip(
        self,
        destination: str,
        origin: str,
        dates: dict,
        travelers: dict,
        preferences: dict,
        plans_dir: str = "./plans",  # ignored, kept for interface compat
    ) -> str:
        depart = dates.get("depart", "")
        if "duration_days" not in dates and depart and dates.get("return"):
            try:
                d1 = datetime.strptime(depart, "%Y-%m-%d")
                d2 = datetime.strptime(dates["return"], "%Y-%m-%d")
                dates["duration_days"] = (d2 - d1).days + 1
            except (ValueError, TypeError):
                pass

        slug = _slugify(destination, depart)

        # Don't overwrite an existing plan
        try:
            from botocore.exceptions import ClientError
            self._s3.head_object(Bucket=self._bucket, Key=self._key(slug))
            return slug
        except Exception as exc:
            # head_object raises ClientError with 404 when key doesn't exist
            if hasattr(exc, "response") and exc.response.get("Error", {}).get("Code") not in ("404", "NoSuchKey"):
                raise

        trip_data = {
            "destination": destination,
            "origin": origin,
            "dates": dates,
            "travelers": travelers,
            "preferences": preferences,
            "flights": {"search_url": None, "outbound": [], "return": [], "selected": None},
            "hotels": {"search_urls": {}, "options": [], "selected": None},
            "restaurants": [],
            "attractions": [],
            "itinerary": {},
            "notes": [],
        }
        self._put(slug, trip_data)
        return slug

    def load_trip(self, plan_dir: str) -> dict:
        resp = self._s3.get_object(Bucket=self._bucket, Key=self._key(plan_dir))
        return json.loads(resp["Body"].read())

    def save_trip(self, plan_dir: str, data: dict) -> None:
        self._put(plan_dir, data)

    def update_section(self, plan_dir: str, section: str, data) -> None:
        trip = self.load_trip(plan_dir)
        keys = section.split(".")
        target = trip
        for key in keys[:-1]:
            target = target[key]
        target[keys[-1]] = data
        self.save_trip(plan_dir, trip)

    def list_plans(self, plans_dir: str = "./plans") -> list[dict]:
        paginator = self._s3.get_paginator("list_objects_v2")
        results = []
        for page in paginator.paginate(Bucket=self._bucket, Prefix=f"{self._prefix}/", Delimiter="/"):
            for cp in page.get("CommonPrefixes", []):
                slug = cp["Prefix"].rstrip("/").split("/")[-1]
                try:
                    data = self.load_trip(slug)
                    results.append({
                        "slug": slug,
                        "path": slug,
                        "destination": data.get("destination"),
                        "dates": data.get("dates"),
                        "travelers": data.get("travelers"),
                    })
                except Exception:
                    results.append({"slug": slug, "path": slug, "error": "failed to load"})
        return results

    def finalize_selection(self, plan_dir: str, category: str, selected_data: dict) -> None:
        trip = self.load_trip(plan_dir)
        section = trip.get(category, {})
        selected_data["status"] = "booked"
        section["selected"] = selected_data
        for key in list(section.keys()):
            if key in ("selected", "search_url", "search_urls"):
                continue
            if isinstance(section[key], list):
                section[key] = []
        trip[category] = section
        self.save_trip(plan_dir, trip)

    def _put(self, slug: str, data: dict) -> None:
        self._s3.put_object(
            Bucket=self._bucket,
            Key=self._key(slug),
            Body=json.dumps(data, indent=2, default=str).encode(),
            ContentType="application/json",
        )

"""One-time migration: reads plans/*/trip-data.json → inserts into SQLite.

Usage:
    python3.12 -m travel_agent.storage.migrate_filesystem [--user-id USER_ID]

If --user-id is not provided, creates a default admin user.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from travel_agent.db.database import SessionLocal, engine
from travel_agent.db.models import Base, User
from travel_agent.auth import hash_password
from travel_agent.storage.sqlite_storage import SQLiteTripStorage


def migrate(plans_dir: str = "./plans", user_id: str | None = None) -> int:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Resolve or create user
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                print(f"User {user_id} not found")
                return 1
        else:
            user = db.query(User).filter(User.email == "admin@local").first()
            if not user:
                user = User(
                    email="admin@local",
                    password_hash=hash_password("admin"),
                    name="Admin (migrated)",
                )
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"Created admin user: {user.id}")

        storage = SQLiteTripStorage(db, user.id)
        plans_path = Path(plans_dir)
        if not plans_path.exists():
            print(f"No plans directory at {plans_dir}")
            return 0

        migrated = 0
        for entry in sorted(plans_path.iterdir()):
            trip_file = entry / "trip-data.json"
            if not entry.is_dir() or not trip_file.exists():
                continue

            print(f"Migrating {entry.name}...")
            with open(trip_file) as f:
                data = json.load(f)

            trip_id = storage.create_trip(
                destination=data.get("destination", entry.name),
                origin=data.get("origin", ""),
                dates=data.get("dates", {}),
                travelers=data.get("travelers", {}),
                preferences=data.get("preferences", {}),
            )

            # Now do a full save to import items + itinerary
            storage.save_trip(trip_id, data)
            migrated += 1
            print(f"  → trip {trip_id}")

        print(f"\nMigrated {migrated} trip(s)")
        return 0

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate filesystem plans to SQLite")
    parser.add_argument("--plans-dir", default="./plans")
    parser.add_argument("--user-id", default=None)
    args = parser.parse_args()
    sys.exit(migrate(args.plans_dir, args.user_id))

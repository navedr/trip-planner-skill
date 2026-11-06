"""Traveler memory: durable facts about the household, kept in a SQLite file on S3.

Not trip plans (those live under AWS_S3_PREFIX) — this is what should carry across trips:
places already visited, standing preferences, and similar facts the user states.

Storage: s3://$AWS_S3_BUCKET/$TRAVEL_MEMORY_KEY (default travel-memory/traveler.sqlite).
Each command downloads the file, works on a local copy, and uploads it again only if it
changed. Uploads are conditional on the ETag seen at download, so two sessions writing at
once cannot silently overwrite each other — the loser gets an error and should retry.

Usage:
    python3.13 .claude/skills/_memory.py list [--kind KIND]
    python3.13 .claude/skills/_memory.py set KIND KEY [--value JSON] [--note TEXT]
    python3.13 .claude/skills/_memory.py remove KIND KEY
    python3.13 .claude/skills/_memory.py kinds

Kinds in use: visited_place, preference.
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone

DEFAULT_KEY = "travel-memory/traveler.sqlite"

SCHEMA = """
CREATE TABLE IF NOT EXISTS memories (
    id         INTEGER PRIMARY KEY,
    kind       TEXT NOT NULL,
    key        TEXT NOT NULL,
    value      TEXT,            -- JSON
    note       TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE (kind, key)
);
"""


def _s3():
    import boto3
    return boto3.client("s3", region_name=os.environ.get("AWS_S3_REGION", "us-east-1"),
                        endpoint_url=os.environ.get("AWS_S3_ENDPOINT_URL") or None)


class MemoryStore:
    def __init__(self):
        self.bucket = os.environ["AWS_S3_BUCKET"]
        self.key = os.environ.get("TRAVEL_MEMORY_KEY", DEFAULT_KEY)
        self.s3 = _s3()
        self.etag = None
        fd, self.path = tempfile.mkstemp(suffix=".sqlite")
        os.close(fd)

    def __enter__(self):
        try:
            obj = self.s3.get_object(Bucket=self.bucket, Key=self.key)
            self.etag = obj["ETag"]
            with open(self.path, "wb") as f:
                f.write(obj["Body"].read())
        except self.s3.exceptions.NoSuchKey:
            pass  # first use: start empty
        self.db = sqlite3.connect(self.path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(SCHEMA)
        self.dirty = False
        return self

    def __exit__(self, exc_type, *_):
        self.db.commit()
        self.db.close()
        try:
            if exc_type is None and self.dirty:
                with open(self.path, "rb") as f:
                    body = f.read()
                kwargs = {"IfMatch": self.etag} if self.etag else {"IfNoneMatch": "*"}
                self.s3.put_object(Bucket=self.bucket, Key=self.key, Body=body,
                                   ContentType="application/vnd.sqlite3", **kwargs)
        finally:
            os.remove(self.path)

    def list(self, kind: str | None = None) -> list[dict]:
        q = "SELECT kind, key, value, note, updated_at FROM memories"
        rows = self.db.execute(q + (" WHERE kind = ?" if kind else "") + " ORDER BY kind, key",
                               (kind,) if kind else ()).fetchall()
        return [{**dict(r), "value": json.loads(r["value"]) if r["value"] else None} for r in rows]

    def set(self, kind: str, key: str, value=None, note: str | None = None) -> None:
        now = datetime.now(timezone.utc).isoformat(timespec="seconds")
        self.db.execute(
            """INSERT INTO memories (kind, key, value, note, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?)
               ON CONFLICT (kind, key) DO UPDATE SET
                 value = excluded.value, note = excluded.note, updated_at = excluded.updated_at""",
            (kind, key, json.dumps(value) if value is not None else None, note, now, now))
        self.dirty = True

    def remove(self, kind: str, key: str) -> bool:
        n = self.db.execute("DELETE FROM memories WHERE kind = ? AND key = ?", (kind, key)).rowcount
        self.dirty = self.dirty or n > 0
        return n > 0


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = p.add_subparsers(dest="cmd", required=True)
    ls = sub.add_parser("list"); ls.add_argument("--kind")
    st = sub.add_parser("set"); st.add_argument("kind"); st.add_argument("key")
    st.add_argument("--value", help="JSON"); st.add_argument("--note")
    rm = sub.add_parser("remove"); rm.add_argument("kind"); rm.add_argument("key")
    sub.add_parser("kinds")
    a = p.parse_args(argv)

    with MemoryStore() as m:
        if a.cmd == "list":
            for r in m.list(a.kind):
                extra = f" {json.dumps(r['value'])}" if r["value"] is not None else ""
                note = f" — {r['note']}" if r["note"] else ""
                print(f"[{r['kind']}] {r['key']}{extra}{note}")
        elif a.cmd == "set":
            m.set(a.kind, a.key, json.loads(a.value) if a.value else None, a.note)
            print(f"saved [{a.kind}] {a.key}")
        elif a.cmd == "remove":
            print("removed" if m.remove(a.kind, a.key) else "not found")
        elif a.cmd == "kinds":
            for (k,) in m.db.execute("SELECT DISTINCT kind FROM memories ORDER BY kind"):
                print(k)


if __name__ == "__main__":
    sys.exit(main())

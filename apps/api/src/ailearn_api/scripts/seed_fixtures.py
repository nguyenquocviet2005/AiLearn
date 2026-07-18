"""Fixture-to-Supabase seed loader (VAI-17).

Upserts the demo dataset in data/seeds/ into Supabase so a live Diagnostic API
(and the demo class) has real rows to read: students + evidence_events.
Re-running this script is safe — writes use `Prefer: resolution=merge-duplicates`,
so repeated rows are upserted, not duplicated.

Usage:
    uv run --project apps/api python -m ailearn_api.scripts.seed_fixtures
"""

from __future__ import annotations

import asyncio
import json
import sys
from typing import Any

import httpx
from ailearn_diagnostic import to_persistence_row, validate_evidence_event

from ailearn_api.config import API_PROJECT_ROOT, get_settings

SEEDS_DIR = API_PROJECT_ROOT.parent.parent / "data" / "seeds"


def _load_json(name: str) -> dict[str, Any]:
    return json.loads((SEEDS_DIR / name).read_text(encoding="utf-8"))


def _student_rows() -> list[dict[str, Any]]:
    payload = _load_json("students.json")
    return [
        {
            "id": row["student_id"],
            "display_name": row["display_name"],
            "class_id": row["class_id"],
        }
        for row in payload["students"]
    ]


def _evidence_event_rows() -> list[dict[str, Any]]:
    payload = _load_json("evidence-events.json")
    return [to_persistence_row(validate_evidence_event(row)) for row in payload["events"]]


async def _upsert(
    client: httpx.AsyncClient,
    base_url: str,
    secret_key: str,
    table: str,
    rows: list[dict[str, Any]],
) -> None:
    response = await client.post(
        f"{base_url.rstrip('/')}/rest/v1/{table}",
        headers={
            "apikey": secret_key,
            "Authorization": f"Bearer {secret_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
    )
    response.raise_for_status()


async def _run() -> None:
    settings = get_settings()
    if not settings.supabase_url or not settings.supabase_secret_key:
        print("SUPABASE_URL / SUPABASE_SECRET_KEY are not configured.", file=sys.stderr)
        raise SystemExit(1)

    students = _student_rows()
    events = _evidence_event_rows()

    async with httpx.AsyncClient(timeout=30.0) as client:
        await _upsert(
            client, settings.supabase_url, settings.supabase_secret_key, "students", students
        )
        print(f"Upserted {len(students)} student row(s).")
        await _upsert(
            client, settings.supabase_url, settings.supabase_secret_key, "evidence_events", events
        )
        print(f"Upserted {len(events)} evidence_event row(s).")


def main() -> int:
    asyncio.run(_run())
    return 0


if __name__ == "__main__":
    sys.exit(main())

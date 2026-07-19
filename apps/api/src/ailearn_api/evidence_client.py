from collections.abc import Mapping
from typing import Any

import httpx
from ailearn_diagnostic import to_persistence_row, validate_evidence_event
from ailearn_schemas import EvidenceEventV1

from ailearn_api.config import Settings
from ailearn_api.models.evidence import EvidenceEventRecord
from ailearn_api.supabase_client import SupabaseUnavailableError, supabase_auth_headers


def _auth_headers(settings: Settings) -> dict[str, str]:
    return {
        **supabase_auth_headers(settings),
        "Content-Type": "application/json",
    }


async def insert_evidence_event(
    settings: Settings,
    event: EvidenceEventV1,
    client: httpx.AsyncClient | None = None,
) -> EvidenceEventRecord:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.post(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/evidence_events",
            headers={
                **_auth_headers(settings),
                "Prefer": "return=representation",
            },
            json=to_persistence_row(event),
        )
        if response.status_code == 409:
            # Retried write of an id already recorded: idempotent replay, not an error.
            return await fetch_evidence_event(settings, event.id, client=http_client)
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list) or len(payload) != 1:
            raise SupabaseUnavailableError("Evidence event insert did not return a row")
        record = payload[0]
        if not isinstance(record, Mapping):
            raise SupabaseUnavailableError("Evidence event insert response is invalid")
        return EvidenceEventRecord.model_validate(record)
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_evidence_event(
    settings: Settings,
    event_id: str,
    client: httpx.AsyncClient | None = None,
) -> EvidenceEventRecord:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/evidence_events",
            headers=_auth_headers(settings),
            params={
                "select": (
                    "id,schema_version,student_id,session_id,skill_id,item_id,"
                    "is_correct,recorded_at,lesson_id,response_label,confidence"
                ),
                "id": f"eq.{event_id}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list) or len(payload) != 1:
            raise SupabaseUnavailableError("Evidence event row is missing")
        record = payload[0]
        if not isinstance(record, Mapping):
            raise SupabaseUnavailableError("Evidence event response is invalid")
        return EvidenceEventRecord.model_validate(record)
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_evidence_events_for_student(
    settings: Settings,
    student_id: str,
    lesson_id: str,
    client: httpx.AsyncClient | None = None,
) -> list[EvidenceEventRecord]:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=20.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/evidence_events",
            headers=_auth_headers(settings),
            params={
                "select": (
                    "id,schema_version,student_id,session_id,skill_id,item_id,"
                    "is_correct,recorded_at,lesson_id,response_label,confidence"
                ),
                "student_id": f"eq.{student_id}",
                "lesson_id": f"eq.{lesson_id}",
                "order": "recorded_at.desc",
                "limit": "80",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Evidence event list response is invalid")
        records = [EvidenceEventRecord.model_validate(row) for row in payload]
        # Newest-first from PostgREST; diagnose expects chronological order.
        records.reverse()
        return records
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_evidence_item_ids_for_session(
    settings: Settings,
    session_id: str,
    client: httpx.AsyncClient | None = None,
) -> set[str]:
    """Read accepted response ids from the immutable evidence source of truth."""
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/evidence_events",
            headers=_auth_headers(settings),
            params={
                "select": "item_id",
                "session_id": f"eq.{session_id}",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list) or not all(isinstance(row, Mapping) for row in payload):
            raise SupabaseUnavailableError("Evidence session response is invalid")
        item_ids = {row.get("item_id") for row in payload}
        if not all(isinstance(item_id, str) for item_id in item_ids):
            raise SupabaseUnavailableError("Evidence session response is invalid")
        return set(item_ids)
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_evidence_events_for_lesson(
    settings: Settings,
    lesson_id: str,
    client: httpx.AsyncClient | None = None,
) -> list[EvidenceEventRecord]:
    """Fetch one lesson's evidence for a deterministic class projection."""
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/evidence_events",
            headers=_auth_headers(settings),
            params={
                "select": (
                    "id,schema_version,student_id,session_id,skill_id,item_id,"
                    "is_correct,recorded_at,lesson_id,response_label,confidence"
                ),
                "lesson_id": f"eq.{lesson_id}",
                "order": "recorded_at.asc",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Evidence event list response is invalid")
        return [EvidenceEventRecord.model_validate(row) for row in payload]
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


def parse_evidence_event_payload(payload: dict[str, Any]) -> EvidenceEventV1:
    return validate_evidence_event(payload)

"""Supabase persistence for immutable teacher-plan versions."""

from collections.abc import Mapping
from typing import Any

import httpx
from ailearn_schemas import TeacherPlanVersionV1

from ailearn_api.config import Settings
from ailearn_api.supabase_client import SupabaseUnavailableError


def _headers(settings: Settings) -> dict[str, str]:
    assert settings.supabase_secret_key is not None
    return {
        "apikey": settings.supabase_secret_key,
        "Authorization": f"Bearer {settings.supabase_secret_key}",
        "Content-Type": "application/json",
    }


def _record(row: Mapping[str, Any]) -> TeacherPlanVersionV1:
    return TeacherPlanVersionV1.model_validate(
        {
            "schema_version": row["schema_version"],
            "id": row["id"],
            "plan_id": row["plan_id"],
            "version": row["version"],
            "parent_version_id": row.get("parent_version_id"),
            "decision": row["decision"],
            "published_at": row.get("published_at"),
            "created_at": row["created_at"],
            "snapshot": row["snapshot"],
            "lesson_plan": row["lesson_plan"],
        }
    )


async def fetch_latest_plan_version(
    settings: Settings, plan_id: str, client: httpx.AsyncClient | None = None
) -> TeacherPlanVersionV1 | None:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")
    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/lesson_plan_versions",
            headers=_headers(settings),
            params={
                "select": (
                    "id,plan_id,version,parent_version_id,decision,published_at,"
                    "created_at,schema_version,snapshot,lesson_plan"
                ),
                "plan_id": f"eq.{plan_id}",
                "order": "version.desc",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Lesson plan version response is invalid")
        if not payload:
            return None
        if len(payload) != 1 or not isinstance(payload[0], Mapping):
            raise SupabaseUnavailableError("Lesson plan version response is invalid")
        return _record(payload[0])
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def append_plan_version(
    settings: Settings, version: TeacherPlanVersionV1, client: httpx.AsyncClient | None = None
) -> TeacherPlanVersionV1:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")
    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.post(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/lesson_plan_versions",
            headers={**_headers(settings), "Prefer": "return=representation"},
            json=version.model_dump(mode="json"),
        )
        response.raise_for_status()
        payload: Any = response.json()
        if (
            not isinstance(payload, list)
            or len(payload) != 1
            or not isinstance(payload[0], Mapping)
        ):
            raise SupabaseUnavailableError("Lesson plan version insert did not return a row")
        return _record(payload[0])
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

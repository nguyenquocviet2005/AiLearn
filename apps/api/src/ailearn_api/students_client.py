from collections.abc import Mapping
from typing import Any

import httpx

from ailearn_api.config import Settings
from ailearn_api.models.student import StudentRecord
from ailearn_api.supabase_client import SupabaseUnavailableError, supabase_auth_headers


async def fetch_student(
    settings: Settings,
    student_id: str,
    client: httpx.AsyncClient | None = None,
) -> StudentRecord:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/students",
            headers=supabase_auth_headers(settings),
            params={
                "select": "id,display_name,class_id,created_at",
                "id": f"eq.{student_id}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list) or len(payload) != 1:
            raise SupabaseUnavailableError("Student row is missing")
        record = payload[0]
        if not isinstance(record, Mapping):
            raise SupabaseUnavailableError("Student response is invalid")
        return StudentRecord.model_validate(record)
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_students_for_class(
    settings: Settings,
    class_id: str,
    client: httpx.AsyncClient | None = None,
) -> list[StudentRecord]:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/students",
            headers=supabase_auth_headers(settings),
            params={
                "select": "id,display_name,class_id,created_at",
                "class_id": f"eq.{class_id}",
                "order": "id.asc",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Student response is invalid")
        return [StudentRecord.model_validate(record) for record in payload]
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

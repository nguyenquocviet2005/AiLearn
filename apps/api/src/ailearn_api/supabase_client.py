from collections.abc import Mapping
from typing import Any

import httpx

from ailearn_api.config import Settings
from ailearn_api.models.system_status import SystemStatusRecord


class SupabaseUnavailableError(RuntimeError):
    """Raised when the infrastructure status cannot be read safely."""


def supabase_auth_headers(settings: Settings) -> dict[str, str]:
    """PostgREST requires both apikey and Authorization for the service role."""
    assert settings.supabase_secret_key is not None
    return {
        "apikey": settings.supabase_secret_key,
        "Authorization": f"Bearer {settings.supabase_secret_key}",
    }


async def fetch_system_status(
    settings: Settings,
    client: httpx.AsyncClient | None = None,
) -> SystemStatusRecord:
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/system_status",
            headers=supabase_auth_headers(settings),
            params={
                "select": "status,checked_at",
                "id": "eq.platform",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list) or len(payload) != 1:
            raise SupabaseUnavailableError("System status row is missing")
        record = payload[0]
        if not isinstance(record, Mapping):
            raise SupabaseUnavailableError("System status response is invalid")
        return SystemStatusRecord.model_validate(record)
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

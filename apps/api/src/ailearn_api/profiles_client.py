from collections.abc import Mapping
from typing import Any

import httpx

from ailearn_api.config import Settings
from ailearn_api.models.admin_auth import ProfileRecord
from ailearn_api.supabase_client import SupabaseUnavailableError


async def fetch_profile(
    settings: Settings,
    user_id: str,
    client: httpx.AsyncClient | None = None,
) -> ProfileRecord | None:
    """Return the profile row for an auth user id, or None when it does not exist."""
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.get(
            f"{settings.supabase_url.rstrip('/')}/rest/v1/profiles",
            headers={"apikey": settings.supabase_secret_key},
            params={
                "select": "id,email,role",
                "id": f"eq.{user_id}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Profile response is invalid")
        if not payload:
            return None
        if len(payload) != 1 or not isinstance(payload[0], Mapping):
            raise SupabaseUnavailableError("Profile response is invalid")
        return ProfileRecord.model_validate(payload[0])
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("Supabase request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

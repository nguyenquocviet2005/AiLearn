"""Password-grant authentication against Supabase GoTrue.

The browser never talks to Supabase directly (see docs/ARCHITECTURE.md); the backend verifies
the email/password pair itself, using SUPABASE_SECRET_KEY as the apikey header, and mints its
own session token (admin_session_store.py) for the frontend to use afterward.
"""

from collections.abc import Mapping
from typing import Any

import httpx

from ailearn_api.config import Settings
from ailearn_api.supabase_client import SupabaseUnavailableError


class GoTrueInvalidCredentialsError(RuntimeError):
    """Raised when Supabase GoTrue rejects the email/password pair."""


async def authenticate_with_password(
    settings: Settings,
    email: str,
    password: str,
    client: httpx.AsyncClient | None = None,
) -> str:
    """Verify email/password against Supabase GoTrue and return the auth user id."""
    if not settings.supabase_url or not settings.supabase_secret_key:
        raise SupabaseUnavailableError("Supabase is not configured")

    owns_client = client is None
    http_client = client or httpx.AsyncClient(timeout=5.0, follow_redirects=False)
    try:
        response = await http_client.post(
            f"{settings.supabase_url.rstrip('/')}/auth/v1/token",
            params={"grant_type": "password"},
            headers={
                "apikey": settings.supabase_secret_key,
                "Content-Type": "application/json",
            },
            json={"email": email, "password": password},
        )
        if response.status_code in (400, 401, 422):
            raise GoTrueInvalidCredentialsError("Invalid email or password")
        response.raise_for_status()
        payload: Any = response.json()
        user = payload.get("user") if isinstance(payload, Mapping) else None
        user_id = user.get("id") if isinstance(user, Mapping) else None
        if not isinstance(user_id, str):
            raise SupabaseUnavailableError("GoTrue response is invalid")
        return user_id
    except (httpx.HTTPError, ValueError) as exc:
        raise SupabaseUnavailableError("GoTrue request failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

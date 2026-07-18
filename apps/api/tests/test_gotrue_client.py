import httpx
import pytest

from ailearn_api.config import Settings
from ailearn_api.gotrue_client import GoTrueInvalidCredentialsError, authenticate_with_password
from ailearn_api.supabase_client import SupabaseUnavailableError

SETTINGS = Settings(
    supabase_url="https://example.supabase.co",
    supabase_secret_key="test-secret",
)


@pytest.mark.anyio
async def test_authenticate_with_password_returns_user_id_on_success() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/auth/v1/token")
        assert request.url.params["grant_type"] == "password"
        assert request.headers["apikey"] == "test-secret"
        return httpx.Response(200, json={"user": {"id": "user-123"}})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        user_id = await authenticate_with_password(
            SETTINGS, "admin@example.com", "correct-password", client=client
        )

    assert user_id == "user-123"


@pytest.mark.anyio
async def test_authenticate_with_password_rejects_invalid_credentials() -> None:
    transport = httpx.MockTransport(
        lambda request: httpx.Response(400, json={"error": "invalid_grant"})
    )

    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(GoTrueInvalidCredentialsError):
            await authenticate_with_password(
                SETTINGS, "admin@example.com", "wrong-password", client=client
            )


@pytest.mark.anyio
async def test_authenticate_with_password_raises_when_unconfigured() -> None:
    with pytest.raises(SupabaseUnavailableError, match="not configured"):
        await authenticate_with_password(
            Settings(supabase_url=None, supabase_secret_key=None),
            "admin@example.com",
            "password",
        )


@pytest.mark.anyio
async def test_authenticate_with_password_rejects_malformed_response() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json={}))

    async with httpx.AsyncClient(transport=transport) as client:
        with pytest.raises(SupabaseUnavailableError):
            await authenticate_with_password(
                SETTINGS, "admin@example.com", "correct-password", client=client
            )

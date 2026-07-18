import httpx
import pytest

from ailearn_api.config import Settings
from ailearn_api.models.admin_auth import ProfileRecord
from ailearn_api.profiles_client import fetch_profile
from ailearn_api.supabase_client import SupabaseUnavailableError

SETTINGS = Settings(
    supabase_url="https://example.supabase.co",
    supabase_secret_key="test-secret",
)

SAMPLE_ROW = {
    "id": "user-123",
    "email": "admin@example.com",
    "role": "admin",
}


@pytest.mark.anyio
async def test_fetch_profile_reads_expected_row() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path.endswith("/profiles")
        assert request.url.params["id"] == "eq.user-123"
        return httpx.Response(200, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        record = await fetch_profile(SETTINGS, "user-123", client=client)

    assert record == ProfileRecord.model_validate(SAMPLE_ROW)


@pytest.mark.anyio
async def test_fetch_profile_returns_none_for_missing_row() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[]))

    async with httpx.AsyncClient(transport=transport) as client:
        record = await fetch_profile(SETTINGS, "user-unknown", client=client)

    assert record is None


@pytest.mark.anyio
async def test_fetch_profile_raises_when_unconfigured() -> None:
    with pytest.raises(SupabaseUnavailableError, match="not configured"):
        await fetch_profile(Settings(supabase_url=None, supabase_secret_key=None), "user-123")

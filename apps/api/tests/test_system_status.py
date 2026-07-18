from datetime import UTC, datetime

import httpx
import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.models.system_status import SystemStatusRecord
from ailearn_api.supabase_client import SupabaseUnavailableError, fetch_system_status


def test_system_status_returns_sanitized_503_when_unconfigured(client: TestClient) -> None:
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )

    response = client.get("/api/v1/system-status")

    assert response.status_code == 503
    assert response.json() == {
        "detail": {
            "code": "supabase_unavailable",
            "message": "System status is unavailable.",
        }
    }


@pytest.mark.anyio
async def test_fetch_system_status_reads_expected_supabase_row() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["apikey"] == "test-secret"
        assert request.headers["Authorization"] == "Bearer test-secret"
        assert request.url.params["id"] == "eq.platform"
        return httpx.Response(
            200,
            json=[{"status": "operational", "checked_at": "2026-07-17T00:00:00Z"}],
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        record = await fetch_system_status(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            client=http_client,
        )

    assert record == SystemStatusRecord(
        status="operational",
        checked_at=datetime(2026, 7, 17, tzinfo=UTC),
    )


@pytest.mark.anyio
async def test_fetch_system_status_rejects_missing_row() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[]))

    async with httpx.AsyncClient(transport=transport) as http_client:
        with pytest.raises(SupabaseUnavailableError, match="missing"):
            await fetch_system_status(
                Settings(
                    supabase_url="https://example.supabase.co",
                    supabase_secret_key="test-secret",
                ),
                client=http_client,
            )

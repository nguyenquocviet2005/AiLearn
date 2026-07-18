import httpx
import pytest

from ailearn_api.config import Settings
from ailearn_api.models.student import StudentRecord
from ailearn_api.students_client import fetch_student
from ailearn_api.supabase_client import SupabaseUnavailableError

SAMPLE_ROW = {
    "id": "stu_demo_01",
    "display_name": "Demo Student",
    "class_id": "class_g7a_demo",
    "created_at": "2026-07-18T00:00:00Z",
}


@pytest.mark.anyio
async def test_fetch_student_reads_expected_row() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path.endswith("/students")
        assert request.url.params["id"] == "eq.stu_demo_01"
        return httpx.Response(200, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        record = await fetch_student(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            "stu_demo_01",
            client=http_client,
        )

    assert record == StudentRecord.model_validate(SAMPLE_ROW)


@pytest.mark.anyio
async def test_fetch_student_rejects_missing_row() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[]))

    async with httpx.AsyncClient(transport=transport) as http_client:
        with pytest.raises(SupabaseUnavailableError, match="missing"):
            await fetch_student(
                Settings(
                    supabase_url="https://example.supabase.co",
                    supabase_secret_key="test-secret",
                ),
                "stu_unknown",
                client=http_client,
            )


@pytest.mark.anyio
async def test_fetch_student_raises_when_unconfigured() -> None:
    with pytest.raises(SupabaseUnavailableError, match="not configured"):
        await fetch_student(Settings(supabase_url=None, supabase_secret_key=None), "stu_demo_01")

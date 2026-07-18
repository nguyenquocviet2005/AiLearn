import httpx
import pytest

from ailearn_api.scripts.seed_fixtures import _evidence_event_rows, _student_rows, _upsert


def test_student_rows_loads_all_demo_students() -> None:
    rows = _student_rows()

    assert len(rows) == 40
    assert rows[0] == {
        "id": "stu_g7_001",
        "display_name": "Học sinh 001",
        "class_id": "class_g7a_demo",
    }


def test_evidence_event_rows_loads_and_validates_all_events() -> None:
    rows = _evidence_event_rows()

    assert len(rows) == 800
    assert rows[0]["id"] == "ev_stu_g7_001_001"
    assert rows[0]["schema_version"] == "1"
    assert all(row["schema_version"] == "1" for row in rows)


@pytest.mark.anyio
async def test_upsert_sends_merge_duplicates_prefer_header() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/students")
        assert request.headers["Prefer"] == "resolution=merge-duplicates,return=minimal"
        assert request.headers["apikey"] == "test-secret"
        return httpx.Response(201, json=[])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        await _upsert(
            client,
            "https://example.supabase.co",
            "test-secret",
            "students",
            [{"id": "stu_demo_01", "display_name": "Demo", "class_id": "class_g7a_demo"}],
        )

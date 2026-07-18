from datetime import UTC, datetime
from unittest.mock import AsyncMock

import httpx
import pytest
from ailearn_schemas import EvidenceEventV1
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.evidence_client import (
    fetch_evidence_event,
    fetch_evidence_events_for_student,
    insert_evidence_event,
)
from ailearn_api.models.evidence import EvidenceEventRecord
from ailearn_api.supabase_client import SupabaseUnavailableError

SAMPLE_EVENT = EvidenceEventV1(
    schema_version="1",
    id="ev_demo_001",
    student_id="stu_demo_01",
    session_id="sess_demo_readiness_01",
    skill_id="skill_fractions_equivalent",
    item_id="item_eq_frac_01",
    is_correct=False,
    recorded_at=datetime(2026, 7, 18, 1, 0, tzinfo=UTC),
    lesson_id="lesson_demo_fractions_01",
    response_label="2/4 = 1/3",
)

SAMPLE_ROW = {
    "id": "ev_demo_001",
    "schema_version": "1",
    "student_id": "stu_demo_01",
    "session_id": "sess_demo_readiness_01",
    "skill_id": "skill_fractions_equivalent",
    "item_id": "item_eq_frac_01",
    "is_correct": False,
    "recorded_at": "2026-07-18T01:00:00Z",
    "lesson_id": "lesson_demo_fractions_01",
    "response_label": "2/4 = 1/3",
}

CREATE_PAYLOAD = {
    "schema_version": "1",
    "id": "ev_demo_001",
    "student_id": "stu_demo_01",
    "session_id": "sess_demo_readiness_01",
    "skill_id": "skill_fractions_equivalent",
    "item_id": "item_eq_frac_01",
    "is_correct": False,
    "recorded_at": "2026-07-18T01:00:00Z",
    "lesson_id": "lesson_demo_fractions_01",
    "response_label": "2/4 = 1/3",
}


def test_create_evidence_event_returns_503_when_unconfigured(client: TestClient) -> None:
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )

    response = client.post("/api/v1/evidence-events", json=CREATE_PAYLOAD)

    assert response.status_code == 503
    assert response.json() == {
        "detail": {
            "code": "supabase_unavailable",
            "message": "Evidence storage is unavailable.",
        }
    }


def test_get_evidence_event_returns_503_when_unconfigured(client: TestClient) -> None:
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )

    response = client.get("/api/v1/evidence-events/ev_demo_001")

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_evidence_event_write_and_read_round_trip(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    record = EvidenceEventRecord.model_validate(SAMPLE_ROW)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.insert_evidence_event",
        AsyncMock(return_value=record),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_event",
        AsyncMock(return_value=record),
    )
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )

    create_response = client.post("/api/v1/evidence-events", json=CREATE_PAYLOAD)
    assert create_response.status_code == 201
    assert create_response.json()["id"] == "ev_demo_001"

    get_response = client.get("/api/v1/evidence-events/ev_demo_001")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == "ev_demo_001"
    assert get_response.json()["is_correct"] is False


def test_get_evidence_event_returns_404_when_missing(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_event",
        AsyncMock(side_effect=SupabaseUnavailableError("Evidence event row is missing")),
    )
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )

    response = client.get("/api/v1/evidence-events/ev_missing")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "evidence_event_not_found"


@pytest.mark.anyio
async def test_insert_evidence_event_posts_expected_row() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path.endswith("/evidence_events")
        assert request.headers["apikey"] == "test-secret"
        assert request.headers["Prefer"] == "return=representation"
        return httpx.Response(201, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        record = await insert_evidence_event(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            SAMPLE_EVENT,
            client=http_client,
        )

    assert record == EvidenceEventRecord.model_validate(SAMPLE_ROW)


@pytest.mark.anyio
async def test_fetch_evidence_event_reads_expected_row() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.params["id"] == "eq.ev_demo_001"
        return httpx.Response(200, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        record = await fetch_evidence_event(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            "ev_demo_001",
            client=http_client,
        )

    assert record.id == "ev_demo_001"


@pytest.mark.anyio
async def test_fetch_evidence_event_rejects_missing_row() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[]))

    async with httpx.AsyncClient(transport=transport) as http_client:
        with pytest.raises(SupabaseUnavailableError, match="missing"):
            await fetch_evidence_event(
                Settings(
                    supabase_url="https://example.supabase.co",
                    supabase_secret_key="test-secret",
                ),
                "ev_missing",
                client=http_client,
            )


@pytest.mark.anyio
async def test_insert_evidence_event_replays_existing_row_on_conflict() -> None:
    """A retried write with the same id hits the PK conflict and is idempotent."""

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            return httpx.Response(409, json={"message": "duplicate key value"})
        assert request.method == "GET"
        assert request.url.params["id"] == "eq.ev_demo_001"
        return httpx.Response(200, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        record = await insert_evidence_event(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            SAMPLE_EVENT,
            client=http_client,
        )

    assert record == EvidenceEventRecord.model_validate(SAMPLE_ROW)


@pytest.mark.anyio
async def test_fetch_evidence_events_for_student_filters_by_student_and_lesson() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["student_id"] == "eq.stu_demo_01"
        assert request.url.params["lesson_id"] == "eq.lesson_demo_fractions_01"
        return httpx.Response(200, json=[SAMPLE_ROW])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as http_client:
        records = await fetch_evidence_events_for_student(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            "stu_demo_01",
            "lesson_demo_fractions_01",
            client=http_client,
        )

    assert records == [EvidenceEventRecord.model_validate(SAMPLE_ROW)]


def test_create_evidence_event_accepts_optional_confidence(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    row_with_confidence = {**SAMPLE_ROW, "confidence": 0.9}
    record = EvidenceEventRecord.model_validate(row_with_confidence)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.insert_evidence_event",
        AsyncMock(return_value=record),
    )
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )

    response = client.post("/api/v1/evidence-events", json={**CREATE_PAYLOAD, "confidence": 0.9})

    assert response.status_code == 201
    assert response.json()["confidence"] == 0.9


def test_create_evidence_event_omits_confidence_by_default(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    record = EvidenceEventRecord.model_validate(SAMPLE_ROW)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.insert_evidence_event",
        AsyncMock(return_value=record),
    )
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )

    response = client.post("/api/v1/evidence-events", json=CREATE_PAYLOAD)

    assert response.status_code == 201
    assert response.json()["confidence"] is None


def test_create_evidence_event_rejects_out_of_range_confidence(
    client: TestClient,
) -> None:
    app = client.app
    app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )

    response = client.post("/api/v1/evidence-events", json={**CREATE_PAYLOAD, "confidence": 1.5})

    assert response.status_code == 422


@pytest.mark.anyio
async def test_fetch_evidence_events_for_student_returns_empty_list_when_none_found() -> None:
    transport = httpx.MockTransport(lambda request: httpx.Response(200, json=[]))

    async with httpx.AsyncClient(transport=transport) as http_client:
        records = await fetch_evidence_events_for_student(
            Settings(
                supabase_url="https://example.supabase.co",
                supabase_secret_key="test-secret",
            ),
            "stu_no_evidence",
            "lesson_demo_fractions_01",
            client=http_client,
        )

    assert records == []

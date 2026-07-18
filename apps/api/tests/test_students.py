from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.models.evidence import EvidenceEventRecord
from ailearn_api.models.student import StudentRecord
from ailearn_api.supabase_client import SupabaseUnavailableError

STUDENT = StudentRecord(
    id="stu_demo_01",
    display_name="Demo Student",
    class_id="class_g7a_demo",
    created_at=datetime(2026, 7, 18, tzinfo=UTC),
)

EVENT_ROW = {
    "id": "ev_demo_001",
    "schema_version": "1",
    "student_id": "stu_demo_01",
    "session_id": "sess_demo_readiness_01",
    "skill_id": "skill_ratio_proportion_basics",
    "item_id": "item_inv_prop_01",
    "is_correct": True,
    "recorded_at": "2026-07-18T01:00:00Z",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "response_label": "9",
}


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


def test_get_diagnostic_profile_returns_503_when_unconfigured(client: TestClient) -> None:
    response = client.get("/api/v1/students/stu_demo_01/diagnostic-profile")

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_get_diagnostic_profile_returns_404_when_student_unknown(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student",
        AsyncMock(side_effect=SupabaseUnavailableError("Student row is missing")),
    )

    response = client.get("/api/v1/students/stu_unknown/diagnostic-profile")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "student_not_found"


def test_get_diagnostic_profile_returns_404_when_no_evidence_yet(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student", AsyncMock(return_value=STUDENT)
    )
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_evidence_events_for_student",
        AsyncMock(return_value=[]),
    )

    response = client.get("/api/v1/students/stu_demo_01/diagnostic-profile")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "diagnostic_profile_not_found"


def test_get_diagnostic_profile_returns_503_when_evidence_unavailable(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student", AsyncMock(return_value=STUDENT)
    )
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_evidence_events_for_student",
        AsyncMock(side_effect=SupabaseUnavailableError("Supabase request failed")),
    )

    response = client.get("/api/v1/students/stu_demo_01/diagnostic-profile")

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_get_diagnostic_profile_computes_profile_live_from_evidence(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student", AsyncMock(return_value=STUDENT)
    )
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_evidence_events_for_student",
        AsyncMock(return_value=[EvidenceEventRecord.model_validate(EVENT_ROW)]),
    )

    response = client.get("/api/v1/students/stu_demo_01/diagnostic-profile")

    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1"
    assert body["student_id"] == "stu_demo_01"
    assert body["lesson_id"] == "lesson_g7_inverse_proportion_01"
    assert body["readiness_status"] in {"ready", "needs_support", "abstained"}


def test_get_progress_returns_503_when_unconfigured(client: TestClient) -> None:
    response = client.get("/api/v1/students/stu_demo_01/progress")

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_get_progress_returns_404_when_student_unknown(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student",
        AsyncMock(side_effect=SupabaseUnavailableError("Student row is missing")),
    )

    response = client.get("/api/v1/students/stu_unknown/progress")

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "student_not_found"


def test_get_progress_returns_empty_view_before_any_evidence(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Progress returns an empty view (not a 404) before evidence exists."""
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student", AsyncMock(return_value=STUDENT)
    )
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_evidence_events_for_student",
        AsyncMock(return_value=[]),
    )

    response = client.get("/api/v1/students/stu_demo_01/progress")

    assert response.status_code == 200
    body = response.json()
    assert body["total_attempts"] == 0
    assert body["skills"] == []


def test_get_progress_reports_evidence_sufficiency_per_skill(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Progress states are evidence sufficiency, never a score or ranking."""
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_student", AsyncMock(return_value=STUDENT)
    )
    monkeypatch.setattr(
        "ailearn_api.routes.students.fetch_evidence_events_for_student",
        AsyncMock(return_value=[EvidenceEventRecord.model_validate(EVENT_ROW)]),
    )

    response = client.get("/api/v1/students/stu_demo_01/progress")

    assert response.status_code == 200
    body = response.json()
    assert body["total_attempts"] == 1
    assert len(body["skills"]) == 1
    skill = body["skills"][0]
    assert skill["skill_id"] == "skill_ratio_proportion_basics"
    assert skill["state"] in {
        "sufficient_secure",
        "sufficient_gap",
        "emerging",
        "insufficient",
    }

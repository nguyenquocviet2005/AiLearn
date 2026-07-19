from datetime import UTC, datetime
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.diagnostic_session_store import _sessions
from ailearn_api.models.evidence import EvidenceEventRecord

LESSON_ID = "lesson_g7_inverse_proportion_01"
RECORDED_AT = datetime(2026, 7, 19, 1, 0, tzinfo=UTC)


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )


@pytest.fixture(autouse=True)
def _clear_sessions() -> None:
    _sessions.clear()
    yield
    _sessions.clear()


def _record(item_id: str, skill_id: str, *, is_correct: bool) -> EvidenceEventRecord:
    return EvidenceEventRecord(
        id=f"ev_{item_id}",
        schema_version="1",
        student_id="stu_probe_01",
        session_id="sess_seed",
        skill_id=skill_id,
        item_id=item_id,
        is_correct=is_correct,
        recorded_at=RECORDED_AT,
        lesson_id=LESSON_ID,
        response_label="anything",
    )


def _fake_fetch(records: list[EvidenceEventRecord]) -> Any:
    async def fake(settings: Settings, student_id: str, lesson_id: str) -> Any:
        return records

    return fake


def test_probe_returns_exactly_one_item(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    records = [_record("item_inv_prop_04", "skill_inverse_proportion_definition", is_correct=False)]
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        _fake_fetch(records),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["item_id"] == "item_inv_prop_05"
    assert body["reason"] == "targets_primary_hypothesis"
    for option in body["items"][0]["options"]:
        assert set(option.keys()) == {"label"}


def test_probe_returns_404_when_no_evidence_recorded(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        _fake_fetch([]),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_02", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "no_evidence_recorded"


def test_probe_returns_404_for_unknown_lesson(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_03", "lesson_id": "lesson_unknown"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "lesson_not_found"


def test_probe_reuses_item_when_every_item_already_answered(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    from ailearn_api.curriculum import ITEMS

    records = [
        _record(item.item_id, item.skill_ids[0], is_correct=True)
        for item in ITEMS.items.values()
    ]
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        _fake_fetch(records),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_04", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 201
    body = response.json()
    assert len(body["items"]) == 1
    assert body["reason"] == "reuse_least_recent"


def test_probe_returns_503_when_evidence_storage_unavailable(client: TestClient) -> None:
    _configure(client)
    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_05", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"

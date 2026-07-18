from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.models.evidence import EvidenceEventRecord
from ailearn_api.supabase_client import SupabaseUnavailableError

LESSON_ID = "lesson_g7_inverse_proportion_01"

# A direct/inverse-confusion evidence pattern: correct on foundations, wrong on
# the two items whose distractor is mis_direct_inverse_confusion.
CONFUSED_EVENTS = [
    EvidenceEventRecord.model_validate(row)
    for row in [
        {
            "id": "ev_1",
            "schema_version": "1",
            "student_id": "stu_probe_01",
            "session_id": "sess_probe_01_readiness",
            "skill_id": "skill_ratio_proportion_basics",
            "item_id": "item_inv_prop_01",
            "is_correct": True,
            "recorded_at": "2026-07-18T01:00:00Z",
            "lesson_id": LESSON_ID,
            "response_label": "9",
        },
        {
            "id": "ev_2",
            "schema_version": "1",
            "student_id": "stu_probe_01",
            "session_id": "sess_probe_01_readiness",
            "skill_id": "skill_fraction_multiplication",
            "item_id": "item_inv_prop_02",
            "is_correct": True,
            "recorded_at": "2026-07-18T01:01:00Z",
            "lesson_id": LESSON_ID,
            "response_label": "2/3",
        },
        {
            "id": "ev_3",
            "schema_version": "1",
            "student_id": "stu_probe_01",
            "session_id": "sess_probe_01_readiness",
            "skill_id": "skill_direct_proportion",
            "item_id": "item_inv_prop_03",
            "is_correct": True,
            "recorded_at": "2026-07-18T01:02:00Z",
            "lesson_id": LESSON_ID,
            "response_label": "12",
        },
        {
            "id": "ev_4",
            "schema_version": "1",
            "student_id": "stu_probe_01",
            "session_id": "sess_probe_01_readiness",
            "skill_id": "skill_inverse_proportion_definition",
            "item_id": "item_inv_prop_04",
            "is_correct": False,
            "recorded_at": "2026-07-18T01:03:00Z",
            "lesson_id": LESSON_ID,
            "response_label": "y = kx (k ≠ 0)",
        },
        {
            "id": "ev_5",
            "schema_version": "1",
            "student_id": "stu_probe_01",
            "session_id": "sess_probe_01_readiness",
            "skill_id": "skill_inverse_proportion_definition",
            "item_id": "item_inv_prop_05",
            "is_correct": False,
            "recorded_at": "2026-07-18T01:04:00Z",
            "lesson_id": LESSON_ID,
            "response_label": "Tăng lên",
        },
    ]
]


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


def test_probe_returns_503_when_unconfigured(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_probe_rejects_unknown_lesson(client: TestClient) -> None:
    _configure(client)

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": "lesson_unknown"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "lesson_not_found"


def test_probe_returns_404_when_no_evidence_yet(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        AsyncMock(return_value=[]),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "probe_no_evidence"


def test_probe_returns_503_when_evidence_storage_unavailable(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        AsyncMock(side_effect=SupabaseUnavailableError("Supabase request failed")),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_probe_returns_unanswered_discriminating_item_with_reasons(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    # Leave Supabase unconfigured so the created probe "session" uses the local
    # in-memory fallback rather than attempting a real durable-store write.
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        AsyncMock(return_value=CONFUSED_EVENTS),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_01", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 201
    body = response.json()
    answered = {event.item_id for event in CONFUSED_EVENTS}
    assert len(body["items"]) == 1
    assert body["items"][0]["item_id"] not in answered
    assert body["probe"]["reason_codes"]
    assert body["probe"]["focus_skill_ids"]
    # The probe item must not expose the answer key.
    for option in body["items"][0]["options"]:
        assert set(option.keys()) == {"label"}


def test_probe_returns_404_when_every_item_is_answered(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)

    from ailearn_api.curriculum import ITEMS

    all_answered = [
        EvidenceEventRecord(
            id=f"ev_all_{index}",
            schema_version="1",
            student_id="stu_probe_02",
            session_id="sess_probe_02_readiness",
            skill_id=item.skill_ids[0],
            item_id=item.item_id,
            is_correct=True,
            recorded_at=datetime(2026, 7, 18, 1, index, tzinfo=UTC),
            lesson_id=LESSON_ID,
            response_label=next(o.label for o in item.options if o.is_correct),
        )
        for index, item in enumerate(sorted(ITEMS.items.values(), key=lambda i: i.item_id))
    ]
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_events_for_student",
        AsyncMock(return_value=all_answered),
    )

    response = client.post(
        "/api/v1/diagnostics/probe",
        json={"student_id": "stu_probe_02", "lesson_id": LESSON_ID},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "probe_exhausted"

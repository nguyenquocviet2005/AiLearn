from collections.abc import Iterator
from typing import Any

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.diagnostic_session_store import _sessions
from ailearn_api.models.evidence import EvidenceEventRecord


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


@pytest.fixture(autouse=True)
def _clear_sessions() -> Iterator[None]:
    _sessions.clear()
    yield
    _sessions.clear()


def _fake_insert_evidence_event() -> Any:
    saved: dict[str, EvidenceEventRecord] = {}

    async def fake_insert(
        settings: Settings, event: Any, client: Any = None
    ) -> EvidenceEventRecord:
        if event.id in saved:
            return saved[event.id]
        record = EvidenceEventRecord(
            id=event.id,
            schema_version=event.schema_version,
            student_id=event.student_id,
            session_id=event.session_id,
            skill_id=event.skill_id,
            item_id=event.item_id,
            is_correct=event.is_correct,
            recorded_at=event.recorded_at,
            lesson_id=event.lesson_id,
            response_label=event.response_label,
            confidence=event.confidence,
        )
        saved[event.id] = record
        return record

    fake_insert.saved = saved  # type: ignore[attr-defined]
    return fake_insert


def test_start_session_returns_items_without_answer_key(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_01", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["session_id"].startswith("sess_stu_demo_01_readiness_")
    assert body["target_skill_id"]
    assert 3 <= len(body["items"]) <= 7
    for item in body["items"]:
        assert set(item.keys()) == {"item_id", "skill_ids", "form", "stem", "options"}
        for option in item["options"]:
            assert set(option.keys()) == {"label"}


def test_start_session_returns_422_when_readiness_session_cannot_be_built(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    def raise_value_error(*args: Any, **kwargs: Any) -> Any:
        raise ValueError("not enough assessment items to build a readiness session")

    monkeypatch.setattr("ailearn_api.routes.diagnostics.build_readiness_session", raise_value_error)

    response = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_01", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "readiness_session_unavailable"


def test_start_session_returns_404_for_unknown_lesson(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_01", "lesson_id": "lesson_unknown"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "lesson_not_found"


def test_submit_response_returns_404_for_unknown_session(client: TestClient) -> None:
    response = client.post(
        "/api/v1/diagnostics/sess_unknown/responses",
        json={"item_id": "item_inv_prop_01", "response_label": "9"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "diagnostic_session_not_found"


def test_submit_response_returns_404_for_item_outside_session(client: TestClient) -> None:
    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_01", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    session_id = start.json()["session_id"]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={"item_id": "item_not_in_session", "response_label": "9"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "diagnostic_item_not_found"


def test_submit_response_validates_response_label(client: TestClient) -> None:
    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_02", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    item_id = start.json()["items"][0]["item_id"]
    session_id = start.json()["session_id"]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={"item_id": item_id, "response_label": "not-a-real-option"},
    )

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "invalid_response_label"


def test_submit_response_passes_confidence_through(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    fake_insert = _fake_insert_evidence_event()
    monkeypatch.setattr("ailearn_api.routes.diagnostics.insert_evidence_event", fake_insert)

    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_confidence", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    session_id = start.json()["session_id"]
    item = start.json()["items"][0]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={
            "item_id": item["item_id"],
            "response_label": item["options"][0]["label"],
            "confidence": 0.6,
        },
    )

    assert response.status_code == 200
    assert response.json()["evidence_event"]["confidence"] == 0.6


def test_submit_response_confidence_is_optional(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    fake_insert = _fake_insert_evidence_event()
    monkeypatch.setattr("ailearn_api.routes.diagnostics.insert_evidence_event", fake_insert)

    start = client.post(
        "/api/v1/diagnostics/start",
        json={
            "student_id": "stu_demo_no_confidence",
            "lesson_id": "lesson_g7_inverse_proportion_01",
        },
    )
    session_id = start.json()["session_id"]
    item = start.json()["items"][0]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={"item_id": item["item_id"], "response_label": item["options"][0]["label"]},
    )

    assert response.status_code == 200
    assert response.json()["evidence_event"]["confidence"] is None


def test_submit_response_rejects_out_of_range_confidence(client: TestClient) -> None:
    start = client.post(
        "/api/v1/diagnostics/start",
        json={
            "student_id": "stu_demo_bad_confidence",
            "lesson_id": "lesson_g7_inverse_proportion_01",
        },
    )
    session_id = start.json()["session_id"]
    item = start.json()["items"][0]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={
            "item_id": item["item_id"],
            "response_label": item["options"][0]["label"],
            "confidence": 1.5,
        },
    )

    assert response.status_code == 422


def test_submit_response_is_idempotent_on_retry(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    fake_insert = _fake_insert_evidence_event()
    monkeypatch.setattr("ailearn_api.routes.diagnostics.insert_evidence_event", fake_insert)

    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_03", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    session_id = start.json()["session_id"]
    item = start.json()["items"][0]
    body = {"item_id": item["item_id"], "response_label": item["options"][0]["label"]}

    first = client.post(f"/api/v1/diagnostics/{session_id}/responses", json=body)
    second = client.post(f"/api/v1/diagnostics/{session_id}/responses", json=body)

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json()["evidence_event"]["id"] == second.json()["evidence_event"]["id"]
    assert len(fake_insert.saved) == 1  # type: ignore[attr-defined]


def test_submit_response_tracks_remaining_items_and_completion(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    fake_insert = _fake_insert_evidence_event()
    monkeypatch.setattr("ailearn_api.routes.diagnostics.insert_evidence_event", fake_insert)

    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_04", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    session_id = start.json()["session_id"]
    items = start.json()["items"]

    responses = [
        client.post(
            f"/api/v1/diagnostics/{session_id}/responses",
            json={"item_id": item["item_id"], "response_label": item["options"][0]["label"]},
        )
        for item in items
    ]

    for response in responses[:-1]:
        assert response.json()["session_complete"] is False
        assert response.json()["remaining_item_ids"] != []

    assert responses[-1].json()["session_complete"] is True
    assert responses[-1].json()["remaining_item_ids"] == []


def test_submit_response_returns_503_when_evidence_storage_unavailable(client: TestClient) -> None:
    start = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_demo_05", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    session_id = start.json()["session_id"]
    item = start.json()["items"][0]

    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={"item_id": item["item_id"], "response_label": item["options"][0]["label"]},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"

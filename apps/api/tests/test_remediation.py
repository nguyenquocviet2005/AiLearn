from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ailearn_api.routes.remediation import _processed_attempts, _sessions


@pytest.fixture(autouse=True)
def _clear_remediation_state() -> Iterator[None]:
    _sessions.clear()
    _processed_attempts.clear()
    yield
    _sessions.clear()
    _processed_attempts.clear()


PROFILE_NEEDS_SUPPORT = {
    "schema_version": "1",
    "student_id": "stu_demo_repair_01",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "target_skill_id": "skill_word_problem_work_rate",
    "readiness_status": "needs_support",
    "confidence": 0.8,
    "root_causes": [
        {
            "skill_id": "skill_ratio_proportion_basics",
            "rank": 1,
            "supporting_evidence_ids": ["ev_1"],
            "contradicting_evidence_ids": [],
        }
    ],
    "generated_at": "2026-07-19T10:50:00Z",
}

PROFILE_ABSTAINED_WITH_ROOT_CAUSE = {
    "schema_version": "1",
    "student_id": "stu_demo_confirm_01",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "target_skill_id": "skill_word_problem_work_rate",
    "readiness_status": "abstained",
    "confidence": 0.3,
    "root_causes": [
        {
            "skill_id": "skill_solve_unknown_value",
            "rank": 1,
            "supporting_evidence_ids": ["ev_1"],
            "contradicting_evidence_ids": ["ev_2"],
        }
    ],
    "generated_at": "2026-07-19T15:30:00Z",
}


def test_start_session_needs_support_enters_repair(client: TestClient) -> None:
    response = client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    assert response.status_code == 200
    body = response.json()
    assert body["path"]["current_state"] == "REPAIR"
    assert body["path"]["student_id"] == "stu_demo_repair_01"
    assert body["current_step_kind"] == "worked_example"
    assert body["is_complete"] is False
    assert body["escalation_reason"] is None
    assert body["content"]["representation"] in {"text", "table", "diagram"}


def test_start_session_abstained_enters_confirmation(client: TestClient) -> None:
    response = client.post(
        "/api/v1/remediation/sessions",
        json={"profile": PROFILE_ABSTAINED_WITH_ROOT_CAUSE},
    )

    assert response.status_code == 200
    assert response.json()["path"]["current_state"] == "CONFIRMATION"


def test_start_session_returns_422_for_invalid_profile(client: TestClient) -> None:
    response = client.post(
        "/api/v1/remediation/sessions", json={"profile": {"student_id": "stu_x"}}
    )

    assert response.status_code == 422


def test_submit_attempt_advances_session(client: TestClient) -> None:
    client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_repair_01",
            "step_id": "step_stu_demo_repair_01_worked_example",
            "is_correct": True,
            "attempt_id": "att_stu_demo_repair_01_worked_example_1",
        },
    )

    assert response.status_code == 200
    assert response.json()["current_step_kind"] == "guided_problem"


def test_submit_attempt_returns_404_for_unknown_student(client: TestClient) -> None:
    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_unknown",
            "step_id": "x",
            "is_correct": True,
            "attempt_id": "att_1",
        },
    )

    assert response.status_code == 404


def test_submit_attempt_replays_cached_response_on_repeated_attempt_id(
    client: TestClient,
) -> None:
    """A retried attempt_id does not advance the state machine a second time."""
    client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})
    body = {
        "student_id": "stu_demo_repair_01",
        "step_id": "step_stu_demo_repair_01_worked_example",
        "is_correct": True,
        "attempt_id": "att_stu_demo_repair_01_worked_example_1",
    }

    first = client.post("/api/v1/remediation/attempts", json=body)
    second = client.post("/api/v1/remediation/attempts", json=body)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert second.json()["current_step_kind"] == "guided_problem"

    # A second attempt (new attempt_id, still correct) genuinely advances further.
    third = client.post(
        "/api/v1/remediation/attempts",
        json={**body, "attempt_id": "att_stu_demo_repair_01_guided_problem_1"},
    )
    assert third.json()["current_step_kind"] == "independent_problem"


def test_content_payload_includes_checkpoint_answer(client: TestClient) -> None:
    response = client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    assert "checkpoint_answer" in response.json()["content"]


def test_confirm_evidence_sufficient_moves_to_repair(client: TestClient) -> None:
    client.post(
        "/api/v1/remediation/sessions",
        json={"profile": PROFILE_ABSTAINED_WITH_ROOT_CAUSE},
    )

    response = client.post(
        "/api/v1/remediation/confirm",
        json={"student_id": "stu_demo_confirm_01", "evidence_sufficient": True},
    )

    assert response.status_code == 200
    assert response.json()["path"]["current_state"] == "REPAIR"


def test_confirm_evidence_insufficient_stays_in_confirmation(client: TestClient) -> None:
    client.post(
        "/api/v1/remediation/sessions",
        json={"profile": PROFILE_ABSTAINED_WITH_ROOT_CAUSE},
    )

    response = client.post(
        "/api/v1/remediation/confirm",
        json={"student_id": "stu_demo_confirm_01", "evidence_sufficient": False},
    )

    assert response.status_code == 200
    assert response.json()["path"]["current_state"] == "CONFIRMATION"


def test_confirm_returns_404_for_unknown_student(client: TestClient) -> None:
    response = client.post(
        "/api/v1/remediation/confirm",
        json={"student_id": "stu_unknown", "evidence_sufficient": True},
    )

    assert response.status_code == 404


def test_get_session_returns_current_state(client: TestClient) -> None:
    client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    response = client.get("/api/v1/remediation/sessions/stu_demo_repair_01")

    assert response.status_code == 200
    assert response.json()["path"]["current_state"] == "REPAIR"


def test_get_session_returns_404_for_unknown_student(client: TestClient) -> None:
    response = client.get("/api/v1/remediation/sessions/stu_unknown")

    assert response.status_code == 404

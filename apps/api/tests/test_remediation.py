from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.routes.remediation import (
    _processed_attempts,
    _processed_exit_tickets,
    _sessions,
)


def _configure(client: TestClient) -> None:
    """Force the deterministic in-memory session store, bypassing any real Supabase
    credentials a local .env might supply — grading correctness must not depend on
    live network access."""
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )


@pytest.fixture(autouse=True)
def _clear_remediation_state(client: TestClient) -> Iterator[None]:
    """Keep remediation route tests on the in-memory store and wipe session state."""
    _configure(client)
    _sessions.clear()
    _processed_attempts.clear()
    _processed_exit_tickets.clear()
    yield
    _sessions.clear()
    _processed_attempts.clear()
    _processed_exit_tickets.clear()
    client.app.dependency_overrides.pop(get_settings, None)


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

PROFILE_GRADABLE_REPAIR = {
    "schema_version": "1",
    "student_id": "stu_demo_gradable_01",
    "lesson_id": "lesson_g7_inverse_proportion_01",
    "target_skill_id": "skill_word_problem_work_rate",
    "readiness_status": "needs_support",
    "confidence": 0.8,
    "root_causes": [
        {
            "skill_id": "skill_distinguish_direct_inverse",
            "rank": 1,
            "supporting_evidence_ids": ["ev_1"],
            "contradicting_evidence_ids": [],
        }
    ],
    "generated_at": "2026-07-19T10:50:00Z",
}

# One valid accepted answer per real template, keyed by template_id — used so the
# test helper can advance any persona's path regardless of which step happens to
# land on a gradable template.
_CORRECT_RESPONSES = {
    "tpl_repair_direct_vs_inverse_table": "tỉ lệ nghịch",
    "tpl_repair_inverse_definition_diagram": "4",
    "tpl_repair_computation_steps_text": "6",
    "tpl_repair_word_problem_table": "nhiều hơn",
    "tpl_practice_equal_ratios_text": "36, 24, 18",
    "tpl_transfer_multistep_table": "15",
}


def _advance_past_worked_example(
    client: TestClient, profile: dict[str, object]
) -> dict[str, object]:
    """Start a session and self-report the demonstration (worked_example) step so
    the path lands on the first genuinely graded step (guided_problem)."""
    client.post("/api/v1/remediation/sessions", json={"profile": profile})
    student_id = profile["student_id"]
    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": student_id,
            "step_id": f"step_{student_id}_worked_example",
            "is_correct": True,
            "attempt_id": f"att_{student_id}_worked_example_setup",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["current_step_kind"] == "guided_problem"
    assert body["content"]["is_gradable"] is True
    return body


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
    _configure(client)
    started = client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})
    assert started.status_code == 200
    # The worked_example step is a demonstration: self-reported, not graded.
    assert started.json()["content"]["is_gradable"] is False
    assert started.json()["content"]["source"] == "template"

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
    _configure(client)
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

    # A second attempt (new attempt_id) genuinely advances further. The
    # guided_problem step here happens to resolve to a gradable template, so it is
    # submitted as a `response`, not a self-reported `is_correct`.
    guided = second.json()["content"]["template_id"]
    third = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": body["student_id"],
            "step_id": "step_stu_demo_repair_01_guided_problem",
            "response": _CORRECT_RESPONSES[guided],
            "attempt_id": "att_stu_demo_repair_01_guided_problem_1",
        },
    )
    assert third.json()["current_step_kind"] == "independent_problem"


def test_content_payload_never_includes_the_answer_key(client: TestClient) -> None:
    _configure(client)
    response = client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    content = response.json()["content"]
    assert "checkpoint_answer" not in content
    assert "accepted_answers" not in content
    # The first step (worked_example) is a self-reported demonstration.
    assert content["is_gradable"] is False
    assert content["source"] == "template"


def test_submit_attempt_requires_is_correct_for_self_report_step(client: TestClient) -> None:
    _configure(client)
    client.post("/api/v1/remediation/sessions", json={"profile": PROFILE_NEEDS_SUPPORT})

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_repair_01",
            "step_id": "step_stu_demo_repair_01_worked_example",
            "response": "something",
            "attempt_id": "att_self_report_1",
        },
    )

    assert response.status_code == 422


def test_gradable_checkpoint_never_includes_the_answer_key(client: TestClient) -> None:
    _configure(client)
    guided = _advance_past_worked_example(client, PROFILE_GRADABLE_REPAIR)

    content = guided["content"]
    assert "checkpoint_answer" not in content
    assert "accepted_answers" not in content
    assert content["is_gradable"] is True


def test_submit_attempt_grades_a_correct_response_server_side(client: TestClient) -> None:
    _configure(client)
    guided = _advance_past_worked_example(client, PROFILE_GRADABLE_REPAIR)
    template_id = guided["content"]["template_id"]

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_gradable_01",
            "step_id": "step_stu_demo_gradable_01_guided_problem",
            "response": _CORRECT_RESPONSES[template_id],
            "attempt_id": "att_gradable_1",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["last_attempt_correct"] is True
    assert body["current_step_kind"] == "independent_problem"


def test_submit_attempt_grades_an_incorrect_response_server_side(client: TestClient) -> None:
    _configure(client)
    _advance_past_worked_example(client, PROFILE_GRADABLE_REPAIR)

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_gradable_01",
            "step_id": "step_stu_demo_gradable_01_guided_problem",
            "response": "hoàn toàn sai",
            "attempt_id": "att_gradable_2",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["last_attempt_correct"] is False
    # A wrong answer restarts the sequence under a different representation, so the
    # path returns to the worked_example demonstration rather than advancing.
    assert body["current_step_kind"] == "worked_example"
    assert body["path"]["representation"] != "table"


def test_submit_attempt_ignores_client_supplied_is_correct_for_gradable_step(
    client: TestClient,
) -> None:
    """A client claiming is_correct=True on a gradable step must not be trusted."""
    _configure(client)
    _advance_past_worked_example(client, PROFILE_GRADABLE_REPAIR)

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_gradable_01",
            "step_id": "step_stu_demo_gradable_01_guided_problem",
            "response": "hoàn toàn sai",  # wrong
            "is_correct": True,  # attempted client-side cheat, must be ignored
            "attempt_id": "att_gradable_3",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["last_attempt_correct"] is False
    assert body["current_step_kind"] == "worked_example"


def test_submit_attempt_requires_response_for_gradable_step(client: TestClient) -> None:
    _configure(client)
    _advance_past_worked_example(client, PROFILE_GRADABLE_REPAIR)

    response = client.post(
        "/api/v1/remediation/attempts",
        json={
            "student_id": "stu_demo_gradable_01",
            "step_id": "step_stu_demo_gradable_01_guided_problem",
            "is_correct": True,
            "attempt_id": "att_gradable_4",
        },
    )

    assert response.status_code == 422


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


def _complete_remediation(client: TestClient, profile: dict[str, object]) -> dict[str, object]:
    started = client.post("/api/v1/remediation/sessions", json={"profile": profile})
    assert started.status_code == 200
    latest = started.json()
    for index in range(5):
        content = latest["content"]
        body = {
            "student_id": profile["student_id"],
            "step_id": f"step_{profile['student_id']}_{latest['current_step_kind']}",
            "attempt_id": f"att_exit_{index}",
        }
        if content["is_gradable"]:
            body["response"] = _CORRECT_RESPONSES[content["template_id"]]
        else:
            body["is_correct"] = True
        response = client.post("/api/v1/remediation/attempts", json=body)
        assert response.status_code == 200
        latest = response.json()
    assert latest["is_complete"] is True
    assert latest["transfer_outcome"] is True
    return latest


def test_exit_ticket_records_passing_transfer_idempotently(client: TestClient) -> None:
    completed = _complete_remediation(client, PROFILE_NEEDS_SUPPORT)
    ticket = completed["exit_ticket"]
    body = {
        "student_id": PROFILE_NEEDS_SUPPORT["student_id"],
        "ticket_id": ticket["id"],
        "response_label": "Giảm xuống",
        "submission_id": "exit_1",
    }

    first = client.post("/api/v1/remediation/exit-tickets", json=body)
    second = client.post("/api/v1/remediation/exit-tickets", json=body)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["outcome"]["kind"] == "transfer_passed"


def test_exit_ticket_reclassifies_when_new_evidence_contradicts_profile(
    client: TestClient,
) -> None:
    reset = client.post("/api/v1/demo/reset", json={"persona_id": "root-cause-changes"})
    profile = reset.json()["persona"]["profile"]
    completed = _complete_remediation(client, profile)

    response = client.post(
        "/api/v1/remediation/exit-tickets",
        json={
            "student_id": profile["student_id"],
            "ticket_id": completed["exit_ticket"]["id"],
            "response_label": "Tăng lên",
            "submission_id": "exit_reclassify_1",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["outcome"]["kind"] == "diagnosis_reclassified"
    assert (
        body["outcome"]["reclassified_profile"]["root_causes"][0]["skill_id"]
        == "skill_distinguish_direct_inverse"
    )
    assert body["remediation"]["is_complete"] is False


def test_exit_ticket_records_teacher_escalation(client: TestClient) -> None:
    reset = client.post("/api/v1/demo/reset", json={"persona_id": "teacher-escalation"})
    profile = reset.json()["persona"]["profile"]
    completed = _complete_remediation(client, profile)

    response = client.post(
        "/api/v1/remediation/exit-tickets",
        json={
            "student_id": profile["student_id"],
            "ticket_id": completed["exit_ticket"]["id"],
            "response_label": "Tăng lên",
            "submission_id": "exit_escalation_1",
        },
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["kind"] == "teacher_escalation"
    assert response.json()["remediation"]["path"]["current_state"] == "TEACHER_ESCALATION"

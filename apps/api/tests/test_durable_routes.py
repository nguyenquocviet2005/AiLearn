import copy
from typing import Any

from ailearn_api.config import Settings, get_settings
from ailearn_api.diagnostic_session_store import _sessions
from ailearn_api.durable_session_store import RemediationSessionRecord
from ailearn_api.models.evidence import EvidenceEventRecord


def _configure(client: Any) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


def _record(event: Any) -> EvidenceEventRecord:
    return EvidenceEventRecord(
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


def test_diagnostic_response_resumes_from_durable_session_after_process_memory_clears(
    client: Any, monkeypatch: Any
) -> None:
    _configure(client)
    stored: dict[str, Any] = {}

    async def save(_: Settings, session: Any) -> None:
        stored[session.session_id] = copy.deepcopy(session)

    async def fetch(_: Settings, session_id: str, __: Any) -> Any:
        return copy.deepcopy(stored.get(session_id))

    async def submitted(_: Settings, __: str) -> set[str]:
        return set()

    async def insert(_: Settings, event: Any) -> EvidenceEventRecord:
        return _record(event)

    monkeypatch.setattr("ailearn_api.routes.diagnostics.save_diagnostic_session", save)
    monkeypatch.setattr("ailearn_api.routes.diagnostics.fetch_diagnostic_session", fetch)
    monkeypatch.setattr(
        "ailearn_api.routes.diagnostics.fetch_evidence_item_ids_for_session", submitted
    )
    monkeypatch.setattr("ailearn_api.routes.diagnostics.insert_evidence_event", insert)

    started = client.post(
        "/api/v1/diagnostics/start",
        json={"student_id": "stu_resume_03", "lesson_id": "lesson_g7_inverse_proportion_01"},
    )
    assert started.status_code == 201
    session_id = started.json()["session_id"]
    _sessions.clear()

    item = started.json()["items"][0]
    response = client.post(
        f"/api/v1/diagnostics/{session_id}/responses",
        json={"item_id": item["item_id"], "response_label": item["options"][0]["label"]},
    )

    assert response.status_code == 200
    assert response.json()["evidence_event"]["session_id"] == session_id


def test_remediation_attempt_resumes_and_replays_after_process_memory_clears(
    client: Any, monkeypatch: Any
) -> None:
    _configure(client)
    stored: dict[str, RemediationSessionRecord] = {}

    async def save(_: Settings, record: RemediationSessionRecord) -> None:
        stored[record.session.student_id] = copy.deepcopy(record)

    async def fetch(_: Settings, student_id: str) -> RemediationSessionRecord | None:
        record = stored.get(student_id)
        return copy.deepcopy(record) if record is not None else None

    monkeypatch.setattr("ailearn_api.routes.remediation.save_remediation_session", save)
    monkeypatch.setattr("ailearn_api.routes.remediation.fetch_remediation_session", fetch)

    profile = {
        "schema_version": "1",
        "student_id": "stu_resume_04",
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
    }
    started = client.post("/api/v1/remediation/sessions", json={"profile": profile})
    assert started.status_code == 200
    _sessions.clear()
    attempt = {
        "student_id": profile["student_id"],
        "step_id": "step_stu_resume_04_worked_example",
        "is_correct": True,
        "attempt_id": "att_resume_1",
    }

    first = client.post("/api/v1/remediation/attempts", json=attempt)
    second = client.post("/api/v1/remediation/attempts", json=attempt)

    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    assert first.json()["current_step_kind"] == "guided_problem"


def test_exit_ticket_persists_transfer_as_diagnostic_evidence(
    client: Any, monkeypatch: Any
) -> None:
    _configure(client)
    stored: dict[str, RemediationSessionRecord] = {}
    captured: list[EvidenceEventRecord] = []

    async def save(_: Settings, record: RemediationSessionRecord) -> None:
        stored[record.session.student_id] = copy.deepcopy(record)

    async def fetch(_: Settings, student_id: str) -> RemediationSessionRecord | None:
        record = stored.get(student_id)
        return copy.deepcopy(record) if record is not None else None

    async def insert(_: Settings, event: Any) -> EvidenceEventRecord:
        record = _record(event)
        captured.append(record)
        return record

    monkeypatch.setattr("ailearn_api.routes.remediation.save_remediation_session", save)
    monkeypatch.setattr("ailearn_api.routes.remediation.fetch_remediation_session", fetch)
    monkeypatch.setattr("ailearn_api.routes.remediation.insert_evidence_event", insert)

    profile = {
        "schema_version": "1",
        "student_id": "stu_resume_05",
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
    }
    # One valid accepted answer per real template, in case a step lands on a
    # gradable template regardless of skill match (see packages/content selection).
    correct_responses = {
        "tpl_repair_direct_vs_inverse_table": "tỉ lệ nghịch",
        "tpl_repair_inverse_definition_diagram": "4",
        "tpl_repair_computation_steps_text": "6",
        "tpl_repair_word_problem_table": "nhiều hơn",
        "tpl_practice_equal_ratios_text": "36, 24, 18",
        "tpl_transfer_multistep_table": "15",
    }
    latest = client.post("/api/v1/remediation/sessions", json={"profile": profile}).json()
    for index in range(5):
        content = latest["content"]
        body: dict[str, Any] = {
            "student_id": profile["student_id"],
            "step_id": f"step_{profile['student_id']}_{latest['current_step_kind']}",
            "attempt_id": f"att_transfer_{index}",
        }
        if content["is_gradable"]:
            body["response"] = correct_responses[content["template_id"]]
        else:
            body["is_correct"] = True
        response = client.post("/api/v1/remediation/attempts", json=body)
        assert response.status_code == 200
        latest = response.json()

    response = client.post(
        "/api/v1/remediation/exit-tickets",
        json={
            "student_id": profile["student_id"],
            "ticket_id": latest["exit_ticket"]["id"],
            "response_label": "Giảm xuống",
            "submission_id": "exit_transfer_1",
        },
    )

    assert response.status_code == 200
    assert response.json()["outcome"]["kind"] == "transfer_passed"
    assert captured[0].id == "ev_stu_resume_05_exit_exit_transfer_1"
    assert captured[0].skill_id == "skill_word_problem_work_rate"
    assert captured[0].is_correct is True

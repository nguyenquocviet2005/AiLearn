import json
from datetime import datetime

from ailearn_schemas import EvidenceEventV1
from fastapi.testclient import TestClient

from ailearn_api.config import API_PROJECT_ROOT, Settings, get_settings
from ailearn_api.curriculum import CURRICULUM


def test_get_intervention_report_returns_seeded_outcome_personas(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/reports/report_demo_01")

    assert response.status_code == 200
    body = response.json()
    assert body["schema_version"] == "1"
    assert body["outcome_counts"] == {
        "passed_transfer": 1,
        "still_struggling": 1,
        "root_cause_reclassified": 1,
        "incomplete": 1,
        "teacher_escalation": 1,
    }
    assert {outcome["outcome"] for outcome in body["student_outcomes"]} == {
        "passed_transfer",
        "still_struggling",
        "root_cause_reclassified",
        "incomplete",
        "teacher_escalation",
    }
    assert body["remaining_gaps"]
    assert body["next_lesson_focus"]

    counted_outcomes = {
        outcome: sum(student["outcome"] == outcome for student in body["student_outcomes"])
        for outcome in body["outcome_counts"]
    }
    assert body["outcome_counts"] == counted_outcomes


def test_get_intervention_report_returns_404_for_unknown_id(
    client: TestClient,
) -> None:
    response = client.get("/api/v1/reports/report_missing")

    assert response.status_code == 404
    assert response.json() == {
        "detail": {
            "code": "intervention_report_not_found",
            "message": "Intervention report was not found.",
        }
    }


def test_intervention_report_references_current_teacher_projection(
    client: TestClient,
) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )
    report_response = client.get("/api/v1/reports/report_demo_01")
    report = report_response.json()

    snapshot_response = client.get(f"/api/v1/classes/{report['class_id']}/snapshot")
    plan_response = client.get(f"/api/v1/lesson-plans/{report['printable_lesson_plan_id']}")

    assert report_response.status_code == 200
    assert snapshot_response.status_code == 200
    assert plan_response.status_code == 200
    snapshot = snapshot_response.json()
    plan = plan_response.json()
    assert (report["class_id"], report["lesson_id"]) == (
        snapshot["class_id"],
        snapshot["lesson_id"],
    )
    assert (
        report["printable_lesson_plan_id"],
        report["class_id"],
        report["lesson_id"],
    ) == (
        plan["plan_id"],
        plan["lesson_plan"]["class_id"],
        plan["lesson_plan"]["lesson_id"],
    )
    assert datetime.fromisoformat(report["generated_at"]) >= datetime.fromisoformat(
        plan["created_at"]
    )

    snapshot_students = {student["student_id"] for student in snapshot["students"]}
    report_students = {outcome["student_id"] for outcome in report["student_outcomes"]}
    assert report_students <= snapshot_students
    assert {gap["skill_id"] for gap in report["remaining_gaps"]} <= CURRICULUM.skills.keys()

    intervention_evidence_payload = json.loads(
        (API_PROJECT_ROOT.parent.parent / "data/fixtures/intervention-evidence.json").read_text(
            encoding="utf-8"
        )
    )
    planning_cutoff = datetime.fromisoformat(
        intervention_evidence_payload["planning_evidence_cutoff"]
    )
    assert planning_cutoff == datetime.fromisoformat(plan["created_at"])
    intervention_events = {
        event.id: event
        for event in (
            EvidenceEventV1.model_validate(raw_event)
            for raw_event in intervention_evidence_payload["events"]
        )
    }
    report_evidence_ids = {
        evidence_id
        for outcome in report["student_outcomes"]
        for evidence_id in outcome["evidence_ids"]
    }
    assert report_evidence_ids == intervention_events.keys()

    report_generated_at = datetime.fromisoformat(report["generated_at"])
    outcomes_by_student = {outcome["student_id"]: outcome for outcome in report["student_outcomes"]}
    for student_id, outcome in outcomes_by_student.items():
        events = [intervention_events[event_id] for event_id in outcome["evidence_ids"]]
        if outcome["outcome"] == "incomplete":
            assert events == []
            continue
        assert events
        assert all(event.student_id == student_id for event in events)
        assert all(event.lesson_id == report["lesson_id"] for event in events)
        assert all("intervention" in event.session_id for event in events)
        assert all(planning_cutoff < event.recorded_at <= report_generated_at for event in events)

    assert all(
        intervention_events[event_id].is_correct
        for event_id in outcomes_by_student["stu_g7_001"]["evidence_ids"]
    )
    assert not any(
        intervention_events[event_id].is_correct
        for event_id in outcomes_by_student["stu_g7_002"]["evidence_ids"]
    )
    reclassified_skills = {
        intervention_events[event_id].skill_id
        for event_id in outcomes_by_student["stu_g7_003"]["evidence_ids"]
    }
    assert reclassified_skills == {
        "skill_distinguish_direct_inverse",
        "skill_inverse_proportion_definition",
    }
    escalation_results = {
        intervention_events[event_id].is_correct
        for event_id in outcomes_by_student["stu_g7_004"]["evidence_ids"]
    }
    assert escalation_results == {True, False}

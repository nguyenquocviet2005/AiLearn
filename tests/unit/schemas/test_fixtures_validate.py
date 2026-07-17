from __future__ import annotations

import json
from pathlib import Path

import pytest
from ailearn_schemas import (
    ClassSnapshotV1,
    EvidenceEventV1,
    InterventionReportV1,
    StudentDiagnosticProfileV1,
    StudentImprovementPathV1,
    TeacherLessonPlanV1,
)
from pydantic import ValidationError

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES_DIR = REPO_ROOT / "data" / "fixtures"

FIXTURE_MODELS = [
    ("evidence-event.json", EvidenceEventV1),
    ("diagnostic-profile.json", StudentDiagnosticProfileV1),
    ("class-snapshot.json", ClassSnapshotV1),
    ("lesson-plan.json", TeacherLessonPlanV1),
    ("improvement-path.json", StudentImprovementPathV1),
    ("intervention-report.json", InterventionReportV1),
]


@pytest.mark.parametrize(("filename", "model"), FIXTURE_MODELS)
def test_fixture_validates_against_schema(filename: str, model: type) -> None:
    payload = json.loads((FIXTURES_DIR / filename).read_text(encoding="utf-8"))
    instance = model.model_validate(payload)
    assert instance.schema_version == "1"


def test_class_snapshot_students_are_unique() -> None:
    payload = json.loads(
        (FIXTURES_DIR / "class-snapshot.json").read_text(encoding="utf-8")
    )
    snapshot = ClassSnapshotV1.model_validate(payload)
    known = {student.student_id for student in snapshot.students}
    unknown = set(snapshot.unknown_student_ids)
    assert known.isdisjoint(unknown)
    assert 3 <= len(snapshot.groups) <= 5


def test_lesson_plan_duration_constraint() -> None:
    payload = json.loads(
        (FIXTURES_DIR / "lesson-plan.json").read_text(encoding="utf-8")
    )
    plan = TeacherLessonPlanV1.model_validate(payload)
    assert plan.total_duration_minutes <= 45
    assert (
        sum(a.duration_minutes for a in plan.activities) == plan.total_duration_minutes
    )


def test_abstained_profile_may_have_empty_root_causes() -> None:
    profile = StudentDiagnosticProfileV1.model_validate(
        {
            "schema_version": "1",
            "student_id": "stu_demo_99",
            "lesson_id": "lesson_demo_fractions_01",
            "target_skill_id": "skill_fractions_add_unlike",
            "readiness_status": "abstained",
            "confidence": 0.1,
            "root_causes": [],
            "generated_at": "2026-07-18T01:05:00Z",
        }
    )
    assert profile.root_causes == []


def test_needs_support_profile_rejects_empty_root_causes() -> None:
    with pytest.raises(ValidationError):
        StudentDiagnosticProfileV1.model_validate(
            {
                "schema_version": "1",
                "student_id": "stu_demo_99",
                "lesson_id": "lesson_demo_fractions_01",
                "target_skill_id": "skill_fractions_add_unlike",
                "readiness_status": "needs_support",
                "confidence": 0.5,
                "root_causes": [],
                "generated_at": "2026-07-18T01:05:00Z",
            }
        )

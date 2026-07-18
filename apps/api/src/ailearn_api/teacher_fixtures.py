"""Synthetic teacher proposal used until a class has a persisted edit version."""

from datetime import UTC, datetime
from pathlib import Path

from ailearn_schemas import (
    ClassSnapshotV1,
    InterventionReportV1,
    TeacherLessonPlanV1,
    TeacherPlanVersionV1,
)

ROOT = Path(__file__).resolve().parents[4]


def initial_snapshot() -> ClassSnapshotV1:
    return ClassSnapshotV1.model_validate_json(
        (ROOT / "data/fixtures/class-snapshot.json").read_text()
    )


def initial_plan_version() -> TeacherPlanVersionV1:
    snapshot = initial_snapshot()
    plan = TeacherLessonPlanV1.model_validate_json(
        (ROOT / "data/fixtures/lesson-plan.json").read_text()
    )
    return TeacherPlanVersionV1(
        schema_version="1",
        id=f"{plan.id}:v1",
        plan_id=plan.id,
        version=1,
        parent_version_id=None,
        decision="pending",
        published_at=None,
        created_at=datetime(2026, 7, 18, 1, 15, tzinfo=UTC),
        snapshot=snapshot,
        lesson_plan=plan,
    )


def intervention_report() -> InterventionReportV1:
    """Load and validate the synthetic outcome personas for teacher reporting."""

    return InterventionReportV1.model_validate_json(
        (ROOT / "data/fixtures/intervention-report.json").read_text()
    )

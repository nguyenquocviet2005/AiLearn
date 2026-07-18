"""Deterministic teacher projections over the same evidence used by students."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime
from typing import cast

from ailearn_diagnostic import diagnose
from ailearn_planning import build_class_snapshot, build_lesson_plan
from ailearn_planning.policy import CurriculumView
from ailearn_schemas import ClassSnapshotV1, EvidenceEventV1, TeacherPlanVersionV1

from ailearn_api.config import API_PROJECT_ROOT, Settings
from ailearn_api.curriculum import CURRICULUM, ITEMS
from ailearn_api.evidence_client import fetch_evidence_events_for_lesson
from ailearn_api.students_client import fetch_students_for_class

DEMO_CLASS_ID = "class_g7a_demo"
DEMO_PLAN_ID = "plan_class_g7a_demo_lesson_g7_inverse_proportion_01"
_REPO_ROOT = API_PROJECT_ROOT.parent.parent
_FALLBACK_GENERATED_AT = datetime(2026, 7, 18, tzinfo=UTC)


def _snapshot_from_evidence(
    class_id: str,
    roster_student_ids: list[str],
    events: list[EvidenceEventV1],
) -> ClassSnapshotV1:
    events_by_student: dict[str, list[EvidenceEventV1]] = defaultdict(list)
    class_events = [event for event in events if event.student_id in roster_student_ids]
    for event in class_events:
        events_by_student[event.student_id].append(event)

    profiles = [
        diagnose(student_events, CURRICULUM, ITEMS)
        for student_events in events_by_student.values()
        if student_events
    ]
    generated_at = max(
        (event.recorded_at for event in class_events), default=_FALLBACK_GENERATED_AT
    )
    return build_class_snapshot(
        class_id=class_id,
        lesson_id=CURRICULUM.lesson_id,
        roster_student_ids=roster_student_ids,
        profiles=profiles,
        curriculum=cast(CurriculumView, CURRICULUM),
        now=generated_at,
    )


async def build_live_snapshot(settings: Settings, class_id: str) -> ClassSnapshotV1 | None:
    roster = await fetch_students_for_class(settings, class_id)
    if not roster:
        return None
    records = await fetch_evidence_events_for_lesson(settings, CURRICULUM.lesson_id)
    events = [EvidenceEventV1.model_validate(record.model_dump()) for record in records]
    return _snapshot_from_evidence(class_id, [student.id for student in roster], events)


def initial_snapshot() -> ClassSnapshotV1:
    """Produce the offline demo fallback from the committed synthetic seed data."""
    student_payload = json.loads(
        (_REPO_ROOT / "data/seeds/students.json").read_text(encoding="utf-8")
    )
    evidence_payload = json.loads(
        (_REPO_ROOT / "data/seeds/evidence-events.json").read_text(encoding="utf-8")
    )
    roster = [
        student["student_id"]
        for student in student_payload["students"]
        if student["class_id"] == DEMO_CLASS_ID
    ]
    events = [EvidenceEventV1.model_validate(event) for event in evidence_payload["events"]]
    return _snapshot_from_evidence(DEMO_CLASS_ID, roster, events)


def initial_plan_version(snapshot: ClassSnapshotV1 | None = None) -> TeacherPlanVersionV1:
    """Generate the inspectable initial proposal without copying data by hand."""
    current_snapshot = snapshot or initial_snapshot()
    plan = build_lesson_plan(
        snapshot=current_snapshot,
        curriculum=cast(CurriculumView, CURRICULUM),
        now=current_snapshot.generated_at,
    )
    return TeacherPlanVersionV1(
        schema_version="1",
        id=f"{plan.id}:v1",
        plan_id=plan.id,
        version=1,
        parent_version_id=None,
        decision="pending",
        published_at=None,
        created_at=current_snapshot.generated_at,
        snapshot=current_snapshot,
        lesson_plan=plan,
    )

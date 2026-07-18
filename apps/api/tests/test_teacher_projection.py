import json
from datetime import UTC, datetime

import pytest

from ailearn_api.config import API_PROJECT_ROOT, Settings
from ailearn_api.models.evidence import EvidenceEventRecord
from ailearn_api.models.student import StudentRecord
from ailearn_api.teacher_projection import (
    DEMO_CLASS_ID,
    DEMO_PLAN_ID,
    build_live_snapshot,
    initial_plan_version,
    initial_snapshot,
)


def test_seeded_g7_evidence_builds_the_teacher_snapshot_and_plan() -> None:
    snapshot = initial_snapshot()
    plan_version = initial_plan_version(snapshot)

    readiness_counts = {
        status: sum(student.readiness_status == status for student in snapshot.students)
        for status in ("ready", "needs_support", "abstained")
    }
    root_cause_counts = {
        skill_id: sum(
            student.primary_root_cause_skill_id == skill_id for student in snapshot.students
        )
        for skill_id in {
            student.primary_root_cause_skill_id
            for student in snapshot.students
            if student.primary_root_cause_skill_id is not None
        }
    }

    assert snapshot.class_id == DEMO_CLASS_ID
    assert snapshot.lesson_id == "lesson_g7_inverse_proportion_01"
    assert len(snapshot.students) == 40
    assert snapshot.unknown_student_ids == []
    assert readiness_counts == {"ready": 8, "needs_support": 30, "abstained": 2}
    assert root_cause_counts == {
        "skill_ratio_proportion_basics": 4,
        "skill_fraction_multiplication": 7,
        "skill_distinguish_direct_inverse": 11,
        "skill_word_problem_work_rate": 8,
    }
    assert [priority.skill_id for priority in snapshot.teaching_priorities] == [
        "skill_ratio_proportion_basics",
        "skill_distinguish_direct_inverse",
        "skill_fraction_multiplication",
        "skill_word_problem_work_rate",
    ]
    assert len(snapshot.groups) == 5
    assert {group.intervention_need for group in snapshot.groups} == {
        "repair:skill_ratio_proportion_basics",
        "repair:skill_distinguish_direct_inverse",
        "mixed_repair:teacher_station",
        "extension:target_transfer",
        "confirmation:insufficient_evidence",
    }
    grouped_student_ids = [
        student_id for group in snapshot.groups for student_id in group.student_ids
    ]
    assert len(grouped_student_ids) == len(set(grouped_student_ids)) == 40
    assert sorted(grouped_student_ids) == sorted(
        student.student_id for student in snapshot.students
    )
    assert plan_version.plan_id == DEMO_PLAN_ID
    assert plan_version.lesson_plan.class_id == DEMO_CLASS_ID
    assert plan_version.lesson_plan.lesson_id == snapshot.lesson_id
    assert sum(activity.duration_minutes for activity in plan_version.lesson_plan.activities) == 45
    assert [activity.title for activity in plan_version.lesson_plan.activities] == [
        "Khởi động xác nhận mức sẵn sàng",
        "Củng cố tiên quyết có hướng dẫn",
        "Luyện kỹ năng mục tiêu theo nhóm",
        "Phiếu cuối giờ vận dụng gần",
    ]


def test_committed_teacher_demo_fixtures_match_the_deterministic_projection() -> None:
    repo_root = API_PROJECT_ROOT.parent.parent
    snapshot_fixture = json.loads(
        (repo_root / "data/fixtures/class-snapshot.json").read_text(encoding="utf-8")
    )
    plan_fixture = json.loads(
        (repo_root / "data/fixtures/lesson-plan.json").read_text(encoding="utf-8")
    )

    snapshot = initial_snapshot()
    plan_version = initial_plan_version(snapshot)

    assert snapshot_fixture == snapshot.model_dump(mode="json")
    assert plan_fixture == plan_version.lesson_plan.model_dump(mode="json")


@pytest.mark.anyio
async def test_live_projection_reads_the_g7_roster_and_lesson_evidence(monkeypatch) -> None:
    student_ids = ["stu_g7_001", "stu_g7_002", "stu_g7_003"]

    async def roster(_: Settings, class_id: str) -> list[StudentRecord]:
        assert class_id == DEMO_CLASS_ID
        return [
            StudentRecord(
                id=student_id,
                display_name=f"Student {index}",
                class_id=DEMO_CLASS_ID,
                created_at=datetime(2026, 7, 18, tzinfo=UTC),
            )
            for index, student_id in enumerate(student_ids, start=1)
        ]

    async def evidence(_: Settings, lesson_id: str) -> list[EvidenceEventRecord]:
        assert lesson_id == "lesson_g7_inverse_proportion_01"
        return [
            EvidenceEventRecord(
                id=f"ev_live_projection_{index}",
                schema_version="1",
                student_id=student_id,
                session_id="sess_live_projection",
                skill_id="skill_word_problem_work_rate",
                item_id="item_inv_prop_01",
                is_correct=True,
                recorded_at=datetime(2026, 7, 18, tzinfo=UTC),
                lesson_id=lesson_id,
                response_label="Giảm xuống",
            )
            for index, student_id in enumerate(student_ids, start=1)
        ]

    monkeypatch.setattr("ailearn_api.teacher_projection.fetch_students_for_class", roster)
    monkeypatch.setattr("ailearn_api.teacher_projection.fetch_evidence_events_for_lesson", evidence)

    snapshot = await build_live_snapshot(
        Settings(supabase_url="https://example.supabase.co", supabase_secret_key="test-secret"),
        DEMO_CLASS_ID,
    )

    assert snapshot is not None
    assert snapshot.class_id == DEMO_CLASS_ID
    assert [student.student_id for student in snapshot.students] == student_ids

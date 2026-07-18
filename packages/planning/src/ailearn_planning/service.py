from __future__ import annotations

import re
from collections.abc import Sequence
from datetime import datetime

from ailearn_schemas import (
    ClassSnapshotV1,
    LessonActivity,
    SnapshotStudent,
    StudentDiagnosticProfileV1,
    TeacherLessonPlanV1,
    TeachingPriority,
)

from ailearn_planning.policy import (
    CurriculumView,
    DeterministicInterventionPolicy,
    InterventionPolicy,
)


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return normalized or "planning"


def build_class_snapshot(
    *,
    class_id: str,
    lesson_id: str,
    roster_student_ids: Sequence[str],
    profiles: Sequence[StudentDiagnosticProfileV1],
    curriculum: CurriculumView,
    now: datetime,
    policy: InterventionPolicy | None = None,
) -> ClassSnapshotV1:
    """Aggregate valid diagnostic profiles into one deterministic class snapshot."""

    roster = list(roster_student_ids)
    if len(roster) != len(set(roster)):
        msg = "roster_student_ids must be unique"
        raise ValueError(msg)

    profile_by_student: dict[str, StudentDiagnosticProfileV1] = {}
    for profile in profiles:
        if profile.student_id in profile_by_student:
            msg = f"duplicate diagnostic profile for {profile.student_id}"
            raise ValueError(msg)
        if profile.student_id not in roster:
            msg = (
                f"diagnostic profile student {profile.student_id} is not in the roster"
            )
            raise ValueError(msg)
        if profile.lesson_id != lesson_id:
            msg = f"diagnostic profile {profile.student_id} belongs to another lesson"
            raise ValueError(msg)
        if profile.target_skill_id != curriculum.target_skill_id:
            msg = (
                f"diagnostic profile {profile.student_id} target skill does not match "
                "the planning curriculum"
            )
            raise ValueError(msg)
        unknown_root_causes = sorted(
            {
                root_cause.skill_id
                for root_cause in profile.root_causes
                if root_cause.skill_id not in curriculum.skills
            }
        )
        if unknown_root_causes:
            msg = (
                f"diagnostic profile {profile.student_id} has root-cause skill(s) "
                f"outside the planning curriculum: {', '.join(unknown_root_causes)}"
            )
            raise ValueError(msg)
        profile_by_student[profile.student_id] = profile

    known_profiles = [
        profile_by_student[student_id]
        for student_id in roster
        if student_id in profile_by_student
    ]
    unknown_student_ids = sorted(set(roster) - set(profile_by_student))
    planning_policy = policy or DeterministicInterventionPolicy()
    priority_scores = planning_policy.score_priorities(known_profiles, curriculum)
    groups = planning_policy.build_groups(known_profiles, priority_scores)

    students = []
    for profile in sorted(known_profiles, key=lambda item: item.student_id):
        primary_root_cause = None
        if profile.readiness_status == "needs_support":
            primary_root_cause = min(
                profile.root_causes, key=lambda cause: (cause.rank, cause.skill_id)
            ).skill_id
        students.append(
            SnapshotStudent(
                student_id=profile.student_id,
                readiness_status=profile.readiness_status,
                confidence=profile.confidence,
                primary_root_cause_skill_id=primary_root_cause,
            )
        )

    grouped_student_ids = [
        student_id for group in groups for student_id in group.student_ids
    ]
    expected_grouped_ids = [student.student_id for student in students]
    if sorted(grouped_student_ids) != sorted(expected_grouped_ids) or len(
        grouped_student_ids
    ) != len(set(grouped_student_ids)):
        msg = "each diagnosed student must appear in exactly one intervention group"
        raise ValueError(msg)

    return ClassSnapshotV1(
        schema_version="1",
        class_id=class_id,
        lesson_id=lesson_id,
        generated_at=now,
        students=students,
        unknown_student_ids=unknown_student_ids,
        groups=groups,
        teaching_priorities=[
            TeachingPriority(
                skill_id=priority.skill_id,
                rank=priority.rank,
                rationale=priority.rationale,
            )
            for priority in priority_scores
        ],
    )


def build_lesson_plan(
    *,
    snapshot: ClassSnapshotV1,
    curriculum: CurriculumView,
    now: datetime,
) -> TeacherLessonPlanV1:
    """Generate a deterministic 45-minute draft linked to snapshot priorities."""

    if not snapshot.teaching_priorities:
        msg = "lesson planning requires at least one diagnosed teaching priority"
        raise ValueError(msg)

    top_priority = snapshot.teaching_priorities[0]
    secondary_priority = (
        snapshot.teaching_priorities[1]
        if len(snapshot.teaching_priorities) > 1
        else top_priority
    )
    target_skill_id = curriculum.target_skill_id
    prefix = _slug(f"{snapshot.class_id}_{snapshot.lesson_id}")

    activities = [
        LessonActivity(
            id=f"act_{prefix}_confirm",
            title="Khởi động xác nhận mức sẵn sàng",
            duration_minutes=5,
            root_cause_skill_id=top_priority.skill_id,
            skill_id=top_priority.skill_id,
            expected_evidence="Mỗi nhóm can thiệp hoàn thành một câu ngắn để xác nhận nhu cầu tiên quyết đã chẩn đoán.",
            rationale=f"Xác nhận ưu tiên số 1 trước khi dạy: {top_priority.rationale}",
        ),
        LessonActivity(
            id=f"act_{prefix}_repair",
            title="Củng cố tiên quyết có hướng dẫn",
            duration_minutes=15,
            root_cause_skill_id=top_priority.skill_id,
            skill_id=top_priority.skill_id,
            expected_evidence="Một ví dụ mẫu và một bài có hướng dẫn thể hiện đúng chiến lược tiên quyết.",
            rationale=f"Dành thời lượng hướng dẫn dài nhất cho ưu tiên số 1 ({top_priority.skill_id}).",
        ),
        LessonActivity(
            id=f"act_{prefix}_practice",
            title="Luyện kỹ năng mục tiêu theo nhóm",
            duration_minutes=15,
            root_cause_skill_id=secondary_priority.skill_id,
            skill_id=target_skill_id,
            expected_evidence="Mỗi học sinh hoàn thành hai câu kỹ năng mục tiêu, gắn với nhóm can thiệp được giao.",
            rationale=(
                f"Kết nối lại ưu tiên số {secondary_priority.rank} ({secondary_priority.skill_id}) "
                "với mục tiêu của bài học hiện tại."
            ),
        ),
        LessonActivity(
            id=f"act_{prefix}_transfer",
            title="Phiếu cuối giờ vận dụng gần",
            duration_minutes=10,
            root_cause_skill_id=top_priority.skill_id,
            skill_id=target_skill_id,
            expected_evidence="Một câu vận dụng gần làm độc lập để phân biệt thành công tức thời với khả năng vận dụng.",
            rationale="Thu thập bằng chứng có thể so sánh cho chu kỳ chẩn đoán và rà soát tiếp theo.",
        ),
    ]

    return TeacherLessonPlanV1(
        schema_version="1",
        id=f"plan_{prefix}",
        class_id=snapshot.class_id,
        lesson_id=snapshot.lesson_id,
        status="draft",
        total_duration_minutes=sum(
            activity.duration_minutes for activity in activities
        ),
        activities=activities,
        generated_at=now,
    )

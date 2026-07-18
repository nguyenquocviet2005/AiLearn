from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path

import pytest
from ailearn_diagnostic import diagnose, load_curriculum, load_items
from ailearn_planning import (
    DeterministicInterventionPolicy,
    build_class_snapshot,
    build_lesson_plan,
)
from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXED_NOW = datetime(2026, 7, 20, 1, 0, tzinfo=UTC)
LESSON_ID = "lesson_g7_inverse_proportion_01"
TARGET_SKILL_ID = "skill_word_problem_work_rate"


def _profile(
    student_id: str,
    readiness_status: str,
    *,
    root_cause_skill_id: str | None = None,
    target_skill_id: str = TARGET_SKILL_ID,
    confidence: float = 0.8,
) -> StudentDiagnosticProfileV1:
    root_causes = []
    if readiness_status != "abstained":
        root_causes = [
            {
                "skill_id": root_cause_skill_id or target_skill_id,
                "rank": 1,
                "supporting_evidence_ids": [f"ev_{student_id}"],
                "contradicting_evidence_ids": [],
            }
        ]
    return StudentDiagnosticProfileV1.model_validate(
        {
            "schema_version": "1",
            "student_id": student_id,
            "lesson_id": LESSON_ID,
            "target_skill_id": target_skill_id,
            "readiness_status": readiness_status,
            "confidence": confidence,
            "root_causes": root_causes,
            "generated_at": FIXED_NOW,
        }
    )


def _seed_roster_and_profiles() -> tuple[list[str], list[StudentDiagnosticProfileV1]]:
    students_payload = json.loads(
        (REPO_ROOT / "data/seeds/students.json").read_text(encoding="utf-8")
    )
    evidence_payload = json.loads(
        (REPO_ROOT / "data/seeds/evidence-events.json").read_text(encoding="utf-8")
    )
    events_by_student: dict[str, list[EvidenceEventV1]] = defaultdict(list)
    for raw_event in evidence_payload["events"]:
        event = EvidenceEventV1.model_validate(raw_event)
        events_by_student[event.student_id].append(event)

    curriculum = load_curriculum()
    items = load_items()
    roster = [row["student_id"] for row in students_payload["students"]]
    profiles = [
        diagnose(events_by_student[student_id], curriculum, items, now=FIXED_NOW)
        for student_id in roster
    ]
    return roster, profiles


def test_seeded_students_appear_exactly_once_in_actionable_groups() -> None:
    roster, profiles = _seed_roster_and_profiles()
    snapshot = build_class_snapshot(
        class_id="class_g7a_demo",
        lesson_id="lesson_g7_inverse_proportion_01",
        roster_student_ids=roster,
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    snapshot_members = [student.student_id for student in snapshot.students]
    assert sorted(snapshot_members + snapshot.unknown_student_ids) == sorted(roster)
    assert len(snapshot_members + snapshot.unknown_student_ids) == len(roster)
    assert 3 <= len(snapshot.groups) <= 5

    grouped = [
        student_id for group in snapshot.groups for student_id in group.student_ids
    ]
    assert sorted(grouped) == sorted(snapshot_members)
    assert len(grouped) == len(set(grouped))
    assert "weak" not in snapshot.model_dump_json().lower()


def test_unknown_students_remain_separate_from_groups() -> None:
    roster, profiles = _seed_roster_and_profiles()
    unknown_id = "stu_g7_pending_evidence"
    snapshot = build_class_snapshot(
        class_id="class_g7a_demo",
        lesson_id="lesson_g7_inverse_proportion_01",
        roster_student_ids=[*roster, unknown_id],
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    assert snapshot.unknown_student_ids == [unknown_id]
    assert unknown_id not in {student.student_id for student in snapshot.students}
    assert unknown_id not in {
        student_id for group in snapshot.groups for student_id in group.student_ids
    }


def test_priority_calculation_is_deterministic_and_visible() -> None:
    _, profiles = _seed_roster_and_profiles()
    policy = DeterministicInterventionPolicy()
    curriculum = load_curriculum()

    forward = policy.score_priorities(profiles, curriculum)
    reverse = policy.score_priorities(list(reversed(profiles)), curriculum)

    assert forward == reverse
    assert [priority.rank for priority in forward] == list(range(1, len(forward) + 1))
    for priority in forward:
        assert priority.total_score == round(
            0.40 * priority.prevalence
            + 0.25 * priority.downstream_impact
            + 0.20 * priority.lesson_urgency
            + 0.15 * priority.diagnostic_confidence,
            4,
        )
        assert "score=" in priority.rationale
        assert "prevalence=" in priority.rationale
        assert "downstream_impact=" in priority.rationale
        assert "lesson_urgency=" in priority.rationale
        assert "diagnostic_confidence=" in priority.rationale


def test_groups_follow_intervention_need_not_confidence_score() -> None:
    _, profiles = _seed_roster_and_profiles()
    snapshot = build_class_snapshot(
        class_id="class_g7a_demo",
        lesson_id="lesson_g7_inverse_proportion_01",
        roster_student_ids=[profile.student_id for profile in profiles],
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    for group in snapshot.groups:
        support_members = [
            profile
            for profile in profiles
            if profile.student_id in group.student_ids
            and profile.readiness_status == "needs_support"
        ]
        root_causes = {
            min(profile.root_causes, key=lambda cause: cause.rank).skill_id
            for profile in support_members
        }
        if group.intervention_need.startswith("repair:"):
            assert len(root_causes) == 1


def test_homogeneous_class_splits_into_three_manageable_cohorts() -> None:
    profiles = [
        _profile(
            f"stu_homogeneous_{index}",
            "needs_support",
            root_cause_skill_id="skill_ratio_proportion_basics",
            confidence=0.5 + index / 20,
        )
        for index in range(6)
    ]
    snapshot = build_class_snapshot(
        class_id="class_homogeneous",
        lesson_id=LESSON_ID,
        roster_student_ids=[profile.student_id for profile in profiles],
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    assert len(snapshot.groups) == 3
    assert {group.intervention_need for group in snapshot.groups} == {
        "repair:skill_ratio_proportion_basics"
    }
    assert sorted(
        student_id for group in snapshot.groups for student_id in group.student_ids
    ) == sorted(profile.student_id for profile in profiles)


def test_two_needs_split_the_larger_cohort_to_reach_three_groups() -> None:
    profiles = [
        _profile(
            "stu_two_1",
            "needs_support",
            root_cause_skill_id="skill_ratio_proportion_basics",
        ),
        _profile(
            "stu_two_2",
            "needs_support",
            root_cause_skill_id="skill_ratio_proportion_basics",
        ),
        _profile("stu_two_3", "ready"),
    ]
    snapshot = build_class_snapshot(
        class_id="class_two_needs",
        lesson_id=LESSON_ID,
        roster_student_ids=[profile.student_id for profile in profiles],
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    assert len(snapshot.groups) == 3
    assert all(group.student_ids for group in snapshot.groups)


def test_more_than_five_needs_merge_lower_priority_repairs() -> None:
    root_skills = [
        "skill_ratio_proportion_basics",
        "skill_fraction_multiplication",
        "skill_direct_proportion",
        "skill_inverse_proportion_definition",
        "skill_find_constant_k",
        "skill_solve_unknown_value",
    ]
    profiles = [
        _profile(
            f"stu_overflow_{index}",
            "needs_support",
            root_cause_skill_id=skill_id,
        )
        for index, skill_id in enumerate(root_skills)
    ]
    profiles.extend(
        [
            _profile("stu_overflow_ready", "ready"),
            _profile("stu_overflow_confirm", "abstained"),
        ]
    )
    snapshot = build_class_snapshot(
        class_id="class_overflow",
        lesson_id=LESSON_ID,
        roster_student_ids=[profile.student_id for profile in profiles],
        profiles=profiles,
        curriculum=load_curriculum(),
        now=FIXED_NOW,
    )

    assert len(snapshot.groups) == 5
    assert any(
        group.intervention_need == "mixed_repair:teacher_station"
        for group in snapshot.groups
    )
    assert sorted(
        student_id for group in snapshot.groups for student_id in group.student_ids
    ) == sorted(profile.student_id for profile in profiles)


def test_snapshot_rejects_profile_target_from_another_curriculum() -> None:
    profiles = [
        _profile(
            f"stu_target_{index}",
            "needs_support",
            root_cause_skill_id="skill_ratio_proportion_basics",
            target_skill_id="skill_other_target",
        )
        for index in range(3)
    ]

    with pytest.raises(ValueError, match="target skill"):
        build_class_snapshot(
            class_id="class_target_mismatch",
            lesson_id=LESSON_ID,
            roster_student_ids=[profile.student_id for profile in profiles],
            profiles=profiles,
            curriculum=load_curriculum(),
            now=FIXED_NOW,
        )


def test_snapshot_rejects_root_cause_missing_from_curriculum() -> None:
    profiles = [
        _profile(
            f"stu_root_{index}",
            "needs_support",
            root_cause_skill_id="skill_not_in_curriculum",
        )
        for index in range(3)
    ]

    with pytest.raises(ValueError, match="root-cause skill"):
        build_class_snapshot(
            class_id="class_root_mismatch",
            lesson_id=LESSON_ID,
            roster_student_ids=[profile.student_id for profile in profiles],
            profiles=profiles,
            curriculum=load_curriculum(),
            now=FIXED_NOW,
        )


def test_lesson_plan_is_bounded_and_every_activity_is_traceable() -> None:
    roster, profiles = _seed_roster_and_profiles()
    curriculum = load_curriculum()
    snapshot = build_class_snapshot(
        class_id="class_g7a_demo",
        lesson_id="lesson_g7_inverse_proportion_01",
        roster_student_ids=roster,
        profiles=profiles,
        curriculum=curriculum,
        now=FIXED_NOW,
    )

    plan = build_lesson_plan(snapshot=snapshot, curriculum=curriculum, now=FIXED_NOW)

    assert plan.status == "draft"
    assert plan.total_duration_minutes == 45
    assert sum(activity.duration_minutes for activity in plan.activities) == 45
    for activity in plan.activities:
        assert activity.root_cause_skill_id
        assert activity.skill_id
        assert activity.expected_evidence
        assert activity.rationale

from __future__ import annotations

import re
from collections import defaultdict
from collections.abc import Mapping, Sequence, Set
from dataclasses import replace
from typing import Protocol

from ailearn_schemas import SnapshotGroup, StudentDiagnosticProfileV1

from ailearn_planning.models import PriorityScore


class CurriculumView(Protocol):
    """Read-only curriculum graph surface required by planning."""

    target_skill_id: str

    @property
    def skills(self) -> Mapping[str, object]: ...

    def ancestors(self, skill_id: str) -> Set[str]: ...

    def descendants(self, skill_id: str) -> Set[str]: ...


class InterventionPolicy(Protocol):
    """Policy boundary for deterministic teacher planning decisions."""

    def score_priorities(
        self,
        profiles: Sequence[StudentDiagnosticProfileV1],
        curriculum: CurriculumView,
    ) -> list[PriorityScore]: ...

    def build_groups(
        self,
        profiles: Sequence[StudentDiagnosticProfileV1],
        priorities: Sequence[PriorityScore],
    ) -> list[SnapshotGroup]: ...


def _primary_root_cause(profile: StudentDiagnosticProfileV1) -> str:
    if not profile.root_causes:
        msg = f"needs-support profile {profile.student_id} has no root cause"
        raise ValueError(msg)
    return min(
        profile.root_causes, key=lambda cause: (cause.rank, cause.skill_id)
    ).skill_id


def _slug(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return normalized or "group"


class DeterministicInterventionPolicy:
    """Rule-backed priorities and intervention-need groups.

    Priority score = 40% class prevalence + 25% downstream graph impact
    + 20% current-lesson urgency + 15% mean diagnostic confidence.
    """

    def score_priorities(
        self,
        profiles: Sequence[StudentDiagnosticProfileV1],
        curriculum: CurriculumView,
    ) -> list[PriorityScore]:
        diagnosed_count = len(profiles)
        if diagnosed_count == 0:
            return []

        affected_by_skill: dict[str, list[StudentDiagnosticProfileV1]] = defaultdict(
            list
        )
        for profile in profiles:
            if profile.readiness_status == "needs_support":
                affected_by_skill[_primary_root_cause(profile)].append(profile)

        target_ancestors = curriculum.ancestors(curriculum.target_skill_id)
        skill_count = max(1, len(curriculum.skills))
        unranked: list[PriorityScore] = []
        for skill_id, affected in affected_by_skill.items():
            prevalence = round(len(affected) / diagnosed_count, 4)
            downstream_impact = round(
                min(1.0, (len(curriculum.descendants(skill_id)) + 1) / skill_count),
                4,
            )
            if skill_id == curriculum.target_skill_id:
                lesson_urgency = 1.0
            elif skill_id in target_ancestors:
                lesson_urgency = 0.85
            else:
                lesson_urgency = 0.5
            diagnostic_confidence = round(
                sum(profile.confidence for profile in affected) / len(affected), 4
            )
            total_score = round(
                0.40 * prevalence
                + 0.25 * downstream_impact
                + 0.20 * lesson_urgency
                + 0.15 * diagnostic_confidence,
                4,
            )
            rationale = (
                f"score={total_score:.4f}; prevalence={prevalence:.4f} "
                f"({len(affected)}/{diagnosed_count}); "
                f"downstream_impact={downstream_impact:.4f}; "
                f"lesson_urgency={lesson_urgency:.4f}; "
                f"diagnostic_confidence={diagnostic_confidence:.4f}"
            )
            unranked.append(
                PriorityScore(
                    skill_id=skill_id,
                    rank=0,
                    affected_student_count=len(affected),
                    prevalence=prevalence,
                    downstream_impact=downstream_impact,
                    lesson_urgency=lesson_urgency,
                    diagnostic_confidence=diagnostic_confidence,
                    total_score=total_score,
                    rationale=rationale,
                )
            )

        ordered = sorted(
            unranked,
            key=lambda item: (
                -item.total_score,
                -item.affected_student_count,
                item.skill_id,
            ),
        )
        return [
            replace(priority, rank=index) for index, priority in enumerate(ordered, 1)
        ]

    def build_groups(
        self,
        profiles: Sequence[StudentDiagnosticProfileV1],
        priorities: Sequence[PriorityScore],
    ) -> list[SnapshotGroup]:
        repair_members: dict[str, list[str]] = defaultdict(list)
        ready_members: list[str] = []
        confirmation_members: list[str] = []

        for profile in sorted(profiles, key=lambda item: item.student_id):
            if profile.readiness_status == "needs_support":
                repair_members[_primary_root_cause(profile)].append(profile.student_id)
            elif profile.readiness_status == "ready":
                ready_members.append(profile.student_id)
            else:
                confirmation_members.append(profile.student_id)

        priority_order = {priority.skill_id: priority.rank for priority in priorities}
        ordered_repairs = sorted(
            repair_members.items(),
            key=lambda item: (
                priority_order.get(item[0], len(priority_order) + 1),
                item[0],
            ),
        )

        reserved_slots = bool(ready_members) + bool(confirmation_members)
        repair_slots = 5 - reserved_slots
        merged_repairs: list[tuple[str, list[str], bool]] = []
        if len(ordered_repairs) <= repair_slots:
            merged_repairs = [(*item, False) for item in ordered_repairs]
        else:
            kept_count = repair_slots - 1
            merged_repairs = [(*item, False) for item in ordered_repairs[:kept_count]]
            overflow = ordered_repairs[kept_count:]
            merged_repairs.append(
                (
                    "+".join(skill_id for skill_id, _ in overflow),
                    sorted(
                        student_id for _, members in overflow for student_id in members
                    ),
                    True,
                )
            )

        group_specs: list[tuple[str, str, list[str], str]] = []
        for skill_id, student_ids, is_merged in merged_repairs:
            if is_merged:
                intervention_need = "mixed_repair:teacher_station"
                rationale = (
                    "Các nhu cầu tiên quyết ít phổ biến hơn được ghép vào trạm do giáo viên "
                    f"hướng dẫn; kỹ năng trọng tâm: {skill_id}."
                )
            else:
                intervention_need = f"repair:{skill_id}"
                rationale = (
                    f"Nhóm có chung bằng chứng về nguyên nhân gốc {skill_id}; cần củng cố "
                    "tiên quyết này trước khi luyện kỹ năng mục tiêu."
                )
            group_specs.append((skill_id, intervention_need, student_ids, rationale))

        if ready_members:
            group_specs.append(
                (
                    "ready_transfer",
                    "extension:target_transfer",
                    ready_members,
                    "Bằng chứng chẩn đoán cho thấy học sinh đã sẵn sàng; giao bài vận dụng và mở rộng.",
                )
            )
        if confirmation_members:
            group_specs.append(
                (
                    "confirmation",
                    "confirmation:insufficient_evidence",
                    confirmation_members,
                    "Bằng chứng còn thiếu hoặc mâu thuẫn; cần xác nhận mức sẵn sàng trước khi giao can thiệp.",
                )
            )

        while len(group_specs) < 3:
            splittable = [
                (index, spec)
                for index, spec in enumerate(group_specs)
                if len(spec[2]) >= 2
            ]
            if not splittable:
                break
            split_index, (key, intervention_need, student_ids, rationale) = max(
                splittable,
                key=lambda item: (len(item[1][2]), -item[0]),
            )
            ordered_students = sorted(student_ids)
            midpoint = (len(ordered_students) + 1) // 2
            first_students = ordered_students[:midpoint]
            second_students = ordered_students[midpoint:]
            split_specs = [
                (
                    f"{key}_cohort_a",
                    intervention_need,
                    first_students,
                    f"{rationale} Nhóm song song A giúp giáo viên hỗ trợ trong quy mô phù hợp.",
                ),
                (
                    f"{key}_cohort_b",
                    intervention_need,
                    second_students,
                    f"{rationale} Nhóm song song B giúp giáo viên hỗ trợ trong quy mô phù hợp.",
                ),
            ]
            group_specs[split_index : split_index + 1] = split_specs

        if not 3 <= len(group_specs) <= 5:
            msg = (
                "class data must yield between three and five actionable intervention "
                f"groups; got {len(group_specs)}"
            )
            raise ValueError(msg)

        return [
            SnapshotGroup(
                id=f"grp_{index:02d}_{_slug(key)}",
                intervention_need=intervention_need,
                student_ids=sorted(student_ids),
                rationale=rationale,
            )
            for index, (key, intervention_need, student_ids, rationale) in enumerate(
                group_specs, 1
            )
        ]

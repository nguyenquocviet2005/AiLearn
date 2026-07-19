"""Single-item discriminating probe selection.

Blueprint §9.3 "Câu hỏi phân biệt": when diagnosis abstains, the student should see
exactly ONE targeted follow-up item, not a restarted full readiness session. This
module picks that one item deterministically from whichever evidence already exists.
"""

from __future__ import annotations

from dataclasses import dataclass

from ailearn_schemas import EvidenceEventV1

from ailearn_diagnostic.models import AssessmentItem, Curriculum, ItemIndex
from ailearn_diagnostic.root_cause import DeterministicRootCauseRanker

TARGETS_PRIMARY_HYPOTHESIS = "targets_primary_hypothesis"
ISOLATES_COMPETING_HYPOTHESIS = "isolates_competing_hypothesis"
COVERS_UNOBSERVED_SKILL = "covers_unobserved_skill"
NEXT_UNANSWERED_ITEM = "next_unanswered_item"

_REASON_PRIORITY: dict[str, int] = {
    TARGETS_PRIMARY_HYPOTHESIS: 0,
    ISOLATES_COMPETING_HYPOTHESIS: 1,
    COVERS_UNOBSERVED_SKILL: 2,
    NEXT_UNANSWERED_ITEM: 3,
}


@dataclass(frozen=True, slots=True)
class ProbeSelection:
    """One targeted follow-up item plus why it was chosen."""

    item: AssessmentItem
    reason: str
    target_skill_id: str | None


def select_probe_item(
    events: list[EvidenceEventV1],
    curriculum: Curriculum,
    items: ItemIndex,
) -> ProbeSelection | None:
    """Pick one unanswered item that best resolves the current abstention.

    Deterministic: the same evidence sequence always yields the same selection.
    Returns None once every item has been answered (caller should escalate to the
    teacher instead of looping).
    """
    answered_item_ids = {event.item_id for event in events}
    candidates = [
        item for item in items.items.values() if item.item_id not in answered_item_ids
    ]
    if not candidates:
        return None

    ranker = DeterministicRootCauseRanker()
    ranked = ranker.rank_for_abstention(events, curriculum, items)
    primary_skill_id = ranked[0].skill_id if ranked else None

    observed_skill_ids = {event.skill_id for event in events}
    target_path = curriculum.target_path_skills()

    related_misconception_ids: set[str] = set()
    if primary_skill_id is not None:
        for misconception in curriculum.misconceptions.values():
            if primary_skill_id in misconception.related_skill_ids:
                related_misconception_ids.add(misconception.misconception_id)

    def reason_for(item: AssessmentItem) -> str:
        if primary_skill_id is not None and primary_skill_id in item.skill_ids:
            return TARGETS_PRIMARY_HYPOTHESIS
        if primary_skill_id is not None and any(
            option.misconception_id in related_misconception_ids
            for option in item.options
        ):
            return ISOLATES_COMPETING_HYPOTHESIS
        if any(
            skill_id in target_path and skill_id not in observed_skill_ids
            for skill_id in item.skill_ids
        ):
            return COVERS_UNOBSERVED_SKILL
        return NEXT_UNANSWERED_ITEM

    def min_level(item: AssessmentItem) -> int:
        levels = [
            curriculum.skills[skill_id].level
            for skill_id in item.skill_ids
            if skill_id in curriculum.skills
        ]
        return min(levels) if levels else 0

    best = min(
        candidates,
        key=lambda item: (
            _REASON_PRIORITY[reason_for(item)],
            min_level(item),
            item.item_id,
        ),
    )
    return ProbeSelection(
        item=best, reason=reason_for(best), target_skill_id=primary_skill_id
    )

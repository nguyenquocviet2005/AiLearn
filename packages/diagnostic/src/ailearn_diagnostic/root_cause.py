from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Protocol

from ailearn_schemas import EvidenceEventV1, RootCauseHypothesis

from ailearn_diagnostic.mastery import BetaBernoulliMasteryEstimator
from ailearn_diagnostic.models import Curriculum, ItemIndex

TOP_K = 3
DOMINANT_MISCONCEPTION_RATIO = 0.75
HIGH_LEVEL_MIN = 3


@dataclass(frozen=True, slots=True)
class RankedSkill:
    skill_id: str
    supporting_evidence_ids: tuple[str, ...]
    contradicting_evidence_ids: tuple[str, ...]


class RootCauseRanker(Protocol):
    def rank(
        self,
        events: list[EvidenceEventV1],
        curriculum: Curriculum,
        items: ItemIndex,
        mastery: dict[str, float],
    ) -> list[RankedSkill]:
        """Return ordered root-cause candidates (highest priority first)."""


class DeterministicRootCauseRanker:
    """Rank root causes using mastery gaps, misconceptions, and the skill graph."""

    def __init__(self, top_k: int = TOP_K) -> None:
        self._top_k = top_k
        self._mastery = BetaBernoulliMasteryEstimator()

    def rank(
        self,
        events: list[EvidenceEventV1],
        curriculum: Curriculum,
        items: ItemIndex,
        mastery: dict[str, float],
    ) -> list[RankedSkill]:
        incorrect_counts = self._mastery.incorrect_counts(events)
        weak = {skill_id for skill_id, count in incorrect_counts.items() if count > 0}
        if not weak:
            return []

        misconception_counts = self._misconception_counts(events, items)
        skill_ids = self._select_skill_ids(
            events=events,
            curriculum=curriculum,
            weak=weak,
            incorrect_counts=incorrect_counts,
            misconception_counts=misconception_counts,
        )
        return [
            self._attach_evidence(skill_id, events, curriculum, items, abstaining=False)
            for skill_id in skill_ids[: self._top_k]
        ]

    def rank_for_abstention(
        self,
        events: list[EvidenceEventV1],
        curriculum: Curriculum,
        items: ItemIndex,
    ) -> list[RankedSkill]:
        incorrect_counts = self._mastery.incorrect_counts(events)
        weak = {skill_id for skill_id, count in incorrect_counts.items() if count > 0}
        if not weak:
            return []
        # Prefer the skill of the earliest incorrect event.
        ordered: list[str] = []
        for event in events:
            if not event.is_correct and event.skill_id not in ordered:
                ordered.append(event.skill_id)
        primary = ordered[0]
        return [
            self._attach_evidence(primary, events, curriculum, items, abstaining=True)
        ]

    def _select_skill_ids(
        self,
        *,
        events: list[EvidenceEventV1],
        curriculum: Curriculum,
        weak: set[str],
        incorrect_counts: dict[str, int],
        misconception_counts: Counter[str],
    ) -> list[str]:
        total_wrong = sum(misconception_counts.values())
        if total_wrong > 0 and misconception_counts:
            top_mis, top_n = misconception_counts.most_common(1)[0]
            second_n = (
                misconception_counts.most_common(2)[1][1]
                if len(misconception_counts) > 1
                else 0
            )
            ratio = top_n / total_wrong
            related = list(curriculum.misconceptions[top_mis].related_skill_ids)
            if related and (
                ratio >= DOMINANT_MISCONCEPTION_RATIO or (second_n == 0 and top_n >= 3)
            ):
                return [
                    skill_id for skill_id in related if skill_id in curriculum.skills
                ]

        min_level = min(curriculum.skills[skill_id].level for skill_id in weak)
        if min_level >= HIGH_LEVEL_MIN:
            path = curriculum.target_path_skills()
            candidates = [skill_id for skill_id in weak if skill_id in path]
            return sorted(
                candidates,
                key=lambda skill_id: (-incorrect_counts.get(skill_id, 0), skill_id),
            )

        # Foundational / mixed: prefer skills whose failing descendants are many.
        return sorted(
            weak,
            key=lambda skill_id: (
                -len(curriculum.descendants(skill_id) & weak),
                curriculum.skills[skill_id].level,
                skill_id,
            ),
        )

    def _misconception_counts(
        self,
        events: list[EvidenceEventV1],
        items: ItemIndex,
    ) -> Counter[str]:
        counts: Counter[str] = Counter()
        for event in events:
            if event.is_correct:
                continue
            misconception_id = items.misconception_for(
                event.item_id, event.response_label
            )
            if misconception_id:
                counts[misconception_id] += 1
        return counts

    def _attach_evidence(
        self,
        skill_id: str,
        events: list[EvidenceEventV1],
        curriculum: Curriculum,
        items: ItemIndex,
        *,
        abstaining: bool,
    ) -> RankedSkill:
        supporting: list[str] = []
        contradicting: list[str] = []
        related_from_misconceptions: set[str] = set()
        for misconception in curriculum.misconceptions.values():
            if skill_id in misconception.related_skill_ids:
                related_from_misconceptions.add(misconception.misconception_id)

        for event in events:
            if event.is_correct:
                if abstaining and event.skill_id != skill_id:
                    contradicting.append(event.id)
                elif not abstaining and event.skill_id == skill_id:
                    contradicting.append(event.id)
                continue

            misconception_id = items.misconception_for(
                event.item_id, event.response_label
            )
            maps_to_skill = event.skill_id == skill_id or (
                misconception_id is not None
                and misconception_id in related_from_misconceptions
            )
            if maps_to_skill:
                supporting.append(event.id)

        # Prefer direct incorrect events on the skill when available.
        direct_supporting = [
            event.id
            for event in events
            if not event.is_correct and event.skill_id == skill_id
        ]
        if direct_supporting:
            supporting = direct_supporting

        return RankedSkill(
            skill_id=skill_id,
            supporting_evidence_ids=tuple(dict.fromkeys(supporting)),
            contradicting_evidence_ids=tuple(dict.fromkeys(contradicting)),
        )


def to_hypotheses(ranked: list[RankedSkill]) -> list[RootCauseHypothesis]:
    return [
        RootCauseHypothesis(
            skill_id=row.skill_id,
            rank=index,
            supporting_evidence_ids=list(row.supporting_evidence_ids),
            contradicting_evidence_ids=list(row.contradicting_evidence_ids),
        )
        for index, row in enumerate(ranked, start=1)
    ]

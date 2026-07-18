from __future__ import annotations

from datetime import UTC, datetime

from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1

from ailearn_diagnostic.abstention import AbstentionPolicy
from ailearn_diagnostic.mastery import BetaBernoulliMasteryEstimator
from ailearn_diagnostic.models import Curriculum, ItemIndex
from ailearn_diagnostic.root_cause import (
    DeterministicRootCauseRanker,
    RankedSkill,
    to_hypotheses,
)

MASTERY_THRESHOLD = 0.7


def _confidence(
    *, event_count: int, ranked: list[RankedSkill], abstained: bool
) -> float:
    """Deterministic confidence from event volume and top-support ratio.

    confidence = clamp01(0.2 + 0.03 * n_events + 0.4 * top_support_ratio)
    Abstention uses a reduced scale so values stay low.
    """
    if event_count <= 0:
        return 0.0
    top_support = len(ranked[0].supporting_evidence_ids) if ranked else 0
    top_contradict = len(ranked[0].contradicting_evidence_ids) if ranked else 0
    denom = max(1, top_support + top_contradict)
    support_ratio = top_support / denom
    raw = 0.2 + 0.03 * event_count + 0.4 * support_ratio
    if abstained:
        raw = 0.15 + 0.04 * event_count + 0.1 * support_ratio
    return max(0.0, min(1.0, round(raw, 4)))


def diagnose(
    events: list[EvidenceEventV1],
    curriculum: Curriculum,
    items: ItemIndex,
    *,
    now: datetime | None = None,
) -> StudentDiagnosticProfileV1:
    """Run deterministic diagnosis for one student evidence sequence.

    Same evidence sequence always yields the same profile when `now` is fixed.
    """
    if not events:
        msg = "diagnose requires at least one evidence event"
        raise ValueError(msg)

    student_id = events[0].student_id
    lesson_id = events[0].lesson_id or curriculum.lesson_id
    generated_at = now or datetime.now(tz=UTC)

    estimator = BetaBernoulliMasteryEstimator()
    mastery = estimator.update(events)
    ranker = DeterministicRootCauseRanker()
    abstention = AbstentionPolicy()

    if abstention.insufficient_input(events, items):
        ranked = ranker.rank_for_abstention(events, curriculum, items)
        return StudentDiagnosticProfileV1(
            schema_version="1",
            student_id=student_id,
            lesson_id=lesson_id,
            target_skill_id=curriculum.target_skill_id,
            readiness_status="abstained",
            confidence=_confidence(
                event_count=len(events), ranked=ranked, abstained=True
            ),
            root_causes=to_hypotheses(ranked),
            generated_at=generated_at,
        )

    ranked = ranker.rank(events, curriculum, items, mastery)
    observed_weak = {
        skill_id
        for skill_id, mean in mastery.items()
        if mean < MASTERY_THRESHOLD
        and any(not event.is_correct and event.skill_id == skill_id for event in events)
    }
    if not observed_weak:
        supporting = [event.id for event in events if event.is_correct]
        ready_ranked = [
            RankedSkill(
                skill_id=curriculum.target_skill_id,
                supporting_evidence_ids=tuple(supporting[:3])
                or tuple(event.id for event in events[:1]),
                contradicting_evidence_ids=(),
            )
        ]
        return StudentDiagnosticProfileV1(
            schema_version="1",
            student_id=student_id,
            lesson_id=lesson_id,
            target_skill_id=curriculum.target_skill_id,
            readiness_status="ready",
            confidence=_confidence(
                event_count=len(events), ranked=ready_ranked, abstained=False
            ),
            root_causes=to_hypotheses(ready_ranked),
            generated_at=generated_at,
        )

    if abstention.conflicting_top_skill(ranked):
        ranked = ranker.rank_for_abstention(events, curriculum, items)
        return StudentDiagnosticProfileV1(
            schema_version="1",
            student_id=student_id,
            lesson_id=lesson_id,
            target_skill_id=curriculum.target_skill_id,
            readiness_status="abstained",
            confidence=_confidence(
                event_count=len(events), ranked=ranked, abstained=True
            ),
            root_causes=to_hypotheses(ranked),
            generated_at=generated_at,
        )

    return StudentDiagnosticProfileV1(
        schema_version="1",
        student_id=student_id,
        lesson_id=lesson_id,
        target_skill_id=curriculum.target_skill_id,
        readiness_status="needs_support",
        confidence=_confidence(event_count=len(events), ranked=ranked, abstained=False),
        root_causes=to_hypotheses(ranked),
        generated_at=generated_at,
    )

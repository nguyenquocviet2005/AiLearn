from __future__ import annotations

from datetime import UTC, datetime

from ailearn_diagnostic.mastery import BetaBernoulliMasteryEstimator
from ailearn_schemas import EvidenceEventV1


def _event(
    *,
    event_id: str,
    skill_id: str,
    is_correct: bool,
) -> EvidenceEventV1:
    return EvidenceEventV1(
        schema_version="1",
        id=event_id,
        student_id="stu_test",
        session_id="sess_test",
        skill_id=skill_id,
        item_id=f"item_{event_id}",
        is_correct=is_correct,
        recorded_at=datetime(2026, 7, 18, tzinfo=UTC),
        lesson_id="lesson_test",
    )


def test_beta_bernoulli_updates_correct_response() -> None:
    estimator = BetaBernoulliMasteryEstimator()
    mastery = estimator.update(
        [_event(event_id="e1", skill_id="skill_a", is_correct=True)]
    )
    # α=2, β=1 → 2/3
    assert mastery["skill_a"] == 2 / 3


def test_mastery_updates_are_deterministic() -> None:
    estimator = BetaBernoulliMasteryEstimator()
    events = [
        _event(event_id="e1", skill_id="skill_a", is_correct=True),
        _event(event_id="e2", skill_id="skill_a", is_correct=False),
        _event(event_id="e3", skill_id="skill_b", is_correct=False),
    ]
    first = estimator.update(events)
    second = estimator.update(events)
    assert first == second
    assert first["skill_a"] == 0.5  # α=2, β=2
    assert first["skill_b"] == 1 / 3  # α=1, β=2


def test_incorrect_counts() -> None:
    estimator = BetaBernoulliMasteryEstimator()
    events = [
        _event(event_id="e1", skill_id="skill_a", is_correct=False),
        _event(event_id="e2", skill_id="skill_a", is_correct=False),
        _event(event_id="e3", skill_id="skill_b", is_correct=True),
    ]
    assert estimator.incorrect_counts(events) == {"skill_a": 2}

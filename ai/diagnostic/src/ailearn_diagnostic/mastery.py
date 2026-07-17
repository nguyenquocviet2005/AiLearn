from __future__ import annotations

from collections import defaultdict
from typing import Protocol

from ailearn_schemas import EvidenceEventV1


class MasteryEstimator(Protocol):
    def update(self, events: list[EvidenceEventV1]) -> dict[str, float]:
        """Return posterior mean mastery per skill_id."""


class BetaBernoulliMasteryEstimator:
    """Beta-Bernoulli mastery with uniform prior α0=β0=1.

    Correct responses increment α; incorrect responses increment β.
    Posterior mean is α / (α + β).
    """

    def __init__(self, alpha0: float = 1.0, beta0: float = 1.0) -> None:
        self._alpha0 = alpha0
        self._beta0 = beta0

    def update(self, events: list[EvidenceEventV1]) -> dict[str, float]:
        counts: dict[str, list[float]] = defaultdict(
            lambda: [self._alpha0, self._beta0]
        )
        for event in events:
            alpha, beta = counts[event.skill_id]
            if event.is_correct:
                counts[event.skill_id] = [alpha + 1.0, beta]
            else:
                counts[event.skill_id] = [alpha, beta + 1.0]
        return {
            skill_id: alpha / (alpha + beta)
            for skill_id, (alpha, beta) in sorted(counts.items())
        }

    def incorrect_counts(self, events: list[EvidenceEventV1]) -> dict[str, int]:
        counts: dict[str, int] = defaultdict(int)
        for event in events:
            if not event.is_correct:
                counts[event.skill_id] += 1
        return dict(sorted(counts.items()))

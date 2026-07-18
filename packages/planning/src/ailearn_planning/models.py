from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class PriorityScore:
    """Visible deterministic components behind one teaching priority."""

    skill_id: str
    rank: int
    affected_student_count: int
    prevalence: float
    downstream_impact: float
    lesson_urgency: float
    diagnostic_confidence: float
    total_score: float
    rationale: str

"""Evidence-based student progress (blueprint §9.5).

Progress is reported as *evidence sufficiency*, never as a ranking or an
absolute mastery claim. Each skill the student has touched gets one of four
states, and the wording the UI shows is derived from these, not from a score:

* ``sufficient_secure``  – enough evidence, and it points to competence.
* ``sufficient_gap``     – enough evidence, and it points to a gap to work on.
* ``emerging``           – some evidence, not yet enough to be sure.
* ``insufficient``       – too little evidence to say anything.

"Enough evidence" is a deterministic count threshold, so the same evidence
always produces the same progress view.
"""

from __future__ import annotations

from dataclasses import dataclass

from ailearn_schemas import EvidenceEventV1

from ailearn_diagnostic.mastery import BetaBernoulliMasteryEstimator
from ailearn_diagnostic.models import Curriculum

# Evidence counts needed before a skill's state is treated as settled.
SUFFICIENT_ATTEMPTS = 3
EMERGING_ATTEMPTS = 2
# Posterior mean at or above this reads as "evidence points to competence".
SECURE_MASTERY = 0.7


@dataclass(frozen=True, slots=True)
class SkillProgress:
    skill_id: str
    skill_name: str
    level: int
    attempts: int
    correct: int
    state: str
    is_target: bool


@dataclass(frozen=True, slots=True)
class StudentProgress:
    student_id: str
    lesson_id: str
    target_skill_id: str
    total_attempts: int
    skills_with_sufficient_evidence: int
    skills_practiced: int
    practice_attempts: int
    skills: tuple[SkillProgress, ...]


def _state(attempts: int, correct: int, mastery: float) -> str:
    if attempts < EMERGING_ATTEMPTS:
        return "insufficient"
    if attempts < SUFFICIENT_ATTEMPTS:
        return "emerging"
    return "sufficient_secure" if mastery >= SECURE_MASTERY else "sufficient_gap"


def summarize_progress(
    events: list[EvidenceEventV1],
    curriculum: Curriculum,
    *,
    student_id: str,
    lesson_id: str,
) -> StudentProgress:
    """Summarize one student's evidence into a per-skill progress view.

    Deterministic: skills are ordered by curriculum level then skill_id.
    """
    attempts: dict[str, int] = {}
    correct: dict[str, int] = {}
    practice_attempts = 0
    for event in events:
        attempts[event.skill_id] = attempts.get(event.skill_id, 0) + 1
        if event.is_correct:
            correct[event.skill_id] = correct.get(event.skill_id, 0) + 1
        # Remediation practice is written under a dedicated session id.
        if event.session_id.endswith("_remediation"):
            practice_attempts += 1

    mastery = BetaBernoulliMasteryEstimator().update(events)

    rows: list[SkillProgress] = []
    for skill_id, count in attempts.items():
        skill = curriculum.skills.get(skill_id)
        if skill is None:
            continue
        n_correct = correct.get(skill_id, 0)
        rows.append(
            SkillProgress(
                skill_id=skill_id,
                skill_name=skill.name,
                level=skill.level,
                attempts=count,
                correct=n_correct,
                state=_state(count, n_correct, mastery.get(skill_id, 0.0)),
                is_target=skill_id == curriculum.target_skill_id,
            )
        )
    rows.sort(key=lambda row: (row.level, row.skill_id))

    return StudentProgress(
        student_id=student_id,
        lesson_id=lesson_id,
        target_skill_id=curriculum.target_skill_id,
        total_attempts=len(events),
        skills_with_sufficient_evidence=sum(
            1 for row in rows if row.state.startswith("sufficient")
        ),
        skills_practiced=len(rows),
        practice_attempts=practice_attempts,
        skills=tuple(rows),
    )

from typing import Literal

from pydantic import BaseModel

ProgressState = Literal["sufficient_secure", "sufficient_gap", "emerging", "insufficient"]


class SkillProgressResponse(BaseModel):
    """Per-skill evidence sufficiency. Never a score or a ranking."""

    skill_id: str
    skill_name: str
    level: int
    attempts: int
    correct: int
    state: ProgressState
    is_target: bool


class StudentProgressResponse(BaseModel):
    schema_version: Literal["1"] = "1"
    student_id: str
    lesson_id: str
    target_skill_id: str
    total_attempts: int
    skills_practiced: int
    skills_with_sufficient_evidence: int
    practice_attempts: int
    skills: list[SkillProgressResponse]

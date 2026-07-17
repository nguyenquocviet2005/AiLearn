from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SnapshotStudent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str = Field(min_length=1)
    readiness_status: Literal["ready", "needs_support", "abstained"]
    confidence: float = Field(ge=0.0, le=1.0)
    primary_root_cause_skill_id: str | None = None


class SnapshotGroup(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    intervention_need: str = Field(min_length=1)
    student_ids: list[str] = Field(min_length=1)
    rationale: str = Field(min_length=1)


class TeachingPriority(BaseModel):
    model_config = ConfigDict(extra="forbid")

    skill_id: str = Field(min_length=1)
    rank: int = Field(ge=1)
    rationale: str = Field(min_length=1)


class ClassSnapshotV1(BaseModel):
    """Class-level aggregation for teacher planning."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    class_id: str = Field(min_length=1)
    lesson_id: str = Field(min_length=1)
    generated_at: datetime
    students: list[SnapshotStudent]
    unknown_student_ids: list[str]
    groups: list[SnapshotGroup] = Field(min_length=3, max_length=5)
    teaching_priorities: list[TeachingPriority]

    @model_validator(mode="after")
    def students_appear_once(self) -> "ClassSnapshotV1":
        known_ids = [student.student_id for student in self.students]
        unknown_ids = list(self.unknown_student_ids)
        combined = known_ids + unknown_ids
        if len(combined) != len(set(combined)):
            msg = "each student must appear exactly once across students and unknown_student_ids"
            raise ValueError(msg)
        return self

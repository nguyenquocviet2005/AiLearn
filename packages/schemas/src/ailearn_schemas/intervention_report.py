from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OutcomeKind = Literal[
    "passed_transfer",
    "still_struggling",
    "root_cause_reclassified",
    "incomplete",
    "teacher_escalation",
]


class OutcomeCounts(BaseModel):
    model_config = ConfigDict(extra="forbid")

    passed_transfer: int = Field(ge=0)
    still_struggling: int = Field(ge=0)
    root_cause_reclassified: int = Field(ge=0)
    incomplete: int = Field(ge=0)
    teacher_escalation: int = Field(ge=0)


class StudentOutcome(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str = Field(min_length=1)
    outcome: OutcomeKind
    evidence_ids: list[str]


class RemainingGap(BaseModel):
    model_config = ConfigDict(extra="forbid")

    skill_id: str = Field(min_length=1)
    student_ids: list[str] = Field(min_length=1)


class InterventionReportV1(BaseModel):
    """Teacher-facing intervention outcomes and next-lesson focus."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    id: str = Field(min_length=1)
    class_id: str = Field(min_length=1)
    lesson_id: str = Field(min_length=1)
    generated_at: datetime
    outcome_counts: OutcomeCounts
    student_outcomes: list[StudentOutcome]
    remaining_gaps: list[RemainingGap]
    next_lesson_focus: str = Field(min_length=1)
    printable_lesson_plan_id: str = Field(min_length=1)

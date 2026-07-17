from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class LessonActivity(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    duration_minutes: int = Field(ge=1)
    root_cause_skill_id: str = Field(min_length=1)
    skill_id: str = Field(min_length=1)
    expected_evidence: str = Field(min_length=1)
    rationale: str = Field(min_length=1)


class TeacherLessonPlanV1(BaseModel):
    """Structured 45-minute lesson plan for teacher review."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    id: str = Field(min_length=1)
    class_id: str = Field(min_length=1)
    lesson_id: str = Field(min_length=1)
    status: Literal["draft", "edited", "approved"]
    total_duration_minutes: int = Field(ge=1, le=45)
    activities: list[LessonActivity] = Field(min_length=1)
    generated_at: datetime

    @model_validator(mode="after")
    def durations_match_total(self) -> "TeacherLessonPlanV1":
        activity_total = sum(activity.duration_minutes for activity in self.activities)
        if activity_total != self.total_duration_minutes:
            msg = "sum of activity durations must equal total_duration_minutes"
            raise ValueError(msg)
        if activity_total > 45:
            msg = "total lesson duration must not exceed 45 minutes"
            raise ValueError(msg)
        return self

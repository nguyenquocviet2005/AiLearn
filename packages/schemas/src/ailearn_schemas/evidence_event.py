from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class EvidenceEventV1(BaseModel):
    """Single readiness or practice response stored as evidence."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    id: str = Field(min_length=1)
    student_id: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    skill_id: str = Field(min_length=1)
    item_id: str = Field(min_length=1)
    is_correct: bool
    recorded_at: datetime
    lesson_id: str | None = None
    response_label: str | None = None

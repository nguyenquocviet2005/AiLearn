from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class EvidenceEventRecord(BaseModel):
    """Persistence row returned from Supabase evidence_events."""

    model_config = ConfigDict(extra="ignore")

    id: str
    schema_version: str
    student_id: str
    session_id: str
    skill_id: str
    item_id: str
    is_correct: bool
    recorded_at: datetime
    lesson_id: str | None = None
    response_label: str | None = None
    confidence: float | None = None


class EvidenceEventCreateRequest(BaseModel):
    """HTTP body for creating an evidence event."""

    model_config = ConfigDict(extra="forbid")

    schema_version: str = Field(pattern=r"^1$")
    id: str = Field(min_length=1)
    student_id: str = Field(min_length=1)
    session_id: str = Field(min_length=1)
    skill_id: str = Field(min_length=1)
    item_id: str = Field(min_length=1)
    is_correct: bool
    recorded_at: datetime
    lesson_id: str | None = None
    response_label: str | None = None
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class EvidenceEventResponse(BaseModel):
    """HTTP response for a stored evidence event."""

    schema_version: str
    id: str
    student_id: str
    session_id: str
    skill_id: str
    item_id: str
    is_correct: bool
    recorded_at: datetime
    lesson_id: str | None = None
    response_label: str | None = None
    confidence: float | None = None

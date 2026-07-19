from pydantic import BaseModel, ConfigDict, Field

from ailearn_api.models.evidence import EvidenceEventResponse


class ItemOptionPublic(BaseModel):
    """Student-facing option: never carries the answer key."""

    model_config = ConfigDict(extra="forbid")

    label: str


class AssessmentItemPublic(BaseModel):
    """Student-facing assessment item: never carries is_correct/misconception_id."""

    model_config = ConfigDict(extra="forbid")

    item_id: str
    skill_ids: list[str]
    form: str
    stem: str
    options: list[ItemOptionPublic]


class StartSessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_id: str = Field(min_length=1)
    lesson_id: str = Field(min_length=1)


class StartSessionResponse(BaseModel):
    session_id: str
    student_id: str
    lesson_id: str
    target_skill_id: str
    items: list[AssessmentItemPublic]
    reason: str | None = Field(
        default=None,
        description="Why this item was chosen. Only populated by /diagnostics/probe.",
    )


class SubmitResponseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    item_id: str = Field(min_length=1)
    response_label: str = Field(min_length=1)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)


class SubmitResponseResponse(BaseModel):
    evidence_event: EvidenceEventResponse
    remaining_item_ids: list[str]
    session_complete: bool

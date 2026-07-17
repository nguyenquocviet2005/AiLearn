from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class RootCauseHypothesis(BaseModel):
    model_config = ConfigDict(extra="forbid")

    skill_id: str = Field(min_length=1)
    rank: int = Field(ge=1)
    supporting_evidence_ids: list[str]
    contradicting_evidence_ids: list[str]


class StudentDiagnosticProfileV1(BaseModel):
    """Deterministic diagnostic output for one student and lesson."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    student_id: str = Field(min_length=1)
    lesson_id: str = Field(min_length=1)
    target_skill_id: str = Field(min_length=1)
    readiness_status: Literal["ready", "needs_support", "abstained"]
    confidence: float = Field(ge=0.0, le=1.0)
    root_causes: list[RootCauseHypothesis]
    generated_at: datetime

    @model_validator(mode="after")
    def abstained_allows_empty_root_causes(self) -> "StudentDiagnosticProfileV1":
        if self.readiness_status == "abstained":
            return self
        if not self.root_causes:
            msg = "root_causes must be non-empty unless readiness_status is abstained"
            raise ValueError(msg)
        return self

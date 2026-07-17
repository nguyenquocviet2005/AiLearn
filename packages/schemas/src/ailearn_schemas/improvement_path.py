from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

RemediationState = Literal[
    "CONFIRMATION",
    "REPAIR",
    "PRACTICE",
    "TRANSFER",
    "TEACHER_ESCALATION",
]

StepKind = Literal[
    "worked_example",
    "guided_problem",
    "independent_problem",
    "near_transfer",
    "result",
]

Representation = Literal["text", "table", "diagram"]


class ImprovementStep(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    kind: StepKind
    state: RemediationState
    completed: bool


class StudentImprovementPathV1(BaseModel):
    """Remediation path state for one student."""

    model_config = ConfigDict(extra="forbid")

    schema_version: Literal["1"]
    id: str = Field(min_length=1)
    student_id: str = Field(min_length=1)
    target_skill_id: str = Field(min_length=1)
    current_state: RemediationState
    representation: Representation
    steps: list[ImprovementStep] = Field(min_length=1)
    updated_at: datetime
    root_cause_skill_id: str | None = None

    @model_validator(mode="after")
    def root_cause_when_not_confirmation(self) -> "StudentImprovementPathV1":
        if self.current_state != "CONFIRMATION" and not self.root_cause_skill_id:
            msg = (
                "root_cause_skill_id is required when current_state is not CONFIRMATION"
            )
            raise ValueError(msg)
        return self

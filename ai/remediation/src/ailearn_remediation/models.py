"""Domain models for the remediation engine.

Serialization targets StudentImprovementPathV1
(packages/schemas/json/improvement-path.v1.schema.json).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Optional

from .enums import ReadinessStatus, RemediationState, Representation, StepKind


@dataclass(frozen=True, slots=True)
class RootCause:
    """One ranked root cause from StudentDiagnosticProfileV1."""

    skill_id: str
    rank: int
    supporting_evidence_ids: tuple[str, ...] = ()
    contradicting_evidence_ids: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class DiagnosticProfile:
    """Input contract: StudentDiagnosticProfileV1 (produced by VAI-14)."""

    student_id: str
    lesson_id: str
    target_skill_id: str
    readiness_status: ReadinessStatus
    confidence: float
    root_causes: tuple[RootCause, ...] = ()

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "DiagnosticProfile":
        return cls(
            student_id=data["student_id"],
            lesson_id=data["lesson_id"],
            target_skill_id=data["target_skill_id"],
            readiness_status=ReadinessStatus(data["readiness_status"]),
            confidence=float(data["confidence"]),
            root_causes=tuple(
                RootCause(
                    skill_id=rc["skill_id"],
                    rank=int(rc["rank"]),
                    supporting_evidence_ids=tuple(
                        rc.get("supporting_evidence_ids", ())
                    ),
                    contradicting_evidence_ids=tuple(
                        rc.get("contradicting_evidence_ids", ())
                    ),
                )
                for rc in data.get("root_causes", [])
            ),
        )


@dataclass(slots=True)
class Step:
    """One step of StudentImprovementPathV1.steps[]."""

    id: str
    kind: StepKind
    state: RemediationState
    completed: bool = False

    def to_dict(self) -> dict[str, Any]:
        # additionalProperties=false -> emit exactly the 4 required keys.
        return {
            "id": self.id,
            "kind": self.kind.value,
            "state": self.state.value,
            "completed": self.completed,
        }


@dataclass(slots=True)
class ImprovementPath:
    """Output contract: StudentImprovementPathV1."""

    id: str
    student_id: str
    target_skill_id: str
    current_state: RemediationState
    representation: Representation
    steps: list[Step]
    updated_at: str
    root_cause_skill_id: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            "schema_version": "1",
            "id": self.id,
            "student_id": self.student_id,
            "target_skill_id": self.target_skill_id,
            "current_state": self.current_state.value,
            "representation": self.representation.value,
            "steps": [s.to_dict() for s in self.steps],
            "updated_at": self.updated_at,
        }
        # Optional field, nullable in schema.
        out["root_cause_skill_id"] = self.root_cause_skill_id
        return out


@dataclass(frozen=True, slots=True)
class AttemptOutcome:
    """Result the student produced on the current step."""

    step_id: str
    is_correct: bool
    recorded_at: str


@dataclass(slots=True)
class SessionState:
    """Mutable runtime state of one remediation session.

    Not part of the shared contract; internal to ai/remediation.
    """

    student_id: str
    lesson_id: str
    target_skill_id: str
    current_state: RemediationState
    representation: Representation
    root_cause_skill_id: Optional[str] = None
    # Index into the pedagogical SEQUENCE.
    step_index: int = 0
    consecutive_failures: int = 0
    representations_tried: list[Representation] = field(default_factory=list)
    prerequisites_stepped_back: list[str] = field(default_factory=list)
    transfer_outcome: Optional[bool] = None
    escalation_reason: Optional[str] = None

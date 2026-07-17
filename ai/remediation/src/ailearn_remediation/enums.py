"""Enums for the remediation engine.

CRITICAL: All values MUST match packages/schemas/json/improvement-path.v1.schema.json
exactly, because they are serialized directly into StudentImprovementPathV1.
"""

from __future__ import annotations

from enum import Enum


class RemediationState(str, Enum):
    """Workflow states. Values match schema enum for `current_state` / `steps[].state`."""

    CONFIRMATION = "CONFIRMATION"
    REPAIR = "REPAIR"
    PRACTICE = "PRACTICE"
    TRANSFER = "TRANSFER"
    TEACHER_ESCALATION = "TEACHER_ESCALATION"


class StepKind(str, Enum):
    """Activity kinds. Values match schema enum for `steps[].kind`."""

    WORKED_EXAMPLE = "worked_example"
    GUIDED_PROBLEM = "guided_problem"
    INDEPENDENT_PROBLEM = "independent_problem"
    NEAR_TRANSFER = "near_transfer"
    RESULT = "result"


class Representation(str, Enum):
    """Representation modes. Values match schema enum for `representation`."""

    TEXT = "text"
    TABLE = "table"
    DIAGRAM = "diagram"


class ReadinessStatus(str, Enum):
    """Values match diagnostic-profile.v1.schema.json enum for `readiness_status`."""

    READY = "ready"
    NEEDS_SUPPORT = "needs_support"
    ABSTAINED = "abstained"


# Pedagogical order of the adaptive sequence (VAI-16 "Adaptive sequence").
SEQUENCE: tuple[StepKind, ...] = (
    StepKind.WORKED_EXAMPLE,
    StepKind.GUIDED_PROBLEM,
    StepKind.INDEPENDENT_PROBLEM,
    StepKind.NEAR_TRANSFER,
    StepKind.RESULT,
)

# Which state each step kind belongs to.
STEP_STATE: dict[StepKind, RemediationState] = {
    StepKind.WORKED_EXAMPLE: RemediationState.REPAIR,
    StepKind.GUIDED_PROBLEM: RemediationState.REPAIR,
    StepKind.INDEPENDENT_PROBLEM: RemediationState.PRACTICE,
    StepKind.NEAR_TRANSFER: RemediationState.TRANSFER,
    StepKind.RESULT: RemediationState.TRANSFER,
}

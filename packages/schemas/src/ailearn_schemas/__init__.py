"""Shared AiLearn V1 contract schemas."""

from ailearn_schemas.class_snapshot import (
    ClassSnapshotV1,
    SnapshotGroup,
    SnapshotStudent,
    TeachingPriority,
)
from ailearn_schemas.evidence_event import EvidenceEventV1
from ailearn_schemas.improvement_path import ImprovementStep, StudentImprovementPathV1
from ailearn_schemas.intervention_report import (
    InterventionReportV1,
    OutcomeCounts,
    RemainingGap,
    StudentOutcome,
)
from ailearn_schemas.lesson_plan import (
    LessonActivity,
    TeacherLessonPlanV1,
    TeacherPlanVersionV1,
)
from ailearn_schemas.diagnostic_profile import (
    RootCauseHypothesis,
    StudentDiagnosticProfileV1,
)

SCHEMA_VERSION_V1 = "1"

__all__ = [
    "SCHEMA_VERSION_V1",
    "ClassSnapshotV1",
    "EvidenceEventV1",
    "ImprovementStep",
    "InterventionReportV1",
    "LessonActivity",
    "OutcomeCounts",
    "RemainingGap",
    "RootCauseHypothesis",
    "SnapshotGroup",
    "SnapshotStudent",
    "StudentDiagnosticProfileV1",
    "StudentImprovementPathV1",
    "StudentOutcome",
    "TeacherLessonPlanV1",
    "TeacherPlanVersionV1",
    "TeachingPriority",
]

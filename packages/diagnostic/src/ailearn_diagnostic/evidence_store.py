from __future__ import annotations

from typing import Any, Protocol

from ailearn_schemas import EvidenceEventV1
from pydantic import ValidationError


class EvidenceStore(Protocol):
    def save(self, event: EvidenceEventV1) -> EvidenceEventV1: ...

    def get(self, event_id: str) -> EvidenceEventV1 | None: ...


def validate_evidence_event(payload: dict[str, Any]) -> EvidenceEventV1:
    """Validate an evidence payload against EvidenceEventV1."""
    return EvidenceEventV1.model_validate(payload)


def to_persistence_row(event: EvidenceEventV1) -> dict[str, Any]:
    """Map a validated evidence event to a Supabase-friendly row."""
    return {
        "id": event.id,
        "schema_version": event.schema_version,
        "student_id": event.student_id,
        "session_id": event.session_id,
        "skill_id": event.skill_id,
        "item_id": event.item_id,
        "is_correct": event.is_correct,
        "recorded_at": event.recorded_at.isoformat().replace("+00:00", "Z"),
        "lesson_id": event.lesson_id,
        "response_label": event.response_label,
        "confidence": event.confidence,
    }


class InMemoryEvidenceStore:
    """Process-local evidence store for unit tests and offline stubs."""

    def __init__(self) -> None:
        self._events: dict[str, EvidenceEventV1] = {}

    def save(self, event: EvidenceEventV1) -> EvidenceEventV1:
        self._events[event.id] = event
        return event

    def get(self, event_id: str) -> EvidenceEventV1 | None:
        return self._events.get(event_id)

    def save_payload(self, payload: dict[str, Any]) -> EvidenceEventV1:
        try:
            event = validate_evidence_event(payload)
        except ValidationError:
            raise
        return self.save(event)

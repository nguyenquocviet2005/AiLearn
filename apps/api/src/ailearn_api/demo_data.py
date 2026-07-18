"""Synthetic, resettable personas used by the submission demo only."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1

SEEDS_PATH = Path(__file__).resolve().parents[4] / "data" / "seeds" / "demo-personas.json"
EVIDENCE_PATH = (
    Path(__file__).resolve().parents[4] / "data" / "seeds" / "demo-persona-evidence.json"
)

_DEFAULT_EXIT_TICKET = {
    "id": "exit_inverse_relation",
    "question": (
        "Khi số người cùng làm một công việc tăng lên, thời gian hoàn thành thường "
        "thay đổi thế nào?"
    ),
    "options": ["Tăng lên", "Giảm xuống"],
    "correct_response_label": "Giảm xuống",
}


def _evidence_by_id() -> dict[str, EvidenceEventV1]:
    payload: dict[str, Any] = json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))
    events = payload.get("events")
    if payload.get("schema_version") != "1" or not isinstance(events, list):
        raise ValueError("Demo persona evidence must use schema version 1 and contain events")
    validated = [EvidenceEventV1.model_validate(event) for event in events]
    by_id = {event.id: event for event in validated}
    if len(by_id) != len(validated):
        raise ValueError("Demo persona evidence ids must be unique")
    return by_id


def _validate_profile(
    raw_profile: object,
    *,
    persona_id: str,
    student_id: str,
    evidence_by_id: dict[str, EvidenceEventV1],
    referenced_evidence_ids: set[str],
) -> StudentDiagnosticProfileV1:
    profile = StudentDiagnosticProfileV1.model_validate(raw_profile)
    if profile.student_id != student_id:
        raise ValueError(f"Demo persona {persona_id} profile student id does not match")
    for root_cause in profile.root_causes:
        if not root_cause.supporting_evidence_ids:
            raise ValueError(
                f"Demo persona {persona_id} root cause must link to supporting evidence"
            )
        for evidence_id in root_cause.supporting_evidence_ids:
            evidence = evidence_by_id.get(evidence_id)
            if (
                evidence is None
                or evidence.student_id != student_id
                or evidence.lesson_id != profile.lesson_id
                or evidence.skill_id != root_cause.skill_id
                or evidence.is_correct
            ):
                raise ValueError(
                    f"Demo persona {persona_id} supporting evidence {evidence_id} is inconsistent"
                )
            referenced_evidence_ids.add(evidence_id)
        for evidence_id in root_cause.contradicting_evidence_ids:
            evidence = evidence_by_id.get(evidence_id)
            if (
                evidence is None
                or evidence.student_id != student_id
                or evidence.lesson_id != profile.lesson_id
                or evidence.skill_id != root_cause.skill_id
                or not evidence.is_correct
            ):
                raise ValueError(
                    f"Demo persona {persona_id} contradicting evidence "
                    f"{evidence_id} is inconsistent"
                )
            referenced_evidence_ids.add(evidence_id)
    return profile


@lru_cache(maxsize=1)
def _payload() -> dict[str, Any]:
    payload: dict[str, Any] = json.loads(SEEDS_PATH.read_text(encoding="utf-8"))
    personas = payload.get("personas")
    if payload.get("schema_version") != "1" or not isinstance(personas, list):
        raise ValueError("Demo persona seed must use schema version 1 and contain personas")
    if len(personas) != 6:
        raise ValueError("Demo persona seed must contain exactly six personas")

    evidence_by_id = _evidence_by_id()
    referenced_evidence_ids: set[str] = set()
    persona_ids: set[str] = set()
    student_ids: set[str] = set()
    diagnosed_root_causes: set[str] = set()
    abstention_count = 0
    for persona in personas:
        persona_id = str(persona.get("id", ""))
        student_id = str(persona.get("student_id", ""))
        if not persona_id or persona_id in persona_ids:
            raise ValueError("Demo persona ids must be present and unique")
        if not student_id or student_id in student_ids:
            raise ValueError("Demo persona student ids must be present and unique")
        persona_ids.add(persona_id)
        student_ids.add(student_id)

        profile = _validate_profile(
            persona.get("profile"),
            persona_id=persona_id,
            student_id=student_id,
            evidence_by_id=evidence_by_id,
            referenced_evidence_ids=referenced_evidence_ids,
        )
        if profile.readiness_status == "abstained":
            abstention_count += 1
            if profile.root_causes:
                raise ValueError(
                    f"Demo persona {persona_id} abstention must not claim a root cause"
                )
        else:
            if not profile.root_causes:
                raise ValueError(f"Demo persona {persona_id} must include a supported root cause")
            diagnosed_root_causes.update(root_cause.skill_id for root_cause in profile.root_causes)

        ticket = persona.get("exit_ticket")
        if not isinstance(ticket, dict):
            raise ValueError(f"Demo persona {persona_id} must include an exit ticket")
        options = ticket.get("options")
        if not isinstance(options, list) or ticket.get("correct_response_label") not in options:
            raise ValueError(f"Demo persona {persona_id} exit ticket answer must be an option")
        reclassified_profile = ticket.get("reclassified_profile")
        if reclassified_profile is not None:
            _validate_profile(
                reclassified_profile,
                persona_id=persona_id,
                student_id=student_id,
                evidence_by_id=evidence_by_id,
                referenced_evidence_ids=referenced_evidence_ids,
            )
            if ticket.get("reclassify_on_response_label") not in options:
                raise ValueError(
                    f"Demo persona {persona_id} reclassification answer must be an option"
                )

    if len(diagnosed_root_causes) < 3:
        raise ValueError("Demo personas must cover at least three root-cause patterns")
    if abstention_count < 1:
        raise ValueError("Demo personas must include at least one abstention case")
    if referenced_evidence_ids != set(evidence_by_id):
        raise ValueError("Demo persona evidence must be referenced exactly once by the scenarios")
    return payload


def list_personas() -> list[dict[str, str]]:
    return [
        {
            "id": persona["id"],
            "label": persona["label"],
            "student_id": persona["student_id"],
            "display_name": persona["display_name"],
        }
        for persona in _payload()["personas"]
    ]


def get_persona(persona_id: str) -> dict[str, Any] | None:
    return next(
        (persona for persona in _payload()["personas"] if persona["id"] == persona_id),
        None,
    )


def get_persona_for_student(student_id: str) -> dict[str, Any] | None:
    return next(
        (persona for persona in _payload()["personas"] if persona["student_id"] == student_id),
        None,
    )


def exit_ticket_definition(student_id: str) -> dict[str, Any]:
    persona = get_persona_for_student(student_id)
    if persona is None:
        return _DEFAULT_EXIT_TICKET
    return persona["exit_ticket"]


def public_exit_ticket(student_id: str) -> dict[str, Any]:
    ticket = exit_ticket_definition(student_id)
    return {
        "id": ticket["id"],
        "question": ticket["question"],
        "options": ticket["options"],
    }

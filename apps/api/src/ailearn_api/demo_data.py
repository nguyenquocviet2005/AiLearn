"""Synthetic, resettable personas used by the submission demo only."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

SEEDS_PATH = Path(__file__).resolve().parents[4] / "data" / "seeds" / "demo-personas.json"

_DEFAULT_EXIT_TICKET = {
    "id": "exit_inverse_relation",
    "question": (
        "Khi số người cùng làm một công việc tăng lên, thời gian hoàn thành thường "
        "thay đổi thế nào?"
    ),
    "options": ["Tăng lên", "Giảm xuống"],
    "correct_response_label": "Giảm xuống",
}


@lru_cache(maxsize=1)
def _payload() -> dict[str, Any]:
    return json.loads(SEEDS_PATH.read_text(encoding="utf-8"))


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

from __future__ import annotations

import uuid
from dataclasses import dataclass, field

from ailearn_diagnostic import AssessmentItem


@dataclass
class DiagnosticSessionState:
    session_id: str
    student_id: str
    lesson_id: str
    target_skill_id: str
    items: dict[str, AssessmentItem]
    item_order: list[str]
    answered_item_ids: set[str] = field(default_factory=set)

    def remaining_item_ids(self) -> list[str]:
        return [item_id for item_id in self.item_order if item_id not in self.answered_item_ids]

    def is_complete(self) -> bool:
        return not self.remaining_item_ids()


# In-memory session store. Swapped for Supabase during integration (VAI-20),
# matching the precedent set by routes/remediation.py's `_sessions` dict.
_sessions: dict[str, DiagnosticSessionState] = {}


def create_session(
    student_id: str,
    lesson_id: str,
    target_skill_id: str,
    items: list[AssessmentItem],
) -> DiagnosticSessionState:
    session_id = f"sess_{student_id}_readiness_{uuid.uuid4().hex[:8]}"
    session = DiagnosticSessionState(
        session_id=session_id,
        student_id=student_id,
        lesson_id=lesson_id,
        target_skill_id=target_skill_id,
        items={item.item_id: item for item in items},
        item_order=[item.item_id for item in items],
    )
    _sessions[session_id] = session
    return session


def get_session(session_id: str) -> DiagnosticSessionState | None:
    return _sessions.get(session_id)

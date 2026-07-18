"""Remediation HTTP surface.

Thin transport only (VAI-16 "thin HTTP only"): parse -> delegate to
packages/remediation + packages/content -> serialize. No business logic lives here.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from ailearn_content import ContentGenerator
from ailearn_remediation import (
    AttemptOutcome,
    DiagnosticProfile,
    RemediationEngine,
    SessionState,
)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ailearn_api.demo_data import (
    exit_ticket_definition,
    public_exit_ticket,
)

router = APIRouter(prefix="/api/v1/remediation", tags=["remediation"])

_engine = RemediationEngine()
_content = ContentGenerator()

# In-memory session store. Swapped for Supabase during integration (VAI-20).
_sessions: dict[str, SessionState] = {}

# Per-student processed attempt_ids -> the response returned the first time.
# A retried attempt_id replays this instead of calling engine.advance() again,
# since RemediationEngine.advance() has no idempotency of its own (VAI-18).
_processed_attempts: dict[str, dict[str, dict[str, Any]]] = {}

# Per-student idempotency store for exit-ticket submissions. This follows the
# same transient-store boundary as remediation attempts until VAI-20.
_processed_exit_tickets: dict[str, dict[str, dict[str, Any]]] = {}


def _now() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


class StartRequest(BaseModel):
    profile: dict[str, Any] = Field(..., description="StudentDiagnosticProfileV1")


class AttemptRequest(BaseModel):
    student_id: str
    step_id: str
    is_correct: bool
    attempt_id: str


class ConfirmRequest(BaseModel):
    student_id: str
    evidence_sufficient: bool


class ExitTicketRequest(BaseModel):
    student_id: str
    ticket_id: str
    response_label: str
    submission_id: str


def _content_payload(session: SessionState) -> dict[str, Any]:
    c = _content.generate(
        skill_id=session.root_cause_skill_id,
        state=session.current_state.value,
        kind=_engine.current_step_kind(session).value,
        representation=session.representation.value,
    )
    return {
        "template_id": c.template_id,
        "title": c.title,
        "body": c.body,
        "checkpoint_question": c.checkpoint_question,
        "checkpoint_answer": c.checkpoint_answer,
        "representation": c.representation,
        "source": c.source,
    }


def _response(session: SessionState) -> dict[str, Any]:
    result: dict[str, Any] = {
        "path": _engine.to_path(session, _now()).to_dict(),
        "current_step_kind": _engine.current_step_kind(session).value,
        "is_complete": _engine.is_complete(session),
        "transfer_outcome": session.transfer_outcome,
        "escalation_reason": session.escalation_reason,
        "content": _content_payload(session),
    }
    if result["is_complete"]:
        result["exit_ticket"] = public_exit_ticket(session.student_id)
    return result


def _get(student_id: str) -> SessionState:
    session = _sessions.get(student_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"No session for {student_id}")
    return session


def reset_remediation_state() -> None:
    """Clear transient remediation state for an explicit demo reset only."""
    _sessions.clear()
    _processed_attempts.clear()
    _processed_exit_tickets.clear()


@router.post("/sessions")
def start_session(req: StartRequest) -> dict[str, Any]:
    """Start a remediation session from a diagnostic profile."""
    try:
        profile = DiagnosticProfile.from_dict(req.profile)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid profile: {exc}") from exc
    session = _engine.start(profile)
    _sessions[profile.student_id] = session
    return _response(session)


@router.post("/attempts")
def submit_attempt(req: AttemptRequest) -> dict[str, Any]:
    """Record one attempt and advance the path.

    Idempotent on attempt_id: a retried request for the same attempt_id replays
    the response recorded the first time instead of advancing the state machine
    again (VAI-18 — RemediationEngine.advance() has no idempotency of its own).
    """
    session = _get(req.student_id)

    student_attempts = _processed_attempts.setdefault(req.student_id, {})
    if req.attempt_id in student_attempts:
        return student_attempts[req.attempt_id]

    session = _engine.advance(session, AttemptOutcome(req.step_id, req.is_correct, _now()))
    _sessions[req.student_id] = session
    result = _response(session)
    student_attempts[req.attempt_id] = result
    return result


@router.post("/confirm")
def confirm_evidence(req: ConfirmRequest) -> dict[str, Any]:
    """Resolve CONFIRMATION once more evidence is available."""
    session = _get(req.student_id)
    session = _engine.confirm(session, req.evidence_sufficient)
    _sessions[req.student_id] = session
    return _response(session)


@router.post("/exit-tickets")
def submit_exit_ticket(req: ExitTicketRequest) -> dict[str, Any]:
    """Record a final transfer response and select the safe next action.

    The answer key lives in the synthetic demo fixture and is never returned to
    the browser. A deliberately contradictory answer in the reclassification
    persona restarts remediation from the fixture's evidence-backed profile.
    """
    session = _get(req.student_id)
    processed = _processed_exit_tickets.setdefault(req.student_id, {})
    if req.submission_id in processed:
        return processed[req.submission_id]
    if not _engine.is_complete(session):
        raise HTTPException(
            status_code=409,
            detail="Complete the remediation path before submitting an exit ticket.",
        )

    ticket = exit_ticket_definition(req.student_id)
    public_ticket = public_exit_ticket(req.student_id)
    if req.ticket_id != public_ticket["id"]:
        raise HTTPException(status_code=422, detail="Unknown exit ticket")
    if req.response_label not in public_ticket["options"]:
        raise HTTPException(status_code=422, detail="Invalid exit-ticket response")

    recorded_at = _now()
    reclassified_profile = None
    if req.response_label == ticket.get("reclassify_on_response_label"):
        reclassified_profile = ticket["reclassified_profile"]
        session = _engine.start(DiagnosticProfile.from_dict(reclassified_profile))
        _sessions[req.student_id] = session
        outcome = {
            "kind": "diagnosis_reclassified",
            "recorded_at": recorded_at,
            "message": "Câu trả lời mới giúp điều chỉnh bài luyện tiếp theo.",
            "reclassified_profile": reclassified_profile,
        }
    elif req.response_label == ticket["correct_response_label"]:
        outcome = {
            "kind": "transfer_passed",
            "recorded_at": recorded_at,
            "message": "Em đã áp dụng được kiến thức vào một tình huống mới.",
            "reclassified_profile": None,
        }
    else:
        session = _engine.escalate(session, "esc_exit_ticket")
        _sessions[req.student_id] = session
        outcome = {
            "kind": "teacher_escalation",
            "recorded_at": recorded_at,
            "message": "Cô sẽ cùng em xem lại bước này ở buổi học tiếp theo.",
            "reclassified_profile": None,
        }

    result = {"outcome": outcome, "remediation": _response(session)}
    processed[req.submission_id] = result
    return result


@router.get("/sessions/{student_id}")
def get_session(student_id: str) -> dict[str, Any]:
    return _response(_get(student_id))

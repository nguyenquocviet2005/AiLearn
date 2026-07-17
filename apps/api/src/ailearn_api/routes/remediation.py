"""Remediation HTTP surface.

Thin transport only (VAI-16 "thin HTTP only"): parse -> delegate to
ai/remediation + ai/content -> serialize. No business logic lives here.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from ailearn_content import ContentGenerator
from ailearn_remediation import (
    AttemptOutcome,
    DiagnosticProfile,
    RemediationEngine,
    RemediationState,
    Representation,
    SessionState,
)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix="/api/v1/remediation", tags=["remediation"])

_engine = RemediationEngine()
_content = ContentGenerator()

# In-memory session store. Swapped for Supabase during integration (VAI-20).
_sessions: dict[str, SessionState] = {}


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class StartRequest(BaseModel):
    profile: dict[str, Any] = Field(..., description="StudentDiagnosticProfileV1")


class AttemptRequest(BaseModel):
    student_id: str
    step_id: str
    is_correct: bool


class ConfirmRequest(BaseModel):
    student_id: str
    evidence_sufficient: bool


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
        "representation": c.representation,
        "source": c.source,
    }


def _response(session: SessionState) -> dict[str, Any]:
    return {
        "path": _engine.to_path(session, _now()).to_dict(),
        "current_step_kind": _engine.current_step_kind(session).value,
        "is_complete": _engine.is_complete(session),
        "escalation_reason": session.escalation_reason,
        "content": _content_payload(session),
    }


def _get(student_id: str) -> SessionState:
    session = _sessions.get(student_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"No session for {student_id}")
    return session


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
    """Record one attempt and advance the path."""
    session = _get(req.student_id)
    session = _engine.advance(
        session, AttemptOutcome(req.step_id, req.is_correct, _now())
    )
    _sessions[req.student_id] = session
    return _response(session)


@router.post("/confirm")
def confirm_evidence(req: ConfirmRequest) -> dict[str, Any]:
    """Resolve CONFIRMATION once more evidence is available."""
    session = _get(req.student_id)
    session = _engine.confirm(session, req.evidence_sufficient)
    _sessions[req.student_id] = session
    return _response(session)


@router.get("/sessions/{student_id}")
def get_session(student_id: str) -> dict[str, Any]:
    return _response(_get(student_id))

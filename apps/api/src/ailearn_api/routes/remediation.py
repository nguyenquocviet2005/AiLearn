"""Remediation HTTP surface.

Thin transport only (VAI-16 "thin HTTP only"): parse -> delegate to
packages/remediation + packages/content -> serialize. No business logic lives here.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Any

from ailearn_content import ContentGenerator
from ailearn_remediation import (
    AttemptOutcome,
    DiagnosticProfile,
    RemediationEngine,
    SessionState,
    load_skill_misconceptions,
)
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ailearn_api.config import Settings, get_settings
from ailearn_api.demo_data import (
    exit_ticket_definition,
    public_exit_ticket,
)
from ailearn_api.durable_session_store import (
    RemediationSessionRecord,
    fetch_remediation_session,
    save_remediation_session,
)
from ailearn_api.durable_session_store import (
    is_configured as durable_sessions_configured,
)
from ailearn_api.evidence_client import insert_evidence_event, parse_evidence_event_payload
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1/remediation", tags=["remediation"])

_engine = RemediationEngine()
_content = ContentGenerator()
_skill_misconceptions = load_skill_misconceptions()

# Local-development fallback when Supabase is deliberately not configured.
_sessions: dict[str, SessionState] = {}

# Per-student processed attempt_ids -> the response returned the first time.
# A retried attempt_id replays this instead of calling engine.advance() again,
# since RemediationEngine.advance() has no idempotency of its own (VAI-18).
_processed_attempts: dict[str, dict[str, dict[str, Any]]] = {}

# Per-student exit-ticket idempotency fallback for local development.
_processed_exit_tickets: dict[str, dict[str, dict[str, Any]]] = {}


def _now() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


class StartRequest(BaseModel):
    profile: dict[str, Any] = Field(..., description="StudentDiagnosticProfileV1")


class AttemptRequest(BaseModel):
    student_id: str
    step_id: str
    attempt_id: str
    # Exactly one of these must be set, matching whether the current step is
    # server-graded (`response`) or self-reported (`is_correct`) — see submit_attempt.
    response: str | None = None
    is_correct: bool | None = None


class ConfirmRequest(BaseModel):
    student_id: str
    evidence_sufficient: bool


class ExitTicketRequest(BaseModel):
    student_id: str
    ticket_id: str
    response_label: str
    submission_id: str


def _content_payload(session: SessionState) -> dict[str, Any]:
    misconception_id = (
        _skill_misconceptions.get(session.root_cause_skill_id)
        if session.root_cause_skill_id
        else None
    )
    c = _content.generate(
        skill_id=session.root_cause_skill_id,
        state=session.current_state.value,
        kind=_engine.current_step_kind(session).value,
        representation=session.representation.value,
        misconception_id=misconception_id,
    )
    return {
        "template_id": c.template_id,
        "title": c.title,
        "body": c.body,
        "checkpoint_question": c.checkpoint_question,
        "is_gradable": c.is_gradable,
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


def _storage_error(exc: SupabaseUnavailableError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "supabase_unavailable",
            "message": "Remediation session storage is unavailable.",
        },
    )


async def _get(settings: Settings, student_id: str) -> RemediationSessionRecord:
    if durable_sessions_configured(settings):
        try:
            record = await fetch_remediation_session(settings, student_id)
        except SupabaseUnavailableError as exc:
            raise _storage_error(exc) from exc
        if record is None:
            raise HTTPException(status_code=404, detail=f"No session for {student_id}")
        return record

    session = _sessions.get(student_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"No session for {student_id}")
    return RemediationSessionRecord(
        session=session,
        processed_attempts=_processed_attempts.setdefault(student_id, {}),
        processed_exit_tickets=_processed_exit_tickets.setdefault(student_id, {}),
    )


async def _save(settings: Settings, record: RemediationSessionRecord) -> None:
    if durable_sessions_configured(settings):
        try:
            await save_remediation_session(settings, record)
        except SupabaseUnavailableError as exc:
            raise _storage_error(exc) from exc
        return
    _sessions[record.session.student_id] = record.session
    _processed_attempts[record.session.student_id] = record.processed_attempts
    _processed_exit_tickets[record.session.student_id] = record.processed_exit_tickets


async def _record_exit_ticket_evidence(
    settings: Settings,
    request: ExitTicketRequest,
    session: SessionState,
    recorded_at: str,
    is_correct: bool,
) -> None:
    """Make transfer evidence visible to the live diagnostic/class projection."""
    if not durable_sessions_configured(settings):
        return
    payload = {
        "schema_version": "1",
        "id": f"ev_{request.student_id}_exit_{request.submission_id}",
        "student_id": request.student_id,
        "session_id": f"remediation_{request.student_id}",
        "skill_id": session.target_skill_id,
        "item_id": request.ticket_id,
        "is_correct": is_correct,
        "recorded_at": recorded_at,
        "lesson_id": session.lesson_id,
        "response_label": request.response_label,
    }
    try:
        event = parse_evidence_event_payload(payload)
        await insert_evidence_event(settings, event)
    except (ValueError, SupabaseUnavailableError) as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Transfer evidence storage is unavailable.",
            },
        ) from exc


def reset_remediation_state() -> None:
    """Clear transient remediation state for an explicit demo reset only."""
    _sessions.clear()
    _processed_attempts.clear()
    _processed_exit_tickets.clear()


@router.post("/sessions")
async def start_session(
    req: StartRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Start a remediation session from a diagnostic profile."""
    try:
        profile = DiagnosticProfile.from_dict(req.profile)
    except (KeyError, ValueError) as exc:
        raise HTTPException(status_code=422, detail=f"Invalid profile: {exc}") from exc
    session = _engine.start(profile)
    await _save(
        settings,
        RemediationSessionRecord(session=session, processed_attempts={}, processed_exit_tickets={}),
    )
    return _response(session)


@router.post("/attempts")
async def submit_attempt(
    req: AttemptRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Record one attempt and advance the path.

    Idempotent on attempt_id: a retried request for the same attempt_id replays
    the response recorded the first time instead of advancing the state machine
    again (VAI-18 — RemediationEngine.advance() has no idempotency of its own).

    Gradable checkpoints (an accepted-answer template) are graded server-side from
    `response`; a client-supplied `is_correct` is never trusted for those steps. Only
    self-report steps (no accepted answer to grade against) use `is_correct` directly.
    """
    record = await _get(settings, req.student_id)

    if req.attempt_id in record.processed_attempts:
        return record.processed_attempts[req.attempt_id]

    current_content = _content.generate(
        skill_id=record.session.root_cause_skill_id,
        state=record.session.current_state.value,
        kind=_engine.current_step_kind(record.session).value,
        representation=record.session.representation.value,
        misconception_id=(
            _skill_misconceptions.get(record.session.root_cause_skill_id)
            if record.session.root_cause_skill_id
            else None
        ),
    )
    if current_content.is_gradable:
        if req.response is None:
            raise HTTPException(
                status_code=422,
                detail="This step is server-graded; submit `response`, not `is_correct`.",
            )
        is_correct = _content.grade(current_content.template_id, req.response)
    else:
        if req.is_correct is None:
            raise HTTPException(
                status_code=422,
                detail="This step is self-reported; submit `is_correct`.",
            )
        is_correct = req.is_correct

    record.session = _engine.advance(
        record.session, AttemptOutcome(req.step_id, is_correct, _now())
    )
    result = _response(record.session)
    result["last_attempt_correct"] = is_correct
    record.processed_attempts[req.attempt_id] = result
    await _save(settings, record)
    return result


@router.post("/confirm")
async def confirm_evidence(
    req: ConfirmRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Resolve CONFIRMATION once more evidence is available."""
    record = await _get(settings, req.student_id)
    record.session = _engine.confirm(record.session, req.evidence_sufficient)
    await _save(settings, record)
    return _response(record.session)


@router.post("/exit-tickets")
async def submit_exit_ticket(
    req: ExitTicketRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    """Record a final transfer response and select the safe next action.

    The answer key lives in the synthetic demo fixture and is never returned to
    the browser. A deliberately contradictory answer in the reclassification
    persona restarts remediation from the fixture's evidence-backed profile.
    """
    record = await _get(settings, req.student_id)
    if req.submission_id in record.processed_exit_tickets:
        return record.processed_exit_tickets[req.submission_id]
    if not _engine.is_complete(record.session):
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
        record.session = _engine.start(DiagnosticProfile.from_dict(reclassified_profile))
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
        record.session = _engine.escalate(record.session, "esc_exit_ticket")
        outcome = {
            "kind": "teacher_escalation",
            "recorded_at": recorded_at,
            "message": "Cô sẽ cùng em xem lại bước này ở buổi học tiếp theo.",
            "reclassified_profile": None,
        }

    await _record_exit_ticket_evidence(
        settings,
        req,
        record.session,
        recorded_at,
        req.response_label == ticket["correct_response_label"],
    )
    result = {"outcome": outcome, "remediation": _response(record.session)}
    record.processed_exit_tickets[req.submission_id] = result
    await _save(settings, record)
    return result


@router.get("/sessions/{student_id}")
async def get_session(
    student_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
) -> dict[str, Any]:
    return _response((await _get(settings, student_id)).session)

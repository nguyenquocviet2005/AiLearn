from datetime import UTC, datetime
from typing import Annotated, Any

from ailearn_diagnostic import AssessmentItem, build_readiness_session
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from ailearn_api.config import Settings, get_settings
from ailearn_api.curriculum import CURRICULUM, ITEMS
from ailearn_api.diagnostic_session_store import create_session, get_session
from ailearn_api.evidence_client import (
    fetch_evidence_event,
    insert_evidence_event,
    parse_evidence_event_payload,
)
from ailearn_api.models.diagnostic_session import (
    AssessmentItemPublic,
    ItemOptionPublic,
    StartSessionRequest,
    StartSessionResponse,
    SubmitResponseRequest,
    SubmitResponseResponse,
)
from ailearn_api.models.evidence import EvidenceEventCreateRequest, EvidenceEventResponse
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1", tags=["diagnostics"])


def _to_response(record: Any) -> EvidenceEventResponse:
    return EvidenceEventResponse.model_validate(record, from_attributes=True)


def _public_item(item: AssessmentItem) -> AssessmentItemPublic:
    """Strip the answer key (is_correct, misconception_id) before returning an item."""
    return AssessmentItemPublic(
        item_id=item.item_id,
        skill_ids=list(item.skill_ids),
        form=item.form,
        stem=item.stem,
        options=[ItemOptionPublic(label=option.label) for option in item.options],
    )


@router.post(
    "/evidence-events",
    response_model=EvidenceEventResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        422: {"description": "Evidence payload failed contract validation"},
        503: {"description": "Supabase evidence storage is unavailable"},
    },
)
async def create_evidence_event(
    body: EvidenceEventCreateRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> EvidenceEventResponse:
    try:
        event = parse_evidence_event_payload(body.model_dump(mode="json"))
        record = await insert_evidence_event(settings, event)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "invalid_evidence_event",
                "message": "Evidence event failed schema validation.",
            },
        ) from exc
    except SupabaseUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Evidence storage is unavailable.",
            },
        ) from exc
    return _to_response(record)


@router.get(
    "/evidence-events/{event_id}",
    response_model=EvidenceEventResponse,
    responses={
        404: {"description": "Evidence event was not found"},
        503: {"description": "Supabase evidence storage is unavailable"},
    },
)
async def get_evidence_event(
    event_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
) -> EvidenceEventResponse:
    try:
        record = await fetch_evidence_event(settings, event_id)
    except SupabaseUnavailableError as exc:
        message = str(exc)
        if "missing" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "evidence_event_not_found",
                    "message": "Evidence event was not found.",
                },
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Evidence storage is unavailable.",
            },
        ) from exc
    return _to_response(record)


@router.post(
    "/diagnostics/start",
    response_model=StartSessionResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        404: {"description": "Unknown lesson_id"},
        422: {"description": "A readiness session could not be built for this lesson"},
    },
)
async def start_diagnostic_session(body: StartSessionRequest) -> StartSessionResponse:
    if body.lesson_id != CURRICULUM.lesson_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "lesson_not_found", "message": "Unknown lesson_id."},
        )
    try:
        items = build_readiness_session(CURRICULUM, ITEMS)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "readiness_session_unavailable",
                "message": "Could not build a readiness session for this lesson.",
            },
        ) from exc

    session = create_session(
        student_id=body.student_id,
        lesson_id=CURRICULUM.lesson_id,
        target_skill_id=CURRICULUM.target_skill_id,
        items=items,
    )
    return StartSessionResponse(
        session_id=session.session_id,
        student_id=session.student_id,
        lesson_id=session.lesson_id,
        target_skill_id=session.target_skill_id,
        items=[_public_item(item) for item in items],
    )


@router.post(
    "/diagnostics/{session_id}/responses",
    response_model=SubmitResponseResponse,
    responses={
        404: {"description": "Unknown session or item"},
        422: {"description": "response_label does not match any option for this item"},
        503: {"description": "Supabase evidence storage is unavailable"},
    },
)
async def submit_diagnostic_response(
    session_id: str,
    body: SubmitResponseRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> SubmitResponseResponse:
    session = get_session(session_id)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "diagnostic_session_not_found",
                "message": "Diagnostic session was not found.",
            },
        )

    item = session.items.get(body.item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "diagnostic_item_not_found",
                "message": "Item is not part of this session.",
            },
        )

    option = next((opt for opt in item.options if opt.label == body.response_label), None)
    if option is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "invalid_response_label",
                "message": "response_label does not match any option for this item.",
            },
        )

    # Deterministic id: a retry with the same session+item hits the PK conflict path
    # in insert_evidence_event and idempotently replays the first recorded answer.
    event_id = f"ev_{session_id}_{item.item_id}"
    payload = {
        "schema_version": "1",
        "id": event_id,
        "student_id": session.student_id,
        "session_id": session_id,
        "skill_id": item.skill_ids[0],
        "item_id": item.item_id,
        "is_correct": option.is_correct,
        "recorded_at": datetime.now(UTC).isoformat(),
        "lesson_id": session.lesson_id,
        "response_label": body.response_label,
    }

    try:
        event = parse_evidence_event_payload(payload)
        record = await insert_evidence_event(settings, event)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "invalid_evidence_event",
                "message": "Evidence event failed schema validation.",
            },
        ) from exc
    except SupabaseUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Evidence storage is unavailable.",
            },
        ) from exc

    session.answered_item_ids.add(item.item_id)
    return SubmitResponseResponse(
        evidence_event=_to_response(record),
        remaining_item_ids=session.remaining_item_ids(),
        session_complete=session.is_complete(),
    )

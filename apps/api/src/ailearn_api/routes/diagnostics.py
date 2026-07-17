from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import ValidationError

from ailearn_api.config import Settings, get_settings
from ailearn_api.evidence_client import (
    fetch_evidence_event,
    insert_evidence_event,
    parse_evidence_event_payload,
)
from ailearn_api.models.evidence import EvidenceEventCreateRequest, EvidenceEventResponse
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1", tags=["diagnostics"])


def _to_response(record: Any) -> EvidenceEventResponse:
    return EvidenceEventResponse.model_validate(record, from_attributes=True)


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

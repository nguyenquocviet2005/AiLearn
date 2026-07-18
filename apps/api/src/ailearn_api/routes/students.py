from typing import Annotated

from ailearn_diagnostic import diagnose
from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ailearn_api.config import Settings, get_settings
from ailearn_api.curriculum import CURRICULUM, ITEMS
from ailearn_api.evidence_client import fetch_evidence_events_for_student
from ailearn_api.students_client import fetch_student
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1/students", tags=["students"])


@router.get(
    "/{student_id}/diagnostic-profile",
    response_model=StudentDiagnosticProfileV1,
    responses={
        404: {"description": "Student or diagnostic profile was not found"},
        503: {"description": "Supabase evidence storage is unavailable"},
    },
)
async def get_diagnostic_profile(
    student_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    lesson_id: Annotated[str, Query()] = CURRICULUM.lesson_id,
) -> StudentDiagnosticProfileV1:
    try:
        await fetch_student(settings, student_id)
    except SupabaseUnavailableError as exc:
        message = str(exc)
        if "missing" in message.lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "student_not_found", "message": "Student was not found."},
            ) from exc
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Student lookup is unavailable.",
            },
        ) from exc

    try:
        records = await fetch_evidence_events_for_student(settings, student_id, lesson_id)
    except SupabaseUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Evidence storage is unavailable.",
            },
        ) from exc

    if not records:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "diagnostic_profile_not_found",
                "message": "No readiness evidence has been recorded for this student yet.",
            },
        )

    events = [EvidenceEventV1.model_validate(record.model_dump()) for record in records]
    return diagnose(events, CURRICULUM, ITEMS)

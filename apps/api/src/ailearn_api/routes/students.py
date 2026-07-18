from typing import Annotated

from ailearn_diagnostic import diagnose, summarize_progress
from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1
from fastapi import APIRouter, Depends, HTTPException, Query, status

from ailearn_api.config import Settings, get_settings
from ailearn_api.curriculum import CURRICULUM, ITEMS
from ailearn_api.evidence_client import fetch_evidence_events_for_student
from ailearn_api.models.progress import SkillProgressResponse, StudentProgressResponse
from ailearn_api.students_client import fetch_student
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1/students", tags=["students"])


async def _load_evidence(
    settings: Settings, student_id: str, lesson_id: str
) -> list[EvidenceEventV1]:
    """Resolve the student, then load their evidence for one lesson.

    Raises 404 for an unknown student, 503 when evidence storage is down.
    """
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

    return [EvidenceEventV1.model_validate(record.model_dump()) for record in records]


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
    events = await _load_evidence(settings, student_id, lesson_id)
    if not events:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "diagnostic_profile_not_found",
                "message": "No readiness evidence has been recorded for this student yet.",
            },
        )
    return diagnose(events, CURRICULUM, ITEMS)


@router.get(
    "/{student_id}/progress",
    response_model=StudentProgressResponse,
    responses={
        404: {"description": "Student was not found"},
        503: {"description": "Supabase evidence storage is unavailable"},
    },
)
async def get_student_progress(
    student_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
    lesson_id: Annotated[str, Query()] = CURRICULUM.lesson_id,
) -> StudentProgressResponse:
    """Evidence-based progress for one student (blueprint §9.5).

    Reports evidence sufficiency per skill rather than a score or ranking, and
    returns an empty view (not a 404) before any evidence exists.
    """
    events = await _load_evidence(settings, student_id, lesson_id)
    progress = summarize_progress(events, CURRICULUM, student_id=student_id, lesson_id=lesson_id)
    return StudentProgressResponse(
        student_id=progress.student_id,
        lesson_id=progress.lesson_id,
        target_skill_id=progress.target_skill_id,
        total_attempts=progress.total_attempts,
        skills_practiced=progress.skills_practiced,
        skills_with_sufficient_evidence=progress.skills_with_sufficient_evidence,
        practice_attempts=progress.practice_attempts,
        skills=[
            SkillProgressResponse(
                skill_id=row.skill_id,
                skill_name=row.skill_name,
                level=row.level,
                attempts=row.attempts,
                correct=row.correct,
                state=row.state,  # type: ignore[arg-type]
                is_target=row.is_target,
            )
            for row in progress.skills
        ],
    )

from datetime import UTC, datetime
from typing import Annotated, Literal

from ailearn_schemas import ClassSnapshotV1, TeacherLessonPlanV1, TeacherPlanVersionV1
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict

from ailearn_api.config import Settings, get_settings
from ailearn_api.durable_session_store import is_configured as durable_sessions_configured
from ailearn_api.supabase_client import SupabaseUnavailableError
from ailearn_api.teacher_fixtures import initial_plan_version
from ailearn_api.teacher_plan_store import append_plan_version, fetch_latest_plan_version
from ailearn_api.teacher_projection import DEMO_CLASS_ID, build_live_snapshot

router = APIRouter(prefix="/api/v1/lesson-plans", tags=["lesson-plans"])


class EditPlanRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_parent_version: int
    snapshot: ClassSnapshotV1
    lesson_plan: TeacherLessonPlanV1


class ExpectedVersionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    expected_parent_version: int


def _validated_edit_snapshot(previous: ClassSnapshotV1, edited: ClassSnapshotV1) -> ClassSnapshotV1:
    if (
        previous.class_id != edited.class_id
        or previous.lesson_id != edited.lesson_id
        or previous.generated_at != edited.generated_at
        or previous.students != edited.students
        or previous.unknown_student_ids != edited.unknown_student_ids
        or previous.teaching_priorities != edited.teaching_priorities
    ):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "immutable_snapshot_field",
                "message": "Only group membership can be edited.",
            },
        )
    before = {group.id: group for group in previous.groups}
    if set(before) != {group.id for group in edited.groups}:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "invalid_groups",
                "message": "Teacher edits must retain the proposed groups.",
            },
        )
    ids = [student_id for group in edited.groups for student_id in group.student_ids]
    expected = [student.student_id for student in previous.students]
    if sorted(ids) != sorted(expected) or len(ids) != len(set(ids)):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "invalid_groups",
                "message": "Each diagnosed student must appear in one group.",
            },
        )
    for group in edited.groups:
        original = before[group.id]
        if (
            group.intervention_need != original.intervention_need
            or group.rationale != original.rationale
        ):
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "immutable_group_field",
                    "message": "Only group membership can be edited.",
                },
            )
    return edited


def _validated_edit_plan(
    previous: TeacherLessonPlanV1, edited: TeacherLessonPlanV1
) -> TeacherLessonPlanV1:
    if (previous.id, previous.class_id, previous.lesson_id, previous.generated_at) != (
        edited.id,
        edited.class_id,
        edited.lesson_id,
        edited.generated_at,
    ) or len(previous.activities) != len(edited.activities):
        raise HTTPException(
            status_code=422,
            detail={
                "code": "immutable_plan_field",
                "message": "Only activity durations can be edited.",
            },
        )
    for old, new in zip(previous.activities, edited.activities, strict=True):
        if old.model_copy(update={"duration_minutes": new.duration_minutes}) != new:
            raise HTTPException(
                status_code=422,
                detail={
                    "code": "immutable_activity_field",
                    "message": "Only activity durations can be edited.",
                },
            )
    return edited


def _not_found(plan_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "code": "lesson_plan_not_found",
            "message": f"Lesson plan {plan_id} was not found.",
        },
    )


def _require_current_version(expected: int, current: int) -> None:
    if expected != current:
        raise HTTPException(
            status_code=409,
            detail={
                "code": "stale_lesson_plan_version",
                "message": "Refresh before changing the teacher plan.",
            },
        )


async def _initial(settings: Settings) -> TeacherPlanVersionV1:
    if durable_sessions_configured(settings):
        try:
            snapshot = await build_live_snapshot(settings, DEMO_CLASS_ID)
        except SupabaseUnavailableError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "code": "supabase_unavailable",
                    "message": "Teacher class projection is unavailable.",
                },
            ) from exc
        if snapshot is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"code": "class_not_found", "message": "Class was not found."},
            )
        return initial_plan_version(snapshot)
    return initial_plan_version()


async def _latest(settings: Settings, plan_id: str) -> TeacherPlanVersionV1:
    try:
        stored = await fetch_latest_plan_version(settings, plan_id)
    except SupabaseUnavailableError as exc:
        if "not configured" in str(exc):
            # The committed seed projection is safe to inspect without persistence.
            candidate = await _initial(settings)
            if candidate.plan_id == plan_id:
                return candidate
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Teacher plan storage is unavailable.",
            },
        ) from exc
    if stored is not None:
        return stored
    candidate = await _initial(settings)
    if candidate.plan_id != plan_id:
        raise _not_found(plan_id)
    return candidate


async def _append(
    settings: Settings,
    previous: TeacherPlanVersionV1,
    *,
    snapshot: ClassSnapshotV1,
    lesson_plan: TeacherLessonPlanV1,
    decision: Literal["pending", "approved", "rejected"],
    published: bool = False,
) -> TeacherPlanVersionV1:
    plan = lesson_plan
    if plan.id != previous.plan_id:
        raise HTTPException(
            status_code=422,
            detail={
                "code": "plan_id_mismatch",
                "message": "Edited plan id must match the existing plan.",
            },
        )
    if decision == "approved":
        plan = plan.model_copy(update={"status": "approved"})
    elif decision == "rejected":
        plan = plan.model_copy(update={"status": "edited"})
    else:
        plan = plan.model_copy(update={"status": "edited"})
    version = TeacherPlanVersionV1(
        schema_version="1",
        id=f"{previous.plan_id}:v{previous.version + 1}",
        plan_id=previous.plan_id,
        version=previous.version + 1,
        parent_version_id=previous.id,
        decision=decision,
        published_at=datetime.now(UTC) if published else None,
        created_at=datetime.now(UTC),
        snapshot=snapshot,
        lesson_plan=plan,
    )
    try:
        return await append_plan_version(settings, version)
    except SupabaseUnavailableError as exc:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "supabase_unavailable",
                "message": "Teacher plan storage is unavailable.",
            },
        ) from exc


@router.get("/{plan_id}", response_model=TeacherPlanVersionV1)
async def get_lesson_plan(
    plan_id: str, settings: Annotated[Settings, Depends(get_settings)]
) -> TeacherPlanVersionV1:
    return await _latest(settings, plan_id)


@router.post(
    "/{plan_id}/versions", response_model=TeacherPlanVersionV1, status_code=status.HTTP_201_CREATED
)
async def create_edited_version(
    plan_id: str, body: EditPlanRequest, settings: Annotated[Settings, Depends(get_settings)]
) -> TeacherPlanVersionV1:
    previous = await _latest(settings, plan_id)
    _require_current_version(body.expected_parent_version, previous.version)
    return await _append(
        settings,
        previous,
        snapshot=_validated_edit_snapshot(previous.snapshot, body.snapshot),
        lesson_plan=_validated_edit_plan(previous.lesson_plan, body.lesson_plan),
        decision="pending",
    )


@router.post(
    "/{plan_id}/approve", response_model=TeacherPlanVersionV1, status_code=status.HTTP_201_CREATED
)
async def approve_plan(
    plan_id: str,
    body: ExpectedVersionRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> TeacherPlanVersionV1:
    previous = await _latest(settings, plan_id)
    _require_current_version(body.expected_parent_version, previous.version)
    return await _append(
        settings,
        previous,
        snapshot=previous.snapshot,
        lesson_plan=previous.lesson_plan,
        decision="approved",
    )


@router.post(
    "/{plan_id}/reject", response_model=TeacherPlanVersionV1, status_code=status.HTTP_201_CREATED
)
async def reject_plan(
    plan_id: str,
    body: ExpectedVersionRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> TeacherPlanVersionV1:
    previous = await _latest(settings, plan_id)
    _require_current_version(body.expected_parent_version, previous.version)
    return await _append(
        settings,
        previous,
        snapshot=previous.snapshot,
        lesson_plan=previous.lesson_plan,
        decision="rejected",
    )


@router.post(
    "/{plan_id}/publish", response_model=TeacherPlanVersionV1, status_code=status.HTTP_201_CREATED
)
async def publish_plan(
    plan_id: str,
    body: ExpectedVersionRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> TeacherPlanVersionV1:
    previous = await _latest(settings, plan_id)
    _require_current_version(body.expected_parent_version, previous.version)
    if previous.decision != "approved":
        raise HTTPException(
            status_code=409,
            detail={
                "code": "lesson_plan_not_approved",
                "message": "A teacher must approve the plan before publication.",
            },
        )
    return await _append(
        settings,
        previous,
        snapshot=previous.snapshot,
        lesson_plan=previous.lesson_plan,
        decision="approved",
        published=True,
    )

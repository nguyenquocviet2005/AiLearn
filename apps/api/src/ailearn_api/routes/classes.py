from typing import Annotated

from ailearn_schemas import ClassSnapshotV1
from fastapi import APIRouter, Depends, HTTPException, status

from ailearn_api.config import Settings, get_settings
from ailearn_api.supabase_client import SupabaseUnavailableError
from ailearn_api.teacher_fixtures import initial_snapshot
from ailearn_api.teacher_plan_store import fetch_latest_plan_version

router = APIRouter(prefix="/api/v1/classes", tags=["classes"])


@router.get("/{class_id}/snapshot", response_model=ClassSnapshotV1)
async def get_class_snapshot(
    class_id: str,
    settings: Annotated[Settings, Depends(get_settings)],
) -> ClassSnapshotV1:
    snapshot = initial_snapshot()
    if snapshot.class_id != class_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "class_not_found", "message": "Class was not found."},
        )
    try:
        version = await fetch_latest_plan_version(settings, "plan_demo_fractions_01")
    except SupabaseUnavailableError as exc:
        if "not configured" in str(exc):
            return snapshot
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "Teacher plan storage is unavailable.",
            },
        ) from exc
    return version.snapshot if version is not None else snapshot

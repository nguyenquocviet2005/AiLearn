from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ailearn_api.config import Settings, get_settings
from ailearn_api.models.system_status import DatabaseStatus, SystemStatusResponse
from ailearn_api.supabase_client import SupabaseUnavailableError, fetch_system_status

router = APIRouter(prefix="/api/v1", tags=["system"])


@router.get(
    "/system-status",
    response_model=SystemStatusResponse,
    responses={503: {"description": "Supabase status is unavailable"}},
)
async def system_status(
    settings: Annotated[Settings, Depends(get_settings)],
) -> SystemStatusResponse:
    try:
        record = await fetch_system_status(settings)
    except SupabaseUnavailableError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "supabase_unavailable",
                "message": "System status is unavailable.",
            },
        ) from exc

    return SystemStatusResponse(
        database=DatabaseStatus(status=record.status, checked_at=record.checked_at)
    )

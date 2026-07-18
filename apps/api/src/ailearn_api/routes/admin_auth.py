"""Admin authentication HTTP surface.

Thin transport only: the browser never calls Supabase directly. This router verifies an
email/password pair against Supabase GoTrue, confirms an admin profile role, and mints a
backend-owned session token (admin_session_store.py) for the frontend to use afterward.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ailearn_api.admin_guard import require_admin_session
from ailearn_api.admin_session_store import AdminSession, create_session, delete_session
from ailearn_api.config import Settings, get_settings
from ailearn_api.gotrue_client import GoTrueInvalidCredentialsError, authenticate_with_password
from ailearn_api.models.admin_auth import (
    AdminLoginRequest,
    AdminProfileResponse,
    AdminSessionResponse,
)
from ailearn_api.profiles_client import fetch_profile
from ailearn_api.supabase_client import SupabaseUnavailableError

router = APIRouter(prefix="/api/v1/admin/auth", tags=["admin-auth"])


def _invalid_credentials() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "invalid_credentials",
            "message": "Email hoặc mật khẩu không đúng.",
        },
    )


def _unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "code": "supabase_unavailable",
            "message": "Đăng nhập quản trị hiện không khả dụng.",
        },
    )


@router.post("/login", response_model=AdminSessionResponse)
async def login(
    req: AdminLoginRequest,
    settings: Annotated[Settings, Depends(get_settings)],
) -> AdminSessionResponse:
    try:
        user_id = await authenticate_with_password(settings, req.email, req.password)
    except GoTrueInvalidCredentialsError as exc:
        raise _invalid_credentials() from exc
    except SupabaseUnavailableError as exc:
        raise _unavailable() from exc

    try:
        profile = await fetch_profile(settings, user_id)
    except SupabaseUnavailableError as exc:
        raise _unavailable() from exc

    # Same generic error whether the profile is missing or not an admin: neither the wrong
    # password case nor the wrong role case should be distinguishable to the caller.
    if profile is None or profile.role != "admin":
        raise _invalid_credentials()

    session = create_session(user_id, profile.email, profile.role)
    return AdminSessionResponse(
        token=session.token,
        expires_at=session.expires_at,
        email=session.email,
        role=session.role,
    )


@router.get("/session", response_model=AdminProfileResponse)
async def read_session(
    session: Annotated[AdminSession, Depends(require_admin_session)],
) -> AdminProfileResponse:
    return AdminProfileResponse(email=session.email, role=session.role)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session: Annotated[AdminSession, Depends(require_admin_session)],
) -> None:
    delete_session(session.token)

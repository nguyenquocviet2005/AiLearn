from typing import Annotated

from fastapi import Header, HTTPException, status

from ailearn_api.admin_session_store import AdminSession, get_session


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "admin_session_invalid",
            "message": "Phiên đăng nhập quản trị không hợp lệ hoặc đã hết hạn.",
        },
    )


async def require_admin_session(
    authorization: Annotated[str | None, Header()] = None,
) -> AdminSession:
    """FastAPI dependency guarding every /admin/* route. Backend is the source of truth."""
    if authorization is None or not authorization.startswith("Bearer "):
        raise _unauthorized()

    token = authorization.removeprefix("Bearer ").strip()
    session = get_session(token)
    if session is None or session.role != "admin":
        raise _unauthorized()
    return session

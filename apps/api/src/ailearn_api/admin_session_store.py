"""In-memory admin session storage.

Unlike diagnostic/remediation state, an admin session is cheap to lose: a backend
restart just forces re-login. No Supabase persistence is used for Phase 1.
"""

from __future__ import annotations

import secrets
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

SESSION_TTL = timedelta(hours=8)


@dataclass
class AdminSession:
    token: str
    user_id: str
    email: str
    role: str
    expires_at: datetime


_sessions: dict[str, AdminSession] = {}


def create_session(user_id: str, email: str, role: str) -> AdminSession:
    session = AdminSession(
        token=secrets.token_urlsafe(32),
        user_id=user_id,
        email=email,
        role=role,
        expires_at=datetime.now(UTC) + SESSION_TTL,
    )
    _sessions[session.token] = session
    return session


def get_session(token: str) -> AdminSession | None:
    session = _sessions.get(token)
    if session is None:
        return None
    if session.expires_at <= datetime.now(UTC):
        del _sessions[token]
        return None
    return session


def delete_session(token: str) -> None:
    _sessions.pop(token, None)


def clear_sessions() -> None:
    """Test-only reset."""
    _sessions.clear()

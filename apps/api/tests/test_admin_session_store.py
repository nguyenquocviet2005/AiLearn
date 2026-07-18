from datetime import UTC, datetime, timedelta

from ailearn_api import admin_session_store
from ailearn_api.admin_session_store import (
    create_session,
    delete_session,
    get_session,
)


def teardown_function() -> None:
    admin_session_store.clear_sessions()


def test_create_session_round_trips_through_get_session() -> None:
    session = create_session("user-1", "admin@example.com", "admin")

    fetched = get_session(session.token)

    assert fetched is not None
    assert fetched.user_id == "user-1"
    assert fetched.email == "admin@example.com"
    assert fetched.role == "admin"


def test_get_session_returns_none_for_unknown_token() -> None:
    assert get_session("unknown-token") is None


def test_get_session_evicts_expired_session() -> None:
    session = create_session("user-1", "admin@example.com", "admin")
    admin_session_store._sessions[session.token].expires_at = datetime.now(UTC) - timedelta(
        seconds=1
    )

    assert get_session(session.token) is None
    assert session.token not in admin_session_store._sessions


def test_delete_session_removes_token() -> None:
    session = create_session("user-1", "admin@example.com", "admin")

    delete_session(session.token)

    assert get_session(session.token) is None


def test_delete_session_is_a_no_op_for_unknown_token() -> None:
    delete_session("unknown-token")

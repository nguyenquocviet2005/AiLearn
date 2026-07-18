from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from ailearn_api import admin_session_store
from ailearn_api.config import Settings, get_settings
from ailearn_api.gotrue_client import GoTrueInvalidCredentialsError
from ailearn_api.models.admin_auth import ProfileRecord
from ailearn_api.supabase_client import SupabaseUnavailableError

ADMIN_PROFILE = ProfileRecord(id="user-123", email="admin@example.com", role="admin")
TEACHER_PROFILE = ProfileRecord(id="user-456", email="teacher@example.com", role="teacher")


def teardown_function() -> None:
    admin_session_store.clear_sessions()


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


def test_login_returns_503_when_unconfigured(client: TestClient) -> None:
    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@example.com", "password": "correct-password"},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_login_returns_generic_401_for_wrong_credentials(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.authenticate_with_password",
        AsyncMock(side_effect=GoTrueInvalidCredentialsError("Invalid email or password")),
    )

    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@example.com", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


def test_login_returns_same_generic_401_when_profile_is_not_admin(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.authenticate_with_password",
        AsyncMock(return_value="user-456"),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.fetch_profile",
        AsyncMock(return_value=TEACHER_PROFILE),
    )

    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "teacher@example.com", "password": "correct-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


def test_login_returns_same_generic_401_when_profile_is_missing(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.authenticate_with_password",
        AsyncMock(return_value="user-999"),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.fetch_profile",
        AsyncMock(return_value=None),
    )

    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "nobody@example.com", "password": "correct-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


def test_login_returns_503_when_profile_lookup_unavailable(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.authenticate_with_password",
        AsyncMock(return_value="user-123"),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.fetch_profile",
        AsyncMock(side_effect=SupabaseUnavailableError("Supabase request failed")),
    )

    response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@example.com", "password": "correct-password"},
    )

    assert response.status_code == 503
    assert response.json()["detail"]["code"] == "supabase_unavailable"


def test_login_succeeds_and_session_can_be_read_then_logged_out(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.authenticate_with_password",
        AsyncMock(return_value="user-123"),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.admin_auth.fetch_profile",
        AsyncMock(return_value=ADMIN_PROFILE),
    )

    login_response = client.post(
        "/api/v1/admin/auth/login",
        json={"email": "admin@example.com", "password": "correct-password"},
    )
    assert login_response.status_code == 200
    body = login_response.json()
    assert body["email"] == "admin@example.com"
    assert body["role"] == "admin"
    token = body["token"]

    session_response = client.get(
        "/api/v1/admin/auth/session",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert session_response.status_code == 200
    assert session_response.json() == {"email": "admin@example.com", "role": "admin"}

    logout_response = client.post(
        "/api/v1/admin/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout_response.status_code == 204

    after_logout_response = client.get(
        "/api/v1/admin/auth/session",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert after_logout_response.status_code == 401
    assert after_logout_response.json()["detail"]["code"] == "admin_session_invalid"


def test_session_requires_bearer_token(client: TestClient) -> None:
    response = client.get("/api/v1/admin/auth/session")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "admin_session_invalid"

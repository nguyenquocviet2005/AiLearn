from datetime import UTC, datetime
from unittest.mock import AsyncMock

from ailearn_schemas import TeacherPlanVersionV1
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.teacher_fixtures import initial_plan_version


def _configure(client: TestClient) -> None:
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url="https://example.supabase.co",
        supabase_secret_key="test-secret",
    )


def _next_version(
    previous: TeacherPlanVersionV1,
    *,
    decision: str = "pending",
    published_at: datetime | None = None,
) -> TeacherPlanVersionV1:
    plan = previous.lesson_plan.model_copy(
        update={"status": "approved" if decision == "approved" else "edited"}
    )
    return TeacherPlanVersionV1(
        schema_version="1",
        id=f"{previous.plan_id}:v{previous.version + 1}",
        plan_id=previous.plan_id,
        version=previous.version + 1,
        parent_version_id=previous.id,
        decision=decision,  # type: ignore[arg-type]
        published_at=published_at,
        created_at=datetime(2026, 7, 18, 2, 0, tzinfo=UTC),
        snapshot=previous.snapshot,
        lesson_plan=plan,
    )


def test_initial_teacher_plan_and_class_snapshot_are_inspectable_without_storage(
    client: TestClient,
) -> None:
    version = initial_plan_version()
    client.app.dependency_overrides[get_settings] = lambda: Settings(
        supabase_url=None,
        supabase_secret_key=None,
    )

    plan_response = client.get(f"/api/v1/lesson-plans/{version.plan_id}")
    snapshot_response = client.get(f"/api/v1/classes/{version.snapshot.class_id}/snapshot")

    assert plan_response.status_code == 200
    assert plan_response.json()["version"] == 1
    assert snapshot_response.status_code == 200
    assert snapshot_response.json()["groups"][0]["rationale"]


def test_class_snapshot_reflects_the_latest_persisted_teacher_version(
    client: TestClient, monkeypatch
) -> None:
    version = _next_version(initial_plan_version())
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.classes.fetch_latest_plan_version",
        AsyncMock(return_value=version),
    )

    response = client.get(f"/api/v1/classes/{version.snapshot.class_id}/snapshot")

    assert response.status_code == 200
    assert response.json() == version.snapshot.model_dump(mode="json")


def test_edit_appends_a_new_version_without_overwriting_the_proposal(
    client: TestClient, monkeypatch
) -> None:
    previous = initial_plan_version()
    created = _next_version(previous)
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.fetch_latest_plan_version",
        AsyncMock(return_value=previous),
    )
    append = AsyncMock(return_value=created)
    monkeypatch.setattr("ailearn_api.routes.lesson_plans.append_plan_version", append)

    response = client.post(
        f"/api/v1/lesson-plans/{previous.plan_id}/versions",
        json={
            "expected_parent_version": previous.version,
            "snapshot": previous.snapshot.model_dump(mode="json"),
            "lesson_plan": previous.lesson_plan.model_dump(mode="json"),
        },
    )

    assert response.status_code == 201
    assert response.json()["parent_version_id"] == previous.id
    assert response.json()["version"] == 2
    assert previous.lesson_plan.status == "draft"
    assert append.await_args.args[1].lesson_plan.status == "edited"


def test_publish_rejects_an_unapproved_plan(client: TestClient, monkeypatch) -> None:
    previous = initial_plan_version()
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.fetch_latest_plan_version",
        AsyncMock(return_value=previous),
    )

    response = client.post(
        f"/api/v1/lesson-plans/{previous.plan_id}/publish",
        json={"expected_parent_version": previous.version},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "lesson_plan_not_approved"


def test_approval_and_publish_each_append_an_auditable_version(
    client: TestClient, monkeypatch
) -> None:
    previous = initial_plan_version()
    approved = _next_version(previous, decision="approved")
    published = _next_version(
        approved,
        decision="approved",
        published_at=datetime(2026, 7, 18, 2, 5, tzinfo=UTC),
    )
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.fetch_latest_plan_version",
        AsyncMock(side_effect=[previous, approved]),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.append_plan_version",
        AsyncMock(side_effect=[approved, published]),
    )

    approve_response = client.post(
        f"/api/v1/lesson-plans/{previous.plan_id}/approve",
        json={"expected_parent_version": previous.version},
    )
    publish_response = client.post(
        f"/api/v1/lesson-plans/{previous.plan_id}/publish",
        json={"expected_parent_version": approved.version},
    )

    assert approve_response.status_code == 201
    assert approve_response.json()["decision"] == "approved"
    assert approve_response.json()["lesson_plan"]["status"] == "approved"
    assert publish_response.status_code == 201
    assert publish_response.json()["published_at"] is not None


def test_rejection_keeps_the_plan_unapproved(client: TestClient, monkeypatch) -> None:
    previous = initial_plan_version()
    rejected = _next_version(previous, decision="rejected")
    _configure(client)
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.fetch_latest_plan_version",
        AsyncMock(return_value=previous),
    )
    monkeypatch.setattr(
        "ailearn_api.routes.lesson_plans.append_plan_version",
        AsyncMock(return_value=rejected),
    )

    response = client.post(
        f"/api/v1/lesson-plans/{previous.plan_id}/reject",
        json={"expected_parent_version": previous.version},
    )

    assert response.status_code == 201
    assert response.json()["decision"] == "rejected"
    assert response.json()["lesson_plan"]["status"] == "edited"

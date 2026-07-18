from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from ailearn_api.config import Settings, get_settings
from ailearn_api.demo_data import get_persona
from ailearn_api.main import app

PERSONA_IDS = [
    "foundational-gap",
    "misconception",
    "root-cause-changes",
    "insufficient-evidence",
    "passing-transfer",
    "teacher-escalation",
]


@pytest.fixture
def transient_client() -> Iterator[TestClient]:
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    get_settings.cache_clear()


def test_lists_all_six_seeded_demo_personas(client: TestClient) -> None:
    response = client.get("/api/v1/demo/personas")

    assert response.status_code == 200
    assert [persona["id"] for persona in response.json()["personas"]] == PERSONA_IDS


@pytest.mark.parametrize("persona_id", PERSONA_IDS)
def test_reset_restores_each_seeded_persona_and_starts_its_path(
    transient_client: TestClient, persona_id: str
) -> None:
    response = transient_client.post("/api/v1/demo/reset", json={"persona_id": persona_id})

    assert response.status_code == 200
    persona = response.json()["persona"]
    assert persona["id"] == persona_id
    assert persona["profile"]["student_id"] == persona["student_id"]

    started = transient_client.post(
        "/api/v1/remediation/sessions", json={"profile": persona["profile"]}
    )
    assert started.status_code == 200
    path = started.json()["path"]
    assert path["student_id"] == persona["student_id"]
    if persona["profile"]["readiness_status"] == "abstained":
        assert path["current_state"] == "CONFIRMATION"
        assert path["root_cause_skill_id"] is None
    else:
        assert path["current_state"] == "REPAIR"
        assert path["root_cause_skill_id"] == persona["profile"]["root_causes"][0]["skill_id"]


def test_seeded_personas_cover_supported_root_causes_and_abstention() -> None:
    personas = [get_persona(persona_id) for persona_id in PERSONA_IDS]
    assert all(persona is not None for persona in personas)
    profiles = [persona["profile"] for persona in personas if persona is not None]
    diagnosed = [profile for profile in profiles if profile["readiness_status"] != "abstained"]
    root_causes = {cause["skill_id"] for profile in diagnosed for cause in profile["root_causes"]}

    assert len(root_causes) >= 3
    assert any(
        profile["readiness_status"] == "abstained" and not profile["root_causes"]
        for profile in profiles
    )
    assert all(
        cause["supporting_evidence_ids"]
        for profile in diagnosed
        for cause in profile["root_causes"]
    )


def test_reset_clears_transient_remediation_state(transient_client: TestClient) -> None:
    profile = {
        "schema_version": "1",
        "student_id": "stu_reset_check",
        "lesson_id": "lesson_g7_inverse_proportion_01",
        "target_skill_id": "skill_word_problem_work_rate",
        "readiness_status": "needs_support",
        "confidence": 0.8,
        "root_causes": [
            {
                "skill_id": "skill_ratio_proportion_basics",
                "rank": 1,
                "supporting_evidence_ids": ["ev_reset"],
                "contradicting_evidence_ids": [],
            }
        ],
        "generated_at": "2026-07-18T10:00:00Z",
    }
    transient_client.post("/api/v1/remediation/sessions", json={"profile": profile})

    reset = transient_client.post("/api/v1/demo/reset", json={"persona_id": "foundational-gap"})
    session = transient_client.get("/api/v1/remediation/sessions/stu_reset_check")

    assert reset.status_code == 200
    assert session.status_code == 404

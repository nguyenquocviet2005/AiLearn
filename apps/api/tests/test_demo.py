import pytest
from fastapi.testclient import TestClient

PERSONA_IDS = [
    "foundational-gap",
    "misconception",
    "root-cause-changes",
    "insufficient-evidence",
    "passing-transfer",
    "teacher-escalation",
]


def test_lists_all_six_seeded_demo_personas(client: TestClient) -> None:
    response = client.get("/api/v1/demo/personas")

    assert response.status_code == 200
    assert [persona["id"] for persona in response.json()["personas"]] == PERSONA_IDS


@pytest.mark.parametrize("persona_id", PERSONA_IDS)
def test_reset_restores_each_seeded_persona(client: TestClient, persona_id: str) -> None:
    response = client.post("/api/v1/demo/reset", json={"persona_id": persona_id})

    assert response.status_code == 200
    persona = response.json()["persona"]
    assert persona["id"] == persona_id
    assert persona["profile"]["student_id"] == persona["student_id"]


def test_reset_clears_transient_remediation_state(client: TestClient) -> None:
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
    client.post("/api/v1/remediation/sessions", json={"profile": profile})

    reset = client.post("/api/v1/demo/reset", json={"persona_id": "foundational-gap"})
    session = client.get("/api/v1/remediation/sessions/stu_reset_check")

    assert reset.status_code == 200
    assert session.status_code == 404

import json

import httpx
import pytest
from ailearn_remediation import RemediationState, Representation, SessionState

from ailearn_api.config import Settings
from ailearn_api.curriculum import ITEMS
from ailearn_api.diagnostic_session_store import new_session
from ailearn_api.durable_session_store import (
    RemediationSessionRecord,
    fetch_diagnostic_session,
    fetch_remediation_session,
    save_diagnostic_session,
    save_remediation_session,
)

SETTINGS = Settings(
    supabase_url="https://example.supabase.co",
    supabase_secret_key="test-secret",
)


@pytest.mark.anyio
async def test_diagnostic_session_round_trip_rehydrates_only_committed_items() -> None:
    session = new_session(
        "stu_resume_01",
        "lesson_g7_inverse_proportion_01",
        "skill_word_problem_work_rate",
        list(ITEMS.items.values())[:3],
    )
    saved: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            saved.update(json.loads(request.content))
            assert request.headers["Prefer"] == "return=minimal"
            return httpx.Response(201)
        assert request.method == "GET"
        return httpx.Response(200, json=[saved])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        await save_diagnostic_session(SETTINGS, session, client=client)
        restored = await fetch_diagnostic_session(
            SETTINGS,
            session.session_id,
            ITEMS.items,
            client=client,
        )

    assert restored is not None
    assert restored.session_id == session.session_id
    assert restored.item_order == session.item_order
    assert restored.answered_item_ids == set()


@pytest.mark.anyio
async def test_remediation_session_round_trip_preserves_state_and_idempotency() -> None:
    record = RemediationSessionRecord(
        session=SessionState(
            student_id="stu_resume_02",
            lesson_id="lesson_g7_inverse_proportion_01",
            target_skill_id="skill_word_problem_work_rate",
            current_state=RemediationState.REPAIR,
            representation=Representation.TEXT,
            root_cause_skill_id="skill_ratio_proportion_basics",
            step_index=1,
            representations_tried=[Representation.TEXT],
        ),
        processed_attempts={"att_1": {"current_step_kind": "guided_problem"}},
        processed_exit_tickets={"exit_1": {"outcome": {"kind": "transfer_passed"}}},
    )
    saved: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            saved.update(json.loads(request.content))
            assert request.headers["Prefer"] == "resolution=merge-duplicates,return=minimal"
            return httpx.Response(201)
        assert request.method == "GET"
        return httpx.Response(200, json=[saved])

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        await save_remediation_session(SETTINGS, record, client=client)
        restored = await fetch_remediation_session(SETTINGS, "stu_resume_02", client=client)

    assert restored is not None
    assert restored.session.current_state is RemediationState.REPAIR
    assert restored.session.step_index == 1
    assert restored.processed_attempts == record.processed_attempts
    assert restored.processed_exit_tickets == record.processed_exit_tickets

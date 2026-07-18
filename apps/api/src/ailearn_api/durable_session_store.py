"""Supabase-backed state for resumable diagnostic and remediation sessions."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx
from ailearn_diagnostic import AssessmentItem
from ailearn_remediation import RemediationState, Representation, SessionState

from ailearn_api.config import Settings
from ailearn_api.diagnostic_session_store import DiagnosticSessionState
from ailearn_api.supabase_client import SupabaseUnavailableError


@dataclass
class RemediationSessionRecord:
    session: SessionState
    processed_attempts: dict[str, dict[str, Any]]
    processed_exit_tickets: dict[str, dict[str, Any]]


def is_configured(settings: Settings) -> bool:
    return bool(settings.supabase_url and settings.supabase_secret_key)


def _headers(settings: Settings) -> dict[str, str]:
    assert settings.supabase_secret_key is not None
    return {
        "apikey": settings.supabase_secret_key,
        "Authorization": f"Bearer {settings.supabase_secret_key}",
        "Content-Type": "application/json",
    }


def _client(client: httpx.AsyncClient | None) -> tuple[httpx.AsyncClient, bool]:
    return (
        client or httpx.AsyncClient(timeout=5.0, follow_redirects=False),
        client is None,
    )


def _base_url(settings: Settings) -> str:
    if not is_configured(settings):
        raise SupabaseUnavailableError("Supabase is not configured")
    assert settings.supabase_url is not None
    return settings.supabase_url.rstrip("/")


async def save_diagnostic_session(
    settings: Settings,
    session: DiagnosticSessionState,
    client: httpx.AsyncClient | None = None,
) -> None:
    base_url = _base_url(settings)
    http_client, owns_client = _client(client)
    try:
        response = await http_client.post(
            f"{base_url}/rest/v1/diagnostic_sessions",
            headers={**_headers(settings), "Prefer": "return=minimal"},
            json={
                "id": session.session_id,
                "student_id": session.student_id,
                "lesson_id": session.lesson_id,
                "target_skill_id": session.target_skill_id,
                "item_ids": session.item_order,
            },
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise SupabaseUnavailableError("Diagnostic session storage failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_diagnostic_session(
    settings: Settings,
    session_id: str,
    items_by_id: Mapping[str, AssessmentItem],
    client: httpx.AsyncClient | None = None,
) -> DiagnosticSessionState | None:
    base_url = _base_url(settings)
    http_client, owns_client = _client(client)
    try:
        response = await http_client.get(
            f"{base_url}/rest/v1/diagnostic_sessions",
            headers=_headers(settings),
            params={
                "select": "id,student_id,lesson_id,target_skill_id,item_ids",
                "id": f"eq.{session_id}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Diagnostic session response is invalid")
        if not payload:
            return None
        if len(payload) != 1 or not isinstance(payload[0], Mapping):
            raise SupabaseUnavailableError("Diagnostic session response is invalid")
        row = payload[0]
        item_ids = row.get("item_ids")
        if not isinstance(item_ids, list) or not all(
            isinstance(item_id, str) for item_id in item_ids
        ):
            raise SupabaseUnavailableError("Diagnostic session item ids are invalid")
        try:
            items = {item_id: items_by_id[item_id] for item_id in item_ids}
        except KeyError as exc:
            raise SupabaseUnavailableError("Diagnostic session item is unavailable") from exc
        return DiagnosticSessionState(
            session_id=str(row["id"]),
            student_id=str(row["student_id"]),
            lesson_id=str(row["lesson_id"]),
            target_skill_id=str(row["target_skill_id"]),
            items=items,
            item_order=list(item_ids),
        )
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise SupabaseUnavailableError("Diagnostic session storage failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


def _state_to_row(session: SessionState) -> dict[str, Any]:
    return {
        "student_id": session.student_id,
        "lesson_id": session.lesson_id,
        "target_skill_id": session.target_skill_id,
        "current_state": session.current_state.value,
        "representation": session.representation.value,
        "root_cause_skill_id": session.root_cause_skill_id,
        "step_index": session.step_index,
        "consecutive_failures": session.consecutive_failures,
        "representations_tried": [item.value for item in session.representations_tried],
        "prerequisites_stepped_back": session.prerequisites_stepped_back,
        "transfer_outcome": session.transfer_outcome,
        "escalation_reason": session.escalation_reason,
    }


def _state_from_row(payload: Mapping[str, Any]) -> SessionState:
    representations = payload.get("representations_tried", [])
    prerequisites = payload.get("prerequisites_stepped_back", [])
    if not isinstance(representations, list) or not isinstance(prerequisites, list):
        raise ValueError("Remediation session collections are invalid")
    return SessionState(
        student_id=str(payload["student_id"]),
        lesson_id=str(payload["lesson_id"]),
        target_skill_id=str(payload["target_skill_id"]),
        current_state=RemediationState(str(payload["current_state"])),
        representation=Representation(str(payload["representation"])),
        root_cause_skill_id=payload.get("root_cause_skill_id"),
        step_index=int(payload.get("step_index", 0)),
        consecutive_failures=int(payload.get("consecutive_failures", 0)),
        representations_tried=[Representation(str(item)) for item in representations],
        prerequisites_stepped_back=[str(item) for item in prerequisites],
        transfer_outcome=payload.get("transfer_outcome"),
        escalation_reason=payload.get("escalation_reason"),
    )


def _result_map(value: object) -> dict[str, dict[str, Any]]:
    if not isinstance(value, Mapping):
        raise ValueError("Remediation idempotency data is invalid")
    result: dict[str, dict[str, Any]] = {}
    for key, item in value.items():
        if not isinstance(key, str) or not isinstance(item, Mapping):
            raise ValueError("Remediation idempotency data is invalid")
        result[key] = dict(item)
    return result


async def save_remediation_session(
    settings: Settings,
    record: RemediationSessionRecord,
    client: httpx.AsyncClient | None = None,
) -> None:
    base_url = _base_url(settings)
    http_client, owns_client = _client(client)
    try:
        response = await http_client.post(
            f"{base_url}/rest/v1/remediation_sessions",
            headers={
                **_headers(settings),
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            json={
                "student_id": record.session.student_id,
                "state": _state_to_row(record.session),
                "processed_attempts": record.processed_attempts,
                "processed_exit_tickets": record.processed_exit_tickets,
                "updated_at": datetime.now(UTC).isoformat(),
            },
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise SupabaseUnavailableError("Remediation session storage failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()


async def fetch_remediation_session(
    settings: Settings,
    student_id: str,
    client: httpx.AsyncClient | None = None,
) -> RemediationSessionRecord | None:
    base_url = _base_url(settings)
    http_client, owns_client = _client(client)
    try:
        response = await http_client.get(
            f"{base_url}/rest/v1/remediation_sessions",
            headers=_headers(settings),
            params={
                "select": "student_id,state,processed_attempts,processed_exit_tickets",
                "student_id": f"eq.{student_id}",
                "limit": "1",
            },
        )
        response.raise_for_status()
        payload: Any = response.json()
        if not isinstance(payload, list):
            raise SupabaseUnavailableError("Remediation session response is invalid")
        if not payload:
            return None
        if len(payload) != 1 or not isinstance(payload[0], Mapping):
            raise SupabaseUnavailableError("Remediation session response is invalid")
        row = payload[0]
        state = row.get("state")
        if not isinstance(state, Mapping):
            raise SupabaseUnavailableError("Remediation session state is invalid")
        return RemediationSessionRecord(
            session=_state_from_row(state),
            processed_attempts=_result_map(row.get("processed_attempts", {})),
            processed_exit_tickets=_result_map(row.get("processed_exit_tickets", {})),
        )
    except (httpx.HTTPError, ValueError, KeyError) as exc:
        raise SupabaseUnavailableError("Remediation session storage failed") from exc
    finally:
        if owns_client:
            await http_client.aclose()

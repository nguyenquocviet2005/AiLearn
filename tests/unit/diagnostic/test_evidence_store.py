from __future__ import annotations

import json
from pathlib import Path

import pytest
from ailearn_diagnostic import (
    InMemoryEvidenceStore,
    to_persistence_row,
    validate_evidence_event,
)
from pydantic import ValidationError

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE_PATH = REPO_ROOT / "data" / "fixtures" / "evidence-event.json"


def test_validate_evidence_event_fixture() -> None:
    payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    event = validate_evidence_event(payload)
    assert event.id == "ev_demo_001"


def test_in_memory_store_round_trip() -> None:
    payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    store = InMemoryEvidenceStore()
    saved = store.save_payload(payload)
    loaded = store.get(saved.id)
    assert loaded is not None
    assert loaded == saved


def test_to_persistence_row_includes_required_columns() -> None:
    payload = json.loads(FIXTURE_PATH.read_text(encoding="utf-8"))
    event = validate_evidence_event(payload)
    row = to_persistence_row(event)
    assert row["id"] == "ev_demo_001"
    assert row["schema_version"] == "1"
    assert row["is_correct"] is False
    assert "recorded_at" in row


def test_invalid_payload_rejected() -> None:
    store = InMemoryEvidenceStore()
    with pytest.raises(ValidationError):
        store.save_payload({"schema_version": "1", "id": "ev_bad"})

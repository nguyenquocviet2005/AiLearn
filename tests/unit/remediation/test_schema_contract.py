"""Contract tests: serialized output must satisfy StudentImprovementPathV1.

Validates against the real schema file so a drift in ai/remediation is caught here
rather than at integration time (VAI-20).
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from ailearn_remediation import (
    AttemptOutcome,
    DiagnosticProfile,
    Policy,
    ReadinessStatus,
    RemediationEngine,
    RemediationState,
    Representation,
    RootCause,
    StepKind,
)

TS = "2026-07-18T05:00:00Z"
REPO_ROOT = Path(__file__).resolve().parents[3]
SCHEMA_PATH = REPO_ROOT / "packages" / "schemas" / "json" / "improvement-path.v1.schema.json"

POLICY = Policy(
    default_fallback=(Representation.TEXT, Representation.TABLE, Representation.DIAGRAM),
    fallback_by_misconception={},
    max_consecutive_failures=3,
)


@pytest.fixture
def engine() -> RemediationEngine:
    return RemediationEngine(policy=POLICY, prerequisites={}, skill_misconceptions={})


@pytest.fixture
def schema() -> dict:
    with SCHEMA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture
def profile() -> DiagnosticProfile:
    return DiagnosticProfile(
        student_id="stu_g7_001",
        lesson_id="lesson_g7_inverse_proportion_01",
        target_skill_id="skill_word_problem_work_rate",
        readiness_status=ReadinessStatus.NEEDS_SUPPORT,
        confidence=0.9,
        root_causes=(RootCause("skill_distinguish_direct_inverse", 1, ("ev_1",), ()),),
    )


def test_path_validates_against_real_schema(engine, profile, schema):
    jsonschema = pytest.importorskip("jsonschema")
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    jsonschema.validate(instance=path, schema=schema)


def test_every_state_value_is_in_schema_enum(schema):
    allowed = set(schema["properties"]["current_state"]["enum"])
    assert {s.value for s in RemediationState} == allowed


def test_every_step_kind_is_in_schema_enum(schema):
    allowed = set(schema["properties"]["steps"]["items"]["properties"]["kind"]["enum"])
    assert {k.value for k in StepKind} == allowed


def test_every_representation_is_in_schema_enum(schema):
    allowed = set(schema["properties"]["representation"]["enum"])
    assert {r.value for r in Representation} == allowed


def test_path_has_no_additional_properties(engine, profile, schema):
    """Schema sets additionalProperties=false; emitting an extra key breaks it."""
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    assert set(path).issubset(set(schema["properties"]))


def test_step_has_exactly_the_required_keys(engine, profile, schema):
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    expected = set(schema["properties"]["steps"]["items"]["required"])
    for step in path["steps"]:
        assert set(step) == expected


def test_required_fields_present(engine, profile, schema):
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    for field in schema["required"]:
        assert field in path


def test_schema_version_is_string_one(engine, profile):
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    assert path["schema_version"] == "1"


def test_completed_flags_track_progress(engine, profile):
    session = engine.start(profile)
    path = engine.to_path(session, TS).to_dict()
    assert [s["completed"] for s in path["steps"]] == [False] * 5

    session = engine.advance(session, AttemptOutcome("s1", True, TS))
    path = engine.to_path(session, TS).to_dict()
    assert path["steps"][0]["completed"] is True
    assert path["steps"][1]["completed"] is False


def test_abstained_path_serializes_as_confirmation(engine, schema):
    jsonschema = pytest.importorskip("jsonschema")
    abstained = DiagnosticProfile(
        student_id="stu_golden_04",
        lesson_id="lesson_g7_inverse_proportion_01",
        target_skill_id="skill_word_problem_work_rate",
        readiness_status=ReadinessStatus.ABSTAINED,
        confidence=0.31,
        root_causes=(RootCause("skill_solve_unknown_value", 1, ("ev_1",), ("ev_2",)),),
    )
    session = engine.start(abstained)
    path = engine.to_path(session, TS).to_dict()
    jsonschema.validate(instance=path, schema=schema)
    assert path["current_state"] == "CONFIRMATION"

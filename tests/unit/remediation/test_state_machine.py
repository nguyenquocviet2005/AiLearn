"""Unit tests for the remediation state machine.

Each test maps to one VAI-16 acceptance criterion.
"""

from __future__ import annotations

import pytest

from ailearn_remediation import (
    SEQUENCE,
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

# Deterministic test policy (does not read seed files).
POLICY = Policy(
    default_fallback=(Representation.TEXT, Representation.TABLE, Representation.DIAGRAM),
    fallback_by_misconception={
        "mis_direct_inverse_confusion": (
            Representation.TABLE,
            Representation.DIAGRAM,
            Representation.TEXT,
        )
    },
    max_consecutive_failures=3,
)
PREREQS = {
    "skill_distinguish_direct_inverse": ("skill_direct_proportion",),
    "skill_direct_proportion": ("skill_ratio_proportion_basics",),
    "skill_ratio_proportion_basics": (),
}
SKILL_MIS = {"skill_distinguish_direct_inverse": "mis_direct_inverse_confusion"}


@pytest.fixture
def engine() -> RemediationEngine:
    return RemediationEngine(
        policy=POLICY, prerequisites=PREREQS, skill_misconceptions=SKILL_MIS
    )


def _profile(status: ReadinessStatus, with_cause: bool = True) -> DiagnosticProfile:
    return DiagnosticProfile(
        student_id="stu_test_01",
        lesson_id="lesson_g7_inverse_proportion_01",
        target_skill_id="skill_word_problem_work_rate",
        readiness_status=status,
        confidence=0.31 if status is ReadinessStatus.ABSTAINED else 0.9,
        root_causes=(
            (RootCause("skill_distinguish_direct_inverse", 1, ("ev_1",), ("ev_2",)),)
            if with_cause
            else ()
        ),
    )


def _fail(engine: RemediationEngine, session, times: int = 1):
    for i in range(times):
        session = engine.advance(session, AttemptOutcome(f"step_{i}", False, TS))
    return session


# --------------------------------------------------------------- AC1


def test_ac1_abstained_profile_enters_confirmation_not_repair(engine):
    """AC1: insufficient evidence enters CONFIRMATION, not forced repair."""
    session = engine.start(_profile(ReadinessStatus.ABSTAINED))
    assert session.current_state is RemediationState.CONFIRMATION


def test_ac1_confirmation_holds_while_evidence_insufficient(engine):
    """AC1: staying insufficient must NOT push the student into REPAIR."""
    session = engine.start(_profile(ReadinessStatus.ABSTAINED))
    session = engine.confirm(session, evidence_sufficient=False)
    assert session.current_state is RemediationState.CONFIRMATION


def test_ac1_advance_is_inert_while_in_confirmation(engine):
    """A wrong answer during CONFIRMATION must not trigger repair either."""
    session = engine.start(_profile(ReadinessStatus.ABSTAINED))
    session = engine.advance(session, AttemptOutcome("s1", False, TS))
    assert session.current_state is RemediationState.CONFIRMATION


# --------------------------------------------------------------- AC2


def test_ac2_diagnosed_prerequisite_gap_enters_repair(engine):
    """AC2: a diagnosed prerequisite gap enters REPAIR."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    assert session.current_state is RemediationState.REPAIR
    assert session.root_cause_skill_id == "skill_distinguish_direct_inverse"


def test_ac2_needs_support_without_root_cause_confirms_first(engine):
    """No identified cause -> confirm rather than guess a repair target."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT, with_cause=False))
    assert session.current_state is RemediationState.CONFIRMATION


def test_ac2_confirmation_resolves_to_repair_when_evidence_arrives(engine):
    session = engine.start(_profile(ReadinessStatus.ABSTAINED))
    session = engine.confirm(session, evidence_sufficient=True)
    assert session.current_state is RemediationState.REPAIR


# --------------------------------------------------------------- AC3


def test_ac3_failure_changes_representation(engine):
    """AC3: continued failure changes representation."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    first = session.representation
    session = _fail(engine, session)
    assert session.representation != first
    assert len(session.representations_tried) == 2


def test_ac3_representation_follows_misconception_specific_order(engine):
    """Order comes from seed policy, not a hard-coded default."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    # mis_direct_inverse_confusion -> (table, diagram, text)
    assert session.representation is Representation.TABLE
    session = _fail(engine, session)
    assert session.representation is Representation.DIAGRAM
    session = _fail(engine, session)
    assert session.representation is Representation.TEXT


def test_ac3_steps_back_to_prerequisite_after_all_representations(engine):
    """AC3: once representations are exhausted, step back to a prerequisite.

    start() already claims the first representation (table), so 2 failures
    exhaust the remaining two (diagram, text) and the 3rd steps back.
    """
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    session = _fail(engine, session, times=2)  # -> diagram, -> text
    assert len(session.representations_tried) == 3
    assert session.root_cause_skill_id == "skill_distinguish_direct_inverse"

    session = _fail(engine, session)  # nothing left -> step back
    assert session.root_cause_skill_id == "skill_direct_proportion"
    assert session.prerequisites_stepped_back == ["skill_direct_proportion"]
    assert session.current_state is RemediationState.REPAIR


def test_ac3_representation_pool_resets_after_step_back(engine):
    """After stepping back, representations are retried for the new skill."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    session = _fail(engine, session, times=3)  # exhaust, then step back
    assert len(session.representations_tried) == 1


# --------------------------------------------------------------- AC4


def test_ac4_one_correct_answer_does_not_complete_repair(engine):
    """AC4: immediate correctness is NOT treated as complete repair."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    assert session.current_state is RemediationState.REPAIR
    session = engine.advance(session, AttemptOutcome("s1", True, TS))
    # worked_example -> guided_problem: still REPAIR, still not complete.
    assert session.current_state is RemediationState.REPAIR
    assert not engine.is_complete(session)


def test_ac4_full_sequence_required_before_completion(engine):
    """The student must walk worked -> guided -> independent -> transfer -> result."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    states = [session.current_state]
    for i in range(4):
        session = engine.advance(session, AttemptOutcome(f"s{i}", True, TS))
        states.append(session.current_state)
    assert states == [
        RemediationState.REPAIR,  # worked_example
        RemediationState.REPAIR,  # guided_problem
        RemediationState.PRACTICE,  # independent_problem
        RemediationState.TRANSFER,  # near_transfer
        RemediationState.TRANSFER,  # result
    ]
    assert engine.is_complete(session)


def test_ac4_sequence_order_matches_pedagogical_spec():
    assert SEQUENCE == (
        StepKind.WORKED_EXAMPLE,
        StepKind.GUIDED_PROBLEM,
        StepKind.INDEPENDENT_PROBLEM,
        StepKind.NEAR_TRANSFER,
        StepKind.RESULT,
    )


# --------------------------------------------------------------- AC5


def test_ac5_near_transfer_success_is_recorded(engine):
    """AC5: at least one near-transfer outcome is recorded."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    assert session.transfer_outcome is None
    for i in range(4):
        session = engine.advance(session, AttemptOutcome(f"s{i}", True, TS))
    assert session.transfer_outcome is True


def test_ac5_near_transfer_failure_is_also_recorded(engine):
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    for i in range(3):
        session = engine.advance(session, AttemptOutcome(f"s{i}", True, TS))
    assert engine.current_step_kind(session) is StepKind.NEAR_TRANSFER
    session = engine.advance(session, AttemptOutcome("s_transfer", False, TS))
    assert session.transfer_outcome is False


# --------------------------------------------------------------- AC6


def test_ac6_repeated_failure_produces_teacher_escalation(engine):
    """AC6: repeated failure produces teacher escalation."""
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    # 3 representations + 2 prerequisite step-backs, then failures keep coming.
    for _ in range(20):
        session = _fail(engine, session)
        if session.current_state is RemediationState.TEACHER_ESCALATION:
            break
    assert session.current_state is RemediationState.TEACHER_ESCALATION
    assert session.escalation_reason == "esc_repeated_failure"


def test_ac6_abstained_profile_can_be_escalated_explicitly(engine):
    """esc_abstained_profile: evidence never becomes sufficient."""
    session = engine.start(_profile(ReadinessStatus.ABSTAINED))
    session = engine.escalate(session, "esc_abstained_profile")
    assert session.current_state is RemediationState.TEACHER_ESCALATION
    assert session.escalation_reason == "esc_abstained_profile"


def test_ac6_escalation_is_terminal(engine):
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    session = engine.escalate(session, "esc_repeated_failure")
    session = engine.advance(session, AttemptOutcome("s1", True, TS))
    assert session.current_state is RemediationState.TEACHER_ESCALATION


# --------------------------------------------------------------- AC7 / determinism


def test_ac7_engine_has_no_llm_dependency(engine):
    """AC7: the flow works when the LLM API is unavailable.

    packages/remediation never imports or calls an LLM; a full run needs no network.
    """
    session = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
    for i in range(4):
        session = engine.advance(session, AttemptOutcome(f"s{i}", True, TS))
    assert engine.is_complete(session)


def test_engine_is_deterministic(engine):
    """Same inputs -> same outputs, every time."""
    runs = []
    for _ in range(3):
        s = engine.start(_profile(ReadinessStatus.NEEDS_SUPPORT))
        s = _fail(engine, s, times=2)
        s = engine.advance(s, AttemptOutcome("x", True, TS))
        runs.append((s.current_state, s.representation, s.step_index))
    assert runs[0] == runs[1] == runs[2]

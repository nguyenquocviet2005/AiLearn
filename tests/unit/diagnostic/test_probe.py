from __future__ import annotations

from datetime import UTC, datetime

from ailearn_diagnostic import diagnose, select_probe_item
from ailearn_diagnostic.loaders import load_curriculum, load_items
from ailearn_schemas import EvidenceEventV1

CURRICULUM = load_curriculum()
ITEMS = load_items()
RECORDED_AT = datetime(2026, 7, 18, 1, 0, tzinfo=UTC)


def _event(
    event_id: str,
    skill_id: str,
    item_id: str,
    *,
    is_correct: bool,
    response_label: str,
    confidence: float | None = None,
) -> EvidenceEventV1:
    return EvidenceEventV1(
        schema_version="1",
        id=event_id,
        student_id="stu_probe",
        session_id="sess_probe_readiness",
        skill_id=skill_id,
        item_id=item_id,
        is_correct=is_correct,
        recorded_at=RECORDED_AT,
        lesson_id=CURRICULUM.lesson_id,
        response_label=response_label,
        confidence=confidence,
    )


def _mixed_evidence() -> list[EvidenceEventV1]:
    """Five events with a misconception-flavoured error pattern."""
    return [
        _event("e1", "skill_ratio_proportion_basics", "item_inv_prop_01", is_correct=True, response_label="9"),
        _event("e2", "skill_fraction_multiplication", "item_inv_prop_02", is_correct=True, response_label="2/3"),
        _event("e3", "skill_direct_proportion", "item_inv_prop_03", is_correct=True, response_label="12"),
        _event(
            "e4",
            "skill_inverse_proportion_definition",
            "item_inv_prop_04",
            is_correct=False,
            response_label="y = kx (k ≠ 0)",
            confidence=0.9,
        ),
        _event(
            "e5",
            "skill_inverse_proportion_definition",
            "item_inv_prop_05",
            is_correct=False,
            response_label="Tăng lên",
            confidence=0.9,
        ),
    ]


def test_probe_never_repeats_an_answered_item() -> None:
    events = _mixed_evidence()
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)

    selection = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert selection is not None
    answered = {event.item_id for event in events}
    assert selection.item.item_id not in answered


def test_probe_targets_primary_hypothesis_with_reasons() -> None:
    events = _mixed_evidence()
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)
    assert profile.root_causes, "scenario must produce a hypothesis"
    primary = profile.root_causes[0].skill_id

    selection = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert selection is not None
    assert primary in selection.focus_skill_ids
    assert "targets_primary_hypothesis" in selection.reason_codes
    assert primary in selection.item.skill_ids


def test_probe_isolates_competing_hypotheses() -> None:
    """Two hypotheses share a misconception; the probe should test exactly one."""
    events = _mixed_evidence()
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)
    assert len(profile.root_causes) >= 2

    selection = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert selection is not None
    assert "isolates_competing_hypothesis" in selection.reason_codes
    top_two = {row.skill_id for row in profile.root_causes[:2]}
    assert len(set(selection.item.skill_ids) & top_two) == 1


def test_probe_follows_high_confidence_errors() -> None:
    """A confident wrong answer on the probed skill is flagged as miscalibration."""
    events = [
        _event("e1", "skill_ratio_proportion_basics", "item_inv_prop_01", is_correct=True, response_label="9"),
        _event("e2", "skill_fraction_multiplication", "item_inv_prop_02", is_correct=True, response_label="2/3"),
        _event("e3", "skill_direct_proportion", "item_inv_prop_03", is_correct=True, response_label="12"),
        _event(
            "e4",
            "skill_find_constant_k",
            "item_inv_prop_06",
            is_correct=False,
            response_label="10",  # mis_computation_error
            confidence=0.3,
        ),
        _event(
            "e5",
            "skill_inverse_proportion_definition",
            "item_inv_prop_04",
            is_correct=False,
            response_label="x + y = k",  # mis_direct_inverse_confusion
            confidence=0.9,
        ),
    ]
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)
    assert profile.root_causes[0].skill_id == "skill_inverse_proportion_definition"

    selection = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert selection is not None
    assert "targets_primary_hypothesis" in selection.reason_codes
    assert "follows_high_confidence_error" in selection.reason_codes
    assert "skill_inverse_proportion_definition" in selection.item.skill_ids


def test_probe_is_deterministic() -> None:
    events = _mixed_evidence()
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)

    first = select_probe_item(events, CURRICULUM, ITEMS, profile)
    second = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert first is not None and second is not None
    assert first.item.item_id == second.item.item_id
    assert first.reason_codes == second.reason_codes


def test_probe_returns_none_when_every_item_is_answered() -> None:
    events = []
    for index, item in enumerate(sorted(ITEMS.items.values(), key=lambda i: i.item_id)):
        correct = next(option for option in item.options if option.is_correct)
        events.append(
            _event(
                f"e{index}",
                item.skill_ids[0],
                item.item_id,
                is_correct=True,
                response_label=correct.label,
            )
        )
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)

    assert select_probe_item(events, CURRICULUM, ITEMS, profile) is None


def test_probe_verifies_readiness_for_ready_profiles() -> None:
    # All-correct evidence on foundational skills -> ready profile.
    events = [
        _event("e1", "skill_ratio_proportion_basics", "item_inv_prop_01", is_correct=True, response_label="9"),
        _event("e2", "skill_fraction_multiplication", "item_inv_prop_02", is_correct=True, response_label="2/3"),
        _event("e3", "skill_direct_proportion", "item_inv_prop_03", is_correct=True, response_label="12"),
        _event("e4", "skill_inverse_proportion_definition", "item_inv_prop_04", is_correct=True, response_label="x · y = k (k ≠ 0)"),
        _event("e5", "skill_inverse_proportion_definition", "item_inv_prop_05", is_correct=True, response_label="Giảm xuống"),
    ]
    profile = diagnose(events, CURRICULUM, ITEMS, now=RECORDED_AT)
    assert profile.readiness_status == "ready"

    selection = select_probe_item(events, CURRICULUM, ITEMS, profile)

    assert selection is not None
    assert "verifies_target_readiness" in selection.reason_codes

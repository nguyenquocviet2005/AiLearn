from __future__ import annotations

from datetime import UTC, datetime

from ailearn_diagnostic.loaders import load_curriculum, load_items
from ailearn_diagnostic.probe import (
    COVERS_UNOBSERVED_SKILL,
    ISOLATES_COMPETING_HYPOTHESIS,
    TARGETS_PRIMARY_HYPOTHESIS,
    select_probe_item,
)
from ailearn_schemas import EvidenceEventV1

RECORDED_AT = datetime(2026, 7, 19, 1, 0, tzinfo=UTC)


def _event(
    event_id: str,
    skill_id: str,
    item_id: str,
    *,
    is_correct: bool,
    response_label: str,
    lesson_id: str,
) -> EvidenceEventV1:
    return EvidenceEventV1(
        schema_version="1",
        id=event_id,
        student_id="stu_probe",
        session_id="sess_probe",
        skill_id=skill_id,
        item_id=item_id,
        is_correct=is_correct,
        recorded_at=RECORDED_AT,
        lesson_id=lesson_id,
        response_label=response_label,
    )


def test_probe_targets_primary_hypothesis_when_skill_has_unanswered_item() -> None:
    curriculum = load_curriculum()
    items = load_items()
    events = [
        _event(
            "e1",
            "skill_inverse_proportion_definition",
            "item_inv_prop_04",
            is_correct=False,
            response_label="y = kx (k ≠ 0)",
            lesson_id=curriculum.lesson_id,
        ),
    ]

    selection = select_probe_item(events, curriculum, items)

    assert selection is not None
    assert selection.reason == TARGETS_PRIMARY_HYPOTHESIS
    assert selection.target_skill_id == "skill_inverse_proportion_definition"
    assert selection.item.item_id == "item_inv_prop_05"


def test_probe_isolates_competing_hypothesis_when_primary_skill_exhausted() -> None:
    curriculum = load_curriculum()
    items = load_items()
    events = [
        _event(
            "e1",
            "skill_inverse_proportion_definition",
            "item_inv_prop_04",
            is_correct=False,
            response_label="y = kx (k ≠ 0)",
            lesson_id=curriculum.lesson_id,
        ),
        _event(
            "e2",
            "skill_inverse_proportion_definition",
            "item_inv_prop_05",
            is_correct=False,
            response_label="Tăng lên",
            lesson_id=curriculum.lesson_id,
        ),
    ]

    selection = select_probe_item(events, curriculum, items)

    assert selection is not None
    # Both items for the primary skill are already answered, so the engine falls
    # back to an item whose wrong-answer option maps to the same misconception.
    assert selection.reason == ISOLATES_COMPETING_HYPOTHESIS
    assert selection.item.item_id == "item_inv_prop_03"


def test_probe_covers_unobserved_skill_when_no_incorrect_evidence_yet() -> None:
    curriculum = load_curriculum()
    items = load_items()

    selection = select_probe_item([], curriculum, items)

    assert selection is not None
    assert selection.target_skill_id is None
    assert selection.reason == COVERS_UNOBSERVED_SKILL
    assert selection.item.item_id == "item_inv_prop_01"


def test_probe_returns_none_when_all_items_answered() -> None:
    curriculum = load_curriculum()
    items = load_items()
    events = [
        _event(
            f"e{index}",
            item.skill_ids[0],
            item.item_id,
            is_correct=True,
            response_label=next(
                option.label for option in item.options if option.is_correct
            ),
            lesson_id=curriculum.lesson_id,
        )
        for index, item in enumerate(items.items.values())
    ]

    assert select_probe_item(events, curriculum, items) is None


def test_probe_selection_is_deterministic_across_repeated_calls() -> None:
    curriculum = load_curriculum()
    items = load_items()
    events = [
        _event(
            "e1",
            "skill_distinguish_direct_inverse",
            "item_inv_prop_12",
            is_correct=False,
            response_label="Số sản phẩm và tổng tiền phải trả (giá cố định)",
            lesson_id=curriculum.lesson_id,
        ),
    ]

    first = select_probe_item(events, curriculum, items)
    second = select_probe_item(events, curriculum, items)

    assert first is not None and second is not None
    assert first.item.item_id == second.item.item_id
    assert first.reason == second.reason

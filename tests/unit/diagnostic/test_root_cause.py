from __future__ import annotations

from datetime import UTC, datetime

from ailearn_diagnostic.loaders import load_curriculum, load_items
from ailearn_diagnostic.mastery import BetaBernoulliMasteryEstimator
from ailearn_diagnostic.root_cause import DeterministicRootCauseRanker
from ailearn_schemas import EvidenceEventV1


def test_ranker_prefers_dominant_misconception_skills() -> None:
    curriculum = load_curriculum()
    items = load_items()
    recorded_at = datetime(2026, 7, 18, 1, 0, tzinfo=UTC)
    events = [
        EvidenceEventV1(
            schema_version="1",
            id="e1",
            student_id="stu",
            session_id="sess",
            skill_id="skill_distinguish_direct_inverse",
            item_id="item_inv_prop_12",
            is_correct=False,
            recorded_at=recorded_at,
            lesson_id=curriculum.lesson_id,
            response_label="Số sản phẩm và tổng tiền phải trả (giá cố định)",
        ),
        EvidenceEventV1(
            schema_version="1",
            id="e2",
            student_id="stu",
            session_id="sess",
            skill_id="skill_inverse_proportion_definition",
            item_id="item_inv_prop_04",
            is_correct=False,
            recorded_at=recorded_at,
            lesson_id=curriculum.lesson_id,
            response_label="y = kx (k ≠ 0)",
        ),
        EvidenceEventV1(
            schema_version="1",
            id="e3",
            student_id="stu",
            session_id="sess",
            skill_id="skill_inverse_proportion_definition",
            item_id="item_inv_prop_05",
            is_correct=False,
            recorded_at=recorded_at,
            lesson_id=curriculum.lesson_id,
            response_label="Tăng lên",
        ),
    ]

    mastery = BetaBernoulliMasteryEstimator().update(events)
    ranked = DeterministicRootCauseRanker().rank(events, curriculum, items, mastery)
    assert [row.skill_id for row in ranked][:2] == [
        "skill_distinguish_direct_inverse",
        "skill_inverse_proportion_definition",
    ]
    event_ids = {event.id for event in events}
    for row in ranked:
        assert row.supporting_evidence_ids
        assert set(row.supporting_evidence_ids) <= event_ids
        assert set(row.contradicting_evidence_ids) <= event_ids

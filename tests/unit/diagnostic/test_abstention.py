from __future__ import annotations

from datetime import UTC, datetime

from ailearn_diagnostic.abstention import AbstentionPolicy
from ailearn_diagnostic.loaders import load_curriculum, load_items
from ailearn_diagnostic.root_cause import DeterministicRootCauseRanker, RankedSkill
from ailearn_schemas import EvidenceEventV1


def test_abstain_when_fewer_than_five_events() -> None:
    curriculum = load_curriculum()
    items = load_items()
    events = [
        EvidenceEventV1(
            schema_version="1",
            id="e1",
            student_id="stu",
            session_id="sess",
            skill_id="skill_solve_unknown_value",
            item_id="item_inv_prop_08",
            is_correct=False,
            recorded_at=datetime(2026, 7, 18, tzinfo=UTC),
            lesson_id=curriculum.lesson_id,
            response_label="192",
        ),
        EvidenceEventV1(
            schema_version="1",
            id="e2",
            student_id="stu",
            session_id="sess",
            skill_id="skill_multistep_reasoning",
            item_id="item_inv_prop_20",
            is_correct=True,
            recorded_at=datetime(2026, 7, 18, tzinfo=UTC),
            lesson_id=curriculum.lesson_id,
            response_label="225 công nhân",
        ),
        EvidenceEventV1(
            schema_version="1",
            id="e3",
            student_id="stu",
            session_id="sess",
            skill_id="skill_inverse_proportion_definition",
            item_id="item_inv_prop_04",
            is_correct=False,
            recorded_at=datetime(2026, 7, 18, tzinfo=UTC),
            lesson_id=curriculum.lesson_id,
            response_label="x − y = k",
        ),
    ]
    policy = AbstentionPolicy()
    assert policy.insufficient_input(events, items) is True
    ranked = DeterministicRootCauseRanker().rank_for_abstention(
        events, curriculum, items
    )
    assert ranked[0].skill_id == "skill_solve_unknown_value"
    assert "e1" in ranked[0].supporting_evidence_ids
    assert "e2" in ranked[0].contradicting_evidence_ids


def test_conflicting_top_skill_triggers_abstention_signal() -> None:
    policy = AbstentionPolicy()
    ranked = [
        RankedSkill(
            skill_id="skill_a",
            supporting_evidence_ids=("s1",),
            contradicting_evidence_ids=("c1",),
        )
    ]
    assert policy.conflicting_top_skill(ranked) is True


def test_all_correct_evidence_is_not_treated_as_conflicting() -> None:
    """Empty ranking = no wrong answers; the engine must reach its ready branch."""
    policy = AbstentionPolicy()
    assert policy.conflicting_top_skill([]) is False

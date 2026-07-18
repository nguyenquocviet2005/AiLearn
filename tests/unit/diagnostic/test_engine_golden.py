from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

from ailearn_diagnostic import diagnose, load_curriculum, load_golden_suite, load_items
from ailearn_schemas import EvidenceEventV1

FIXED_NOW = datetime(2026, 7, 19, 15, 30, tzinfo=UTC)


def test_loaders_resolve_seed_and_golden_paths() -> None:
    curriculum = load_curriculum()
    items = load_items()
    suite = load_golden_suite()
    assert curriculum.lesson_id.startswith("lesson_")
    assert len(items.items) >= 12
    assert len(suite.cases) == 4
    assert (Path("data/seeds/curriculum.json")).exists()


def test_golden_cases_diagnose_expected_patterns() -> None:
    curriculum = load_curriculum()
    items = load_items()
    suite = load_golden_suite()

    results = {}
    for case in suite.cases:
        events = [EvidenceEventV1.model_validate(raw) for raw in case.events]
        profile = diagnose(events, curriculum, items, now=FIXED_NOW)
        results[case.golden_case_id] = profile

        expected = case.expected_profile
        assert profile.readiness_status == expected["readiness_status"]
        expected_skills = [row["skill_id"] for row in expected["root_causes"]]
        got_skills = [row.skill_id for row in profile.root_causes]
        assert got_skills[: len(expected_skills)] == expected_skills

        event_ids = {event.id for event in events}
        for row in profile.root_causes:
            assert set(row.supporting_evidence_ids) <= event_ids
            assert set(row.contradicting_evidence_ids) <= event_ids

    assert results["gc_01_foundational_gap"].readiness_status == "needs_support"
    assert (
        results["gc_02_direct_inverse_misconception"].readiness_status
        == "needs_support"
    )
    assert results["gc_03_language_representation"].readiness_status == "needs_support"
    assert results["gc_04_insufficient_evidence"].readiness_status == "abstained"


def test_diagnose_is_deterministic() -> None:
    curriculum = load_curriculum()
    items = load_items()
    suite = load_golden_suite()
    case = next(
        case
        for case in suite.cases
        if case.golden_case_id == "gc_02_direct_inverse_misconception"
    )
    events = [EvidenceEventV1.model_validate(raw) for raw in case.events]
    first = diagnose(events, curriculum, items, now=FIXED_NOW)
    second = diagnose(events, curriculum, items, now=FIXED_NOW)
    assert first.model_dump() == second.model_dump()


def test_diagnostic_package_has_no_llm_imports() -> None:
    package_root = Path("packages/diagnostic/src/ailearn_diagnostic")
    forbidden = ("openai", "anthropic", "langchain", "litellm", "transformers")
    for path in package_root.rglob("*.py"):
        text = path.read_text(encoding="utf-8")
        lowered = text.lower()
        for token in forbidden:
            assert token not in lowered, f"{path} mentions {token}"

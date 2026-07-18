#!/usr/bin/env python3
"""One-command golden-case evaluation for the deterministic diagnostic engine.

Runs every case in eval/golden/golden-cases.json through ailearn_diagnostic.diagnose()
and checks the result against each case's expected_profile: readiness_status, the
ordered root-cause skill ids, and evidence traceability (mirrors the assertions in
tests/unit/diagnostic/test_engine_golden.py).

Usage:
    uv run --project apps/api python scripts/eval_golden.py
"""

from __future__ import annotations

import sys
from dataclasses import dataclass

from ailearn_diagnostic import (
    Curriculum,
    GoldenCase,
    ItemIndex,
    diagnose,
    load_curriculum,
    load_golden_suite,
    load_items,
)
from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1


@dataclass
class CaseResult:
    case: GoldenCase
    profile: StudentDiagnosticProfileV1
    failures: list[str]

    @property
    def passed(self) -> bool:
        return not self.failures


def _evaluate_case(
    case: GoldenCase, curriculum: Curriculum, items: ItemIndex
) -> CaseResult:
    events = [EvidenceEventV1.model_validate(raw) for raw in case.events]
    profile = diagnose(events, curriculum, items)

    failures: list[str] = []
    expected = case.expected_profile

    if profile.readiness_status != expected["readiness_status"]:
        failures.append(
            f"readiness_status: expected {expected['readiness_status']!r}, "
            f"got {profile.readiness_status!r}"
        )

    expected_skills = [row["skill_id"] for row in expected["root_causes"]]
    got_skills = [row.skill_id for row in profile.root_causes]
    if got_skills[: len(expected_skills)] != expected_skills:
        failures.append(
            f"root_causes order: expected {expected_skills!r}, "
            f"got {got_skills[: len(expected_skills)]!r}"
        )

    event_ids = {event.id for event in events}
    for row in profile.root_causes:
        if not set(row.supporting_evidence_ids) <= event_ids:
            failures.append(
                f"{row.skill_id}: supporting_evidence_ids not traceable to events"
            )
        if not set(row.contradicting_evidence_ids) <= event_ids:
            failures.append(
                f"{row.skill_id}: contradicting_evidence_ids not traceable to events"
            )

    return CaseResult(case=case, profile=profile, failures=failures)


def main() -> int:
    curriculum = load_curriculum()
    items = load_items()
    suite = load_golden_suite()

    print(
        f"Evaluating {len(suite.cases)} golden case(s) for lesson '{curriculum.lesson_id}'...\n"
    )

    results = [_evaluate_case(case, curriculum, items) for case in suite.cases]

    for result in results:
        label = "PASS" if result.passed else "FAIL"
        print(f"[{label}] {result.case.golden_case_id} — {result.case.scenario}")
        print(
            f"       readiness_status={result.profile.readiness_status} "
            f"confidence={result.profile.confidence}"
        )
        for failure in result.failures:
            print(f"       - {failure}")

    print()
    any_failed = any(not result.passed for result in results)
    any_abstained = any(
        result.profile.readiness_status == "abstained" for result in results
    )

    if any_failed:
        print("RESULT: FAIL")
        return 1
    if not any_abstained:
        print("RESULT: FAIL (no golden case produced an abstention outcome)")
        return 1

    print(
        f"RESULT: PASS ({len(results)}/{len(results)} cases, including an abstention case)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

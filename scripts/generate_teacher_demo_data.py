"""Generate coherent synthetic teacher demo data through the domain engines."""

from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from ailearn_diagnostic import diagnose
from ailearn_schemas import EvidenceEventV1

from ailearn_api.curriculum import CURRICULUM, ITEMS
from ailearn_api.teacher_projection import initial_plan_version, initial_snapshot

REPO_ROOT = Path(__file__).resolve().parents[1]
SEEDS = REPO_ROOT / "data" / "seeds"
FIXTURES = REPO_ROOT / "data" / "fixtures"
WEB_FIXTURES = REPO_ROOT / "apps" / "web" / "src" / "test" / "fixtures"
BASE_TIME = datetime(2026, 7, 18, 1, 0, tzinfo=UTC)


def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _write(path: Path, payload: Any) -> None:
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def _option(item: dict[str, Any], *, misconception: str | None) -> dict[str, Any]:
    options = item["options"]
    if misconception is None:
        return next(option for option in options if option["is_correct"])
    return next(
        option
        for option in options
        if not option["is_correct"] and option.get("misconception_id") == misconception
    )


def _response_for(profile_type: str, item: dict[str, Any]) -> dict[str, Any]:
    item_id = item["item_id"]
    if profile_type in {"strong", "insufficient"}:
        return _option(item, misconception=None)
    if profile_type == "weak_foundation":
        misconception_by_item = {
            "item_inv_prop_01": "mis_computation_error",
            "item_inv_prop_03": "mis_direct_inverse_confusion",
            "item_inv_prop_20": "mis_context_representation_gap",
        }
        return _option(item, misconception=misconception_by_item.get(item_id))
    if profile_type == "m1_confusion":
        has_confusion = any(
            option.get("misconception_id") == "mis_direct_inverse_confusion"
            for option in item["options"]
        )
        return _option(
            item,
            misconception="mis_direct_inverse_confusion" if has_confusion else None,
        )
    if profile_type == "m2_calc":
        has_computation_error = any(
            option.get("misconception_id") == "mis_computation_error"
            for option in item["options"]
        )
        return _option(
            item,
            misconception="mis_computation_error" if has_computation_error else None,
        )
    if profile_type == "m3_language":
        misconception_by_item = {
            "item_inv_prop_16": "mis_direct_inverse_confusion",
            "item_inv_prop_17": "mis_direct_inverse_confusion",
            "item_inv_prop_20": "mis_context_representation_gap",
        }
        return _option(item, misconception=misconception_by_item.get(item_id))
    raise ValueError(f"Unsupported synthetic profile type: {profile_type}")


def _events() -> list[dict[str, Any]]:
    students = _load(SEEDS / "students.json")["students"]
    items = _load(SEEDS / "items.json")["items"]
    events: list[dict[str, Any]] = []
    for student_index, student in enumerate(students):
        selected_items = (
            items[:3] if student["profile_type"] == "insufficient" else items
        )
        for item_index, item in enumerate(selected_items, start=1):
            response = _response_for(student["profile_type"], item)
            recorded_at = BASE_TIME + timedelta(
                minutes=(student_index + 1) * 30 + item_index - 1
            )
            events.append(
                {
                    "schema_version": "1",
                    "id": f"ev_{student['student_id']}_{item_index:03d}",
                    "student_id": student["student_id"],
                    "session_id": f"sess_{student['student_id']}_readiness",
                    "skill_id": item["skill_ids"][0],
                    "item_id": item["item_id"],
                    "is_correct": response["is_correct"],
                    "recorded_at": recorded_at.isoformat().replace("+00:00", "Z"),
                    "lesson_id": CURRICULUM.lesson_id,
                    "response_label": response["label"],
                }
            )
    return events


def main() -> None:
    events = _events()
    _write(
        SEEDS / "evidence-events.json",
        {"schema_version": "1", "events": events},
    )

    by_student: dict[str, list[EvidenceEventV1]] = defaultdict(list)
    for event in events:
        validated = EvidenceEventV1.model_validate(event)
        by_student[validated.student_id].append(validated)
    profiles = [
        diagnose(
            student_events,
            CURRICULUM,
            ITEMS,
            now=max(event.recorded_at for event in student_events),
        ).model_dump(mode="json")
        for student_events in by_student.values()
    ]
    _write(
        SEEDS / "diagnostic-profiles.json",
        {"schema_version": "1", "profiles": profiles},
    )

    snapshot = initial_snapshot()
    plan = initial_plan_version(snapshot).lesson_plan
    snapshot_payload = snapshot.model_dump(mode="json")
    plan_payload = plan.model_dump(mode="json")
    intervention_evidence = _load(FIXTURES / "intervention-evidence.json")
    intervention_evidence["planning_evidence_cutoff"] = (
        snapshot.generated_at.isoformat().replace("+00:00", "Z")
    )
    _write(FIXTURES / "class-snapshot.json", snapshot_payload)
    _write(FIXTURES / "lesson-plan.json", plan_payload)
    _write(FIXTURES / "intervention-evidence.json", intervention_evidence)
    _write(WEB_FIXTURES / "class-snapshot.json", snapshot_payload)
    _write(WEB_FIXTURES / "lesson-plan.json", plan_payload)


if __name__ == "__main__":
    main()

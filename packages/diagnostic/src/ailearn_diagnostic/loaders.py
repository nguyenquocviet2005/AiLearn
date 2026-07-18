from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from ailearn_diagnostic.models import (
    AssessmentItem,
    Curriculum,
    GoldenCase,
    GoldenSuite,
    ItemIndex,
    ItemOption,
    Misconception,
    SkillNode,
)

REPO_ROOT = Path(__file__).resolve().parents[4]
DEFAULT_SEEDS_DIR = REPO_ROOT / "data" / "seeds"
DEFAULT_GOLDEN_PATH = REPO_ROOT / "eval" / "golden" / "golden-cases.json"


def _load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def load_curriculum(path: Path | None = None) -> Curriculum:
    payload = _load_json(path or (DEFAULT_SEEDS_DIR / "curriculum.json"))
    skills = {
        skill["skill_id"]: SkillNode(
            skill_id=skill["skill_id"],
            name=skill["name"],
            level=int(skill["level"]),
            prerequisites=tuple(skill.get("prerequisites", [])),
        )
        for skill in payload["skills"]
    }
    misconceptions = {
        row["misconception_id"]: Misconception(
            misconception_id=row["misconception_id"],
            name=row["name"],
            description=row["description"],
            related_skill_ids=tuple(row.get("related_skill_ids", [])),
        )
        for row in payload["misconceptions"]
    }
    return Curriculum(
        lesson_id=payload["lesson_id"],
        title=payload["title"],
        grade=int(payload["grade"]),
        subject=payload["subject"],
        target_skill_id=payload["target_skill_id"],
        skills=skills,
        misconceptions=misconceptions,
    )


def load_items(path: Path | None = None) -> ItemIndex:
    payload = _load_json(path or (DEFAULT_SEEDS_DIR / "items.json"))
    items = {
        item["item_id"]: AssessmentItem(
            item_id=item["item_id"],
            skill_ids=tuple(item["skill_ids"]),
            form=item.get("form", ""),
            stem=item.get("stem", ""),
            options=tuple(
                ItemOption(
                    label=option["label"],
                    is_correct=bool(option["is_correct"]),
                    misconception_id=option.get("misconception_id"),
                )
                for option in item["options"]
            ),
        )
        for item in payload["items"]
    }
    return ItemIndex(lesson_id=payload["lesson_id"], items=items)


def load_golden_suite(path: Path | None = None) -> GoldenSuite:
    payload = _load_json(path or DEFAULT_GOLDEN_PATH)
    cases = tuple(
        GoldenCase(
            golden_case_id=case["golden_case_id"],
            student_id=case["student_id"],
            scenario=case["scenario"],
            events=tuple(case["events"]),
            expected_profile=case["expected_profile"],
            expected_group=case.get("expected_group", ""),
            expected_path_skill_ids=tuple(case.get("expected_path_skill_ids", [])),
        )
        for case in payload["golden_cases"]
    )
    return GoldenSuite(lesson_id=payload["lesson_id"], cases=cases)

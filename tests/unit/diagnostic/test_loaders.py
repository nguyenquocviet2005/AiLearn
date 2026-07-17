from __future__ import annotations

from ailearn_diagnostic.loaders import load_curriculum, load_items


def test_curriculum_and_items_share_lesson_id() -> None:
    curriculum = load_curriculum()
    items = load_items()
    assert curriculum.lesson_id == items.lesson_id
    assert curriculum.target_skill_id in curriculum.skills
    assert curriculum.misconceptions
    assert all(item.skill_ids for item in items.items.values())

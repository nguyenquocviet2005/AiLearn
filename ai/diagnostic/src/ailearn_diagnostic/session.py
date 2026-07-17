from __future__ import annotations

from ailearn_diagnostic.models import AssessmentItem, Curriculum, ItemIndex

MIN_SESSION_SIZE = 3
MAX_SESSION_SIZE = 7
DEFAULT_SESSION_SIZE = 5


def build_readiness_session(
    curriculum: Curriculum,
    items: ItemIndex,
    size: int = DEFAULT_SESSION_SIZE,
) -> list[AssessmentItem]:
    """Select 3–7 distinct items covering the target skill and its prerequisites."""
    if size < MIN_SESSION_SIZE or size > MAX_SESSION_SIZE:
        msg = f"readiness session size must be between {MIN_SESSION_SIZE} and {MAX_SESSION_SIZE}"
        raise ValueError(msg)

    coverage = curriculum.ancestors(curriculum.target_skill_id) | {
        curriculum.target_skill_id
    }
    # Prefer lower-level prerequisites first, then the target skill.
    ordered_skills = sorted(
        coverage,
        key=lambda skill_id: (
            curriculum.skills[skill_id].level,
            skill_id != curriculum.target_skill_id,
            skill_id,
        ),
    )

    selected: list[AssessmentItem] = []
    seen_ids: set[str] = set()
    covered_skills: set[str] = set()

    for skill_id in ordered_skills:
        for item in sorted(items.items.values(), key=lambda row: row.item_id):
            if item.item_id in seen_ids:
                continue
            if skill_id not in item.skill_ids:
                continue
            selected.append(item)
            seen_ids.add(item.item_id)
            covered_skills.update(item.skill_ids)
            break
        if len(selected) >= size:
            break

    if len(selected) < size:
        for item in sorted(items.items.values(), key=lambda row: row.item_id):
            if item.item_id in seen_ids:
                continue
            selected.append(item)
            seen_ids.add(item.item_id)
            if len(selected) >= size:
                break

    if len(selected) < MIN_SESSION_SIZE:
        msg = "not enough assessment items to build a readiness session"
        raise ValueError(msg)

    return selected[:size]

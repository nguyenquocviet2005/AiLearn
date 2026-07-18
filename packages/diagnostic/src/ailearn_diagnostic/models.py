from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True, slots=True)
class SkillNode:
    skill_id: str
    name: str
    level: int
    prerequisites: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class Misconception:
    misconception_id: str
    name: str
    description: str
    related_skill_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class ItemOption:
    label: str
    is_correct: bool
    misconception_id: str | None


@dataclass(frozen=True, slots=True)
class AssessmentItem:
    item_id: str
    skill_ids: tuple[str, ...]
    form: str
    stem: str
    options: tuple[ItemOption, ...]


@dataclass(frozen=True, slots=True)
class Curriculum:
    lesson_id: str
    title: str
    grade: int
    subject: str
    target_skill_id: str
    skills: dict[str, SkillNode]
    misconceptions: dict[str, Misconception]

    def ancestors(self, skill_id: str) -> set[str]:
        result: set[str] = set()
        stack = list(self.skills[skill_id].prerequisites)
        while stack:
            current = stack.pop()
            if current in result:
                continue
            result.add(current)
            stack.extend(self.skills[current].prerequisites)
        return result

    def descendants(self, skill_id: str) -> set[str]:
        children: dict[str, list[str]] = {sid: [] for sid in self.skills}
        for skill in self.skills.values():
            for prerequisite in skill.prerequisites:
                children[prerequisite].append(skill.skill_id)

        result: set[str] = set()
        stack = list(children[skill_id])
        while stack:
            current = stack.pop()
            if current in result:
                continue
            result.add(current)
            stack.extend(children[current])
        return result

    def target_path_skills(self) -> set[str]:
        target = self.target_skill_id
        return self.ancestors(target) | {target} | self.descendants(target)


@dataclass(frozen=True, slots=True)
class ItemIndex:
    lesson_id: str
    items: dict[str, AssessmentItem]

    def misconception_for(self, item_id: str, response_label: str | None) -> str | None:
        item = self.items.get(item_id)
        if item is None or response_label is None:
            return None
        for option in item.options:
            if option.label == response_label:
                return option.misconception_id
        return None


@dataclass(frozen=True, slots=True)
class GoldenCase:
    golden_case_id: str
    student_id: str
    scenario: str
    events: tuple[dict, ...]
    expected_profile: dict
    expected_group: str
    expected_path_skill_ids: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class GoldenSuite:
    lesson_id: str
    cases: tuple[GoldenCase, ...] = field(default_factory=tuple)

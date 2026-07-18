"""Discriminating probe selection (blueprint S3 "Câu hỏi phân biệt").

When diagnosis abstains or root-cause hypotheses compete, the best next
question is the unanswered item whose outcome moves belief the most between
hypotheses. Selection is deterministic and explainable: every candidate gets
an integer score built from named reason codes, so the teacher-facing trust
drawer can show exactly why an item was chosen.

Reason codes (ordered by diagnostic value):

* targets_primary_hypothesis   – item tests the top-ranked root-cause skill.
* isolates_competing_hypothesis – item tests exactly one of the two competing
  skills, so its outcome attributes the gap to one of them.
* verifies_target_readiness    – profile says ready; item re-checks the target
  skill or a direct prerequisite before trusting that call.
* covers_unobserved_skill      – no evidence exists yet for the item's skills.
* distractors_attribute_error  – the item's wrong options map to two or more
  different misconceptions, so the chosen distractor names the error.
* probes_dominant_misconception – an option maps to the misconception observed
  most often so far.
* follows_high_confidence_error – the item tests a skill the student answered
  incorrectly while reporting high confidence (miscalibration hot spot).
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from ailearn_schemas import EvidenceEventV1, StudentDiagnosticProfileV1

from ailearn_diagnostic.models import AssessmentItem, Curriculum, ItemIndex

HIGH_CONFIDENCE = 0.75

_W_PRIMARY = 8
_W_ISOLATES = 6
_W_READINESS = 4
_W_UNOBSERVED = 3
_W_DISTRACTORS = 3
_W_DOMINANT_MIS = 2
_W_CONFIDENT_ERROR = 2


@dataclass(frozen=True, slots=True)
class ProbeSelection:
    item: AssessmentItem
    focus_skill_ids: tuple[str, ...]
    reason_codes: tuple[str, ...]
    score: int


def _min_level(curriculum: Curriculum, item: AssessmentItem) -> int:
    levels = [
        curriculum.skills[skill_id].level
        for skill_id in item.skill_ids
        if skill_id in curriculum.skills
    ]
    return min(levels) if levels else 0


def select_probe_item(
    events: list[EvidenceEventV1],
    curriculum: Curriculum,
    items: ItemIndex,
    profile: StudentDiagnosticProfileV1,
) -> ProbeSelection | None:
    """Pick the unanswered item with the highest discrimination value.

    Deterministic: max score, then lower skill level (foundations first),
    then item_id. Returns None when every item has been answered.
    """
    answered = {event.item_id for event in events}
    candidates = [item for item in items.items.values() if item.item_id not in answered]
    if not candidates:
        return None

    hypothesis_skills = [row.skill_id for row in profile.root_causes]
    primary = hypothesis_skills[0] if hypothesis_skills else None
    secondary = hypothesis_skills[1] if len(hypothesis_skills) > 1 else None

    observed_skills = {event.skill_id for event in events}
    confident_error_skills = {
        event.skill_id
        for event in events
        if not event.is_correct
        and event.confidence is not None
        and event.confidence >= HIGH_CONFIDENCE
    }

    misconception_counts: Counter[str] = Counter()
    for event in events:
        if event.is_correct:
            continue
        misconception_id = items.misconception_for(event.item_id, event.response_label)
        if misconception_id:
            misconception_counts[misconception_id] += 1
    dominant_mis = (
        misconception_counts.most_common(1)[0][0] if misconception_counts else None
    )

    readiness_focus: set[str] = set()
    if profile.readiness_status == "ready":
        target = curriculum.target_skill_id
        readiness_focus = {target} | set(curriculum.skills[target].prerequisites)

    focus = tuple(
        skill_id for skill_id in (primary, secondary) if skill_id is not None
    ) or tuple(sorted(readiness_focus))

    best: ProbeSelection | None = None
    best_key: tuple[int, int, str] | None = None
    for item in candidates:
        item_skills = set(item.skill_ids)
        wrong_option_mis = {
            option.misconception_id
            for option in item.options
            if not option.is_correct and option.misconception_id
        }

        score = 0
        reasons: list[str] = []
        if primary and primary in item_skills:
            score += _W_PRIMARY
            reasons.append("targets_primary_hypothesis")
        if primary and secondary and len(item_skills & {primary, secondary}) == 1:
            score += _W_ISOLATES
            reasons.append("isolates_competing_hypothesis")
        if readiness_focus and readiness_focus & item_skills:
            score += _W_READINESS
            reasons.append("verifies_target_readiness")
        if not observed_skills & item_skills:
            score += _W_UNOBSERVED
            reasons.append("covers_unobserved_skill")
        if len(wrong_option_mis) >= 2:
            score += _W_DISTRACTORS
            reasons.append("distractors_attribute_error")
        if dominant_mis and dominant_mis in wrong_option_mis:
            score += _W_DOMINANT_MIS
            reasons.append("probes_dominant_misconception")
        if confident_error_skills & item_skills:
            score += _W_CONFIDENT_ERROR
            reasons.append("follows_high_confidence_error")

        key = (-score, _min_level(curriculum, item), item.item_id)
        if best_key is None or key < best_key:
            best_key = key
            best = ProbeSelection(
                item=item,
                focus_skill_ids=focus,
                reason_codes=tuple(reasons),
                score=score,
            )

    return best

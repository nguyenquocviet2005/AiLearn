from __future__ import annotations

from ailearn_schemas import EvidenceEventV1

from ailearn_diagnostic.models import ItemIndex
from ailearn_diagnostic.root_cause import RankedSkill

MIN_EVENTS = 5
INSUFFICIENT_MISCONCEPTION = "mis_insufficient_evidence"


class AbstentionPolicy:
    """Decide whether diagnosis should abstain.

    Abstain when:
    - fewer than MIN_EVENTS evidence rows, or
    - any response maps to mis_insufficient_evidence, or
    - the top ranked skill has near-balanced supporting and contradicting evidence.
    """

    def insufficient_input(
        self,
        events: list[EvidenceEventV1],
        items: ItemIndex,
    ) -> bool:
        if len(events) < MIN_EVENTS:
            return True
        for event in events:
            if event.is_correct:
                continue
            misconception_id = items.misconception_for(
                event.item_id, event.response_label
            )
            if misconception_id == INSUFFICIENT_MISCONCEPTION:
                return True
        return False

    def conflicting_top_skill(self, ranked: list[RankedSkill]) -> bool:
        # No ranked skills means no incorrect responses at all: that is the
        # all-correct "ready" case, not conflicting evidence.
        if not ranked:
            return False
        top = ranked[0]
        support = len(top.supporting_evidence_ids)
        contradict = len(top.contradicting_evidence_ids)
        return support > 0 and contradict > 0 and abs(support - contradict) <= 1

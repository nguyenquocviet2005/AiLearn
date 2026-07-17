"""Deterministic remediation state machine.

Design rules (from VAI-16):
* Path selection lives here; NO content generation, NO LLM calls.
* Fully deterministic: identical inputs -> identical transitions.
* Works with the LLM API unavailable (this module never touches it).

Acceptance criteria mapping:
  AC1 insufficient evidence -> CONFIRMATION (not forced repair)  -> start()
  AC2 diagnosed prerequisite gap -> REPAIR                        -> start()
  AC3 continued failure -> step back OR change representation     -> _on_failure()
  AC4 immediate correctness is NOT complete repair                -> advance() sequence gate
  AC5 at least one near-transfer outcome recorded                 -> RESULT step + transfer_outcome
  AC6 repeated failure -> teacher escalation                      -> _on_failure()
  AC7 flow works without the LLM                                  -> no LLM dependency here
"""

from __future__ import annotations

from typing import Optional

from .enums import SEQUENCE, STEP_STATE, ReadinessStatus, RemediationState, Representation, StepKind
from .models import AttemptOutcome, DiagnosticProfile, ImprovementPath, SessionState, Step
from .policy import Policy, load_policy, load_prerequisites, load_skill_misconceptions


class RemediationEngine:
    """Selects the remediation path for one student."""

    def __init__(
        self,
        policy: Optional[Policy] = None,
        prerequisites: Optional[dict[str, tuple[str, ...]]] = None,
        skill_misconceptions: Optional[dict[str, str]] = None,
    ) -> None:
        self._policy = policy or load_policy()
        self._prereqs = prerequisites if prerequisites is not None else load_prerequisites()
        self._skill_mis = (
            skill_misconceptions if skill_misconceptions is not None else load_skill_misconceptions()
        )

    # ------------------------------------------------------------------ start

    def start(self, profile: DiagnosticProfile) -> SessionState:
        """Create the initial session state from a diagnostic profile.

        AC1: abstained (insufficient/conflicting evidence) -> CONFIRMATION.
        AC2: a diagnosed prerequisite gap -> REPAIR.
        """
        root_cause_skill_id = profile.root_causes[0].skill_id if profile.root_causes else None

        if profile.readiness_status is ReadinessStatus.ABSTAINED:
            state = RemediationState.CONFIRMATION
        elif profile.readiness_status is ReadinessStatus.NEEDS_SUPPORT and root_cause_skill_id:
            state = RemediationState.REPAIR
        else:
            # ready, or needs_support with no identified cause -> confirm first.
            state = RemediationState.CONFIRMATION

        representation = self._policy.fallback_order(
            self._skill_mis.get(root_cause_skill_id) if root_cause_skill_id else None
        )[0]

        return SessionState(
            student_id=profile.student_id,
            lesson_id=profile.lesson_id,
            target_skill_id=profile.target_skill_id,
            current_state=state,
            representation=representation,
            root_cause_skill_id=root_cause_skill_id,
            representations_tried=[representation],
        )

    # ------------------------------------------------------------- confirmation

    def confirm(self, session: SessionState, evidence_sufficient: bool) -> SessionState:
        """Resolve CONFIRMATION once more evidence arrives.

        AC1: while evidence stays insufficient we do NOT force repair.
        """
        if session.current_state is not RemediationState.CONFIRMATION:
            return session
        if evidence_sufficient and session.root_cause_skill_id:
            session.current_state = RemediationState.REPAIR
            session.step_index = 0
        # else: stay in CONFIRMATION.
        return session

    # ---------------------------------------------------------------- advance

    def advance(self, session: SessionState, outcome: AttemptOutcome) -> SessionState:
        """Apply one attempt outcome and move the session forward."""
        if session.current_state in (
            RemediationState.TEACHER_ESCALATION,
            RemediationState.CONFIRMATION,
        ):
            return session

        if outcome.is_correct:
            return self._on_success(session)
        return self._on_failure(session)

    def _on_success(self, session: SessionState) -> SessionState:
        session.consecutive_failures = 0
        current_kind = self.current_step_kind(session)

        # AC5: record the near-transfer outcome.
        if current_kind is StepKind.NEAR_TRANSFER:
            session.transfer_outcome = True

        # AC4: one correct answer does not complete repair. The student must walk
        # the whole sequence (worked_example -> guided -> independent -> near_transfer
        # -> result); state follows the step, it is never skipped ahead.
        if session.step_index < len(SEQUENCE) - 1:
            session.step_index += 1

        session.current_state = STEP_STATE[SEQUENCE[session.step_index]]
        return session

    def _on_failure(self, session: SessionState) -> SessionState:
        session.consecutive_failures += 1

        if self.current_step_kind(session) is StepKind.NEAR_TRANSFER:
            session.transfer_outcome = False  # AC5: failure is also an outcome.

        order = self._policy.fallback_order(
            self._skill_mis.get(session.root_cause_skill_id)
            if session.root_cause_skill_id
            else None
        )
        untried = [r for r in order if r not in session.representations_tried]

        # AC3 (a): try a different representation first.
        if untried:
            session.representation = untried[0]
            session.representations_tried.append(untried[0])
            session.current_state = RemediationState.REPAIR
            session.step_index = 0  # restart the sequence in the new representation
            session.consecutive_failures = 0
            return session

        # AC3 (b): all representations exhausted -> step back to a prerequisite.
        prereq = self._next_prerequisite(session)
        if prereq is not None:
            session.prerequisites_stepped_back.append(prereq)
            session.root_cause_skill_id = prereq
            session.representations_tried = [order[0]]
            session.representation = order[0]
            session.current_state = RemediationState.REPAIR
            session.step_index = 0
            session.consecutive_failures = 0
            return session

        # AC6: nothing left to try -> escalate.
        if session.consecutive_failures >= self._policy.max_consecutive_failures:
            session.current_state = RemediationState.TEACHER_ESCALATION
            session.escalation_reason = "esc_repeated_failure"
        return session

    def escalate(self, session: SessionState, reason: str) -> SessionState:
        """Force escalation (e.g. esc_abstained_profile)."""
        session.current_state = RemediationState.TEACHER_ESCALATION
        session.escalation_reason = reason
        return session

    # --------------------------------------------------------------- helpers

    def current_step_kind(self, session: SessionState) -> StepKind:
        return SEQUENCE[min(session.step_index, len(SEQUENCE) - 1)]

    def _next_prerequisite(self, session: SessionState) -> Optional[str]:
        if not session.root_cause_skill_id:
            return None
        for prereq in self._prereqs.get(session.root_cause_skill_id, ()):
            if prereq not in session.prerequisites_stepped_back:
                return prereq
        return None

    def is_complete(self, session: SessionState) -> bool:
        """Complete only after the RESULT step in TRANSFER, with an outcome recorded."""
        return (
            session.current_state is RemediationState.TRANSFER
            and self.current_step_kind(session) is StepKind.RESULT
            and session.transfer_outcome is not None
        )

    # ------------------------------------------------------------ serialization

    def to_path(self, session: SessionState, updated_at: str) -> ImprovementPath:
        """Serialize to StudentImprovementPathV1."""
        steps: list[Step] = []
        for i, kind in enumerate(SEQUENCE):
            steps.append(
                Step(
                    id=f"step_{session.student_id}_{kind.value}",
                    kind=kind,
                    state=STEP_STATE[kind],
                    completed=i < session.step_index,
                )
            )
        return ImprovementPath(
            id=f"path_{session.student_id}_{session.target_skill_id}",
            student_id=session.student_id,
            target_skill_id=session.target_skill_id,
            current_state=session.current_state,
            representation=session.representation,
            steps=steps,
            updated_at=updated_at,
            root_cause_skill_id=session.root_cause_skill_id,
        )

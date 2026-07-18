"""Template-based content service with optional LLM enrichment.

Architecture rule (VAI-16):
  "Content generation stays in packages/content/ via ContentGenerator and must not make
   core diagnosis/grouping/path decisions. Core flow must work when the LLM API
   is unavailable."

So this module:
  * NEVER decides state, path, grouping or diagnosis.
  * Always resolves a deterministic template first (AC7).
  * Treats the LLM as pure decoration: any failure/timeout falls back silently.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Protocol

_REPO_ROOT = Path(__file__).resolve().parents[4]
_TEMPLATES_PATH = _REPO_ROOT / "packages" / "content" / "intervention-templates.json"


@dataclass(frozen=True, slots=True)
class Template:
    """One intervention template from VAI-13 seed data."""

    template_id: str
    title: str
    misconception_id: Optional[str]
    target_skill_ids: tuple[str, ...]
    state: str
    kind: str
    representation: str
    body: str
    checkpoint_question: str
    checkpoint_answer: str
    accepted_answers: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class Content:
    """What the student shell renders for the current step.

    ``checkpoint_answer`` / ``accepted_answers`` are the answer key: grade with
    them on the server, never serialize them to the student client.
    """

    template_id: str
    title: str
    body: str
    checkpoint_question: str
    checkpoint_answer: str
    accepted_answers: tuple[str, ...]
    representation: str
    source: str  # "template" | "template+llm" | "generic_fallback"

    @property
    def is_gradable(self) -> bool:
        """True when a typed answer can be auto-graded against accepted answers.

        When False the step falls back to student self-report (the UI shows
        "I got it" / "I need help" instead of a text box).
        """
        return bool(self.accepted_answers)


class LLMAdapter(Protocol):
    """Optional enrichment backend. Implementations may raise; callers must not care."""

    def enrich(self, body: str, context: dict[str, Any]) -> str: ...


class NullLLMAdapter:
    """Default adapter used when no LLM is configured. Always a no-op."""

    def enrich(self, body: str, context: dict[str, Any]) -> str:  # noqa: ARG002
        return body


_GENERIC = Content(
    template_id="tpl_generic_fallback",
    title="Ôn lại kiến thức",
    body=(
        "Hãy xem lại định nghĩa và ví dụ mẫu của phần này, "
        "sau đó thử làm lại bài tập từng bước một."
    ),
    checkpoint_question="Em hãy nêu lại công thức liên hệ giữa hai đại lượng trong bài.",
    checkpoint_answer="",
    accepted_answers=(),
    representation="text",
    source="generic_fallback",
)


class ContentGenerator:
    """Resolves content for a remediation step. Template-first, LLM-optional."""

    def __init__(
        self,
        templates_path: Optional[str] = None,
        llm: Optional[LLMAdapter] = None,
    ) -> None:
        self._llm: LLMAdapter = llm or NullLLMAdapter()
        self._templates: tuple[Template, ...] = self._load(
            Path(templates_path) if templates_path else _TEMPLATES_PATH
        )

    @staticmethod
    def _load(path: Path) -> tuple[Template, ...]:
        try:
            with path.open(encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError):
            return ()
        return tuple(
            Template(
                template_id=t["template_id"],
                title=t["title"],
                misconception_id=t.get("misconception_id"),
                target_skill_ids=tuple(t.get("target_skill_ids", ())),
                state=t["state"],
                kind=t["kind"],
                representation=t["representation"],
                body=t["body"],
                checkpoint_question=t.get("checkpoint_question", ""),
                checkpoint_answer=t.get("checkpoint_answer", ""),
                accepted_answers=tuple(t.get("accepted_answers", ())),
            )
            for t in data.get("templates", [])
        )

    def generate(
        self,
        skill_id: Optional[str],
        state: str,
        kind: str,
        representation: str,
        misconception_id: Optional[str] = None,
        enrich: bool = False,
    ) -> Content:
        """Return content for one step. Never raises; always returns something (AC7)."""
        template = self._select(skill_id, state, kind, representation, misconception_id)
        if template is None:
            return _GENERIC

        body, source = template.body, "template"
        if enrich:
            try:
                enriched = self._llm.enrich(
                    template.body,
                    {"skill_id": skill_id, "state": state, "kind": kind},
                )
                # Only accept a usable, non-empty string.
                if isinstance(enriched, str) and enriched.strip():
                    body, source = enriched, "template+llm"
            except Exception:  # noqa: BLE001 - LLM is decoration; never break the flow.
                pass

        return Content(
            template_id=template.template_id,
            title=template.title,
            body=body,
            checkpoint_question=template.checkpoint_question,
            checkpoint_answer=template.checkpoint_answer,
            accepted_answers=template.accepted_answers,
            representation=template.representation,
            source=source,
        )

    def _select(
        self,
        skill_id: Optional[str],
        state: str,
        kind: str,
        representation: str,
        misconception_id: Optional[str],
    ) -> Optional[Template]:
        """Deterministic selection: score candidates, best score wins, ties -> first."""
        if not self._templates:
            return None

        best: Optional[Template] = None
        best_score = -1
        for t in self._templates:
            matches_skill = bool(skill_id) and skill_id in t.target_skill_ids
            matches_misconception = (
                bool(misconception_id) and t.misconception_id == misconception_id
            )
            # A template is only a candidate when it addresses this skill or
            # misconception. Representation/state/kind refine the choice but must
            # never, on their own, make unrelated content selectable.
            if not (matches_skill or matches_misconception):
                continue

            score = 0
            if matches_skill:
                score += 8
            if matches_misconception:
                score += 4
            if t.representation == representation:
                score += 2
            if t.state == state:
                score += 1
            if t.kind == kind:
                score += 1
            if score > best_score:
                best, best_score = t, score

        return best

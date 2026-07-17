"""Unit tests for the content service.

Focus: AC7 — the core flow must work when the LLM API is unavailable.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from ailearn_content import ContentGenerator, NullLLMAdapter

REPO_ROOT = Path(__file__).resolve().parents[3]
TEMPLATES = str(REPO_ROOT / "ai" / "content" / "intervention-templates.json")


class ExplodingLLM:
    """Simulates an LLM API that is down."""

    def enrich(self, body: str, context: dict) -> str:  # noqa: ARG002
        raise ConnectionError("LLM API unavailable")


class SlowTimeoutLLM:
    def enrich(self, body: str, context: dict) -> str:  # noqa: ARG002
        raise TimeoutError("deadline exceeded")


class EmptyLLM:
    """Returns junk that must not reach the student."""

    def enrich(self, body: str, context: dict) -> str:  # noqa: ARG002
        return "   "


class GoodLLM:
    def enrich(self, body: str, context: dict) -> str:  # noqa: ARG002
        return body + "\n\n(giải thích thêm)"


@pytest.fixture
def gen() -> ContentGenerator:
    return ContentGenerator(templates_path=TEMPLATES)


# --------------------------------------------------------------- AC7


def test_ac7_works_without_llm_configured(gen):
    """AC7: no LLM at all -> still returns real template content."""
    c = gen.generate(
        skill_id="skill_distinguish_direct_inverse",
        state="REPAIR",
        kind="worked_example",
        representation="table",
        misconception_id="mis_direct_inverse_confusion",
    )
    assert c.source == "template"
    assert c.body.strip()
    assert c.template_id == "tpl_repair_direct_vs_inverse_table"


def test_ac7_llm_connection_error_falls_back_to_template():
    """AC7: LLM down -> template content, no exception."""
    g = ContentGenerator(templates_path=TEMPLATES, llm=ExplodingLLM())
    c = g.generate(
        skill_id="skill_distinguish_direct_inverse",
        state="REPAIR",
        kind="worked_example",
        representation="table",
        enrich=True,
    )
    assert c.source == "template"
    assert c.body.strip()


def test_ac7_llm_timeout_falls_back_to_template():
    g = ContentGenerator(templates_path=TEMPLATES, llm=SlowTimeoutLLM())
    c = g.generate(
        skill_id="skill_equal_ratios_property",
        state="PRACTICE",
        kind="independent_problem",
        representation="text",
        enrich=True,
    )
    assert c.source == "template"


def test_ac7_empty_llm_response_is_rejected():
    g = ContentGenerator(templates_path=TEMPLATES, llm=EmptyLLM())
    c = g.generate(
        skill_id="skill_equal_ratios_property",
        state="PRACTICE",
        kind="independent_problem",
        representation="text",
        enrich=True,
    )
    assert c.source == "template"
    assert c.body.strip()


def test_ac7_missing_templates_file_still_returns_content():
    """Even with no seed data at all, never crash the student flow."""
    g = ContentGenerator(templates_path="/nonexistent/path.json")
    c = g.generate("skill_x", "REPAIR", "worked_example", "text")
    assert c.source == "generic_fallback"
    assert c.body.strip()


def test_llm_enrichment_used_when_available():
    g = ContentGenerator(templates_path=TEMPLATES, llm=GoodLLM())
    c = g.generate(
        skill_id="skill_distinguish_direct_inverse",
        state="REPAIR",
        kind="worked_example",
        representation="table",
        enrich=True,
    )
    assert c.source == "template+llm"
    assert "(giải thích thêm)" in c.body


def test_enrich_is_opt_in():
    """Default path must not call the LLM at all."""
    g = ContentGenerator(templates_path=TEMPLATES, llm=ExplodingLLM())
    c = g.generate(
        skill_id="skill_distinguish_direct_inverse",
        state="REPAIR",
        kind="worked_example",
        representation="table",
    )
    assert c.source == "template"


# --------------------------------------------------------- selection behaviour


def test_selection_is_deterministic(gen):
    args = dict(
        skill_id="skill_word_problem_work_rate",
        state="REPAIR",
        kind="worked_example",
        representation="table",
    )
    ids = {gen.generate(**args).template_id for _ in range(5)}
    assert len(ids) == 1


def test_representation_affects_selection(gen):
    table = gen.generate(
        skill_id="skill_inverse_proportion_definition",
        state="REPAIR",
        kind="worked_example",
        representation="table",
    )
    diagram = gen.generate(
        skill_id="skill_inverse_proportion_definition",
        state="REPAIR",
        kind="worked_example",
        representation="diagram",
    )
    assert table.template_id != diagram.template_id
    assert diagram.representation == "diagram"


def test_unknown_skill_returns_generic_fallback(gen):
    c = gen.generate("skill_does_not_exist", "REPAIR", "worked_example", "text")
    assert c.source == "generic_fallback"


def test_every_template_has_body_and_checkpoint(gen):
    for t in gen._templates:  # noqa: SLF001 - inspecting seed data quality
        assert t.body.strip()
        assert t.checkpoint_question.strip()


def test_null_adapter_returns_body_unchanged():
    assert NullLLMAdapter().enrich("abc", {}) == "abc"


def test_content_generator_makes_no_path_decisions(gen):
    """Architecture rule: content must not expose state/path decisions."""
    c = gen.generate(
        skill_id="skill_distinguish_direct_inverse",
        state="REPAIR",
        kind="worked_example",
        representation="table",
    )
    for forbidden in ("next_state", "current_state", "escalate", "root_cause"):
        assert not hasattr(c, forbidden)

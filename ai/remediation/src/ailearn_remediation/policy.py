"""Policy loading from VAI-13 seed data.

Reads ai/content/intervention-templates.json so escalation thresholds and
representation fallback order are DATA, not hard-coded constants.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Optional

from .enums import Representation

# Repo root = ai/remediation/src/ailearn_remediation/policy.py -> up 4
_REPO_ROOT = Path(__file__).resolve().parents[4]
_TEMPLATES_PATH = _REPO_ROOT / "ai" / "content" / "intervention-templates.json"
_CURRICULUM_PATH = _REPO_ROOT / "data" / "seeds" / "curriculum.json"

# Escalate after this many consecutive failures on the same root cause
# once every representation has been tried. Mirrors esc_repeated_failure.
MAX_CONSECUTIVE_FAILURES = 3

DEFAULT_FALLBACK: tuple[Representation, ...] = (
    Representation.TEXT,
    Representation.TABLE,
    Representation.DIAGRAM,
)


@dataclass(frozen=True, slots=True)
class Policy:
    """Remediation policy resolved from seed data."""

    default_fallback: tuple[Representation, ...]
    fallback_by_misconception: dict[str, tuple[Representation, ...]]
    max_consecutive_failures: int = MAX_CONSECUTIVE_FAILURES

    def fallback_order(self, misconception_id: Optional[str]) -> tuple[Representation, ...]:
        if misconception_id and misconception_id in self.fallback_by_misconception:
            return self.fallback_by_misconception[misconception_id]
        return self.default_fallback


def _read_json(path: Path) -> dict[str, Any]:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


@lru_cache(maxsize=1)
def load_policy(templates_path: Optional[str] = None) -> Policy:
    """Load policy from intervention-templates.json, falling back to defaults."""
    path = Path(templates_path) if templates_path else _TEMPLATES_PATH
    try:
        data = _read_json(path)
    except (OSError, json.JSONDecodeError):
        return Policy(default_fallback=DEFAULT_FALLBACK, fallback_by_misconception={})

    order = data.get("representation_fallback_order", {})
    default = tuple(
        Representation(r) for r in order.get("default", [r.value for r in DEFAULT_FALLBACK])
    )
    by_mis = {
        mis: tuple(Representation(r) for r in reps)
        for mis, reps in order.get("by_misconception", {}).items()
    }
    return Policy(default_fallback=default or DEFAULT_FALLBACK, fallback_by_misconception=by_mis)


@lru_cache(maxsize=1)
def load_prerequisites(curriculum_path: Optional[str] = None) -> dict[str, tuple[str, ...]]:
    """Map skill_id -> prerequisite skill_ids, from data/seeds/curriculum.json."""
    path = Path(curriculum_path) if curriculum_path else _CURRICULUM_PATH
    try:
        data = _read_json(path)
    except (OSError, json.JSONDecodeError):
        return {}
    return {
        s["skill_id"]: tuple(s.get("prerequisites", ()))
        for s in data.get("skills", [])
    }


@lru_cache(maxsize=1)
def load_skill_misconceptions(curriculum_path: Optional[str] = None) -> dict[str, str]:
    """Map skill_id -> first related misconception_id, from curriculum seed."""
    path = Path(curriculum_path) if curriculum_path else _CURRICULUM_PATH
    try:
        data = _read_json(path)
    except (OSError, json.JSONDecodeError):
        return {}
    out: dict[str, str] = {}
    for mis in data.get("misconceptions", []):
        for skill_id in mis.get("related_skill_ids", []):
            out.setdefault(skill_id, mis["misconception_id"])
    return out

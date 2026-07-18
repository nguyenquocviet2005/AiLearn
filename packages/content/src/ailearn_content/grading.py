"""Deterministic server-side checkpoint grading.

The answer key never reaches the client. The student submits free text; this
module decides correctness against a template's ``accepted_answers``.

Matching rules (deterministic, order-independent):

* Normalize both sides: lowercase, trim, collapse internal whitespace, drop a
  small set of trailing punctuation.
* A purely numeric accepted answer (e.g. "15") must appear as a *standalone
  token* in the response, so "15" does not match "150" or "115".
* Any other accepted answer (words, or a phrase like "y = 4") matches as a
  normalized substring, so "tỉ lệ nghịch" matches "em nghĩ là tỉ lệ nghịch".
"""

from __future__ import annotations

import re
from collections.abc import Sequence

_PUNCT = ".,;:!?()[]{}\"'"


def normalize(text: str) -> str:
    lowered = text.strip().lower().strip(_PUNCT)
    return re.sub(r"\s+", " ", lowered).strip()


def _is_numeric(token: str) -> bool:
    return bool(re.fullmatch(r"[-+]?\d+(?:[.,]\d+)?", token))


def grade(accepted_answers: Sequence[str], response: str) -> bool:
    """Return True when ``response`` satisfies any accepted answer."""
    normalized = normalize(response)
    if not normalized:
        return False
    tokens = set(normalized.split(" "))
    for raw in accepted_answers:
        candidate = normalize(raw)
        if not candidate:
            continue
        if _is_numeric(candidate):
            if candidate in tokens:
                return True
        elif candidate in normalized:
            return True
    return False

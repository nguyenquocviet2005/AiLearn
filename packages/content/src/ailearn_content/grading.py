"""Server-side checkpoint grading.

The answer key never reaches the HTTP response (see ContentGenerator.grade()).
Grading is deterministic normalized-string / bare-number comparison — never an LLM
call — per the blueprint's rule that LLMs must not be the source of truth for
correctness (§5.7).
"""

from __future__ import annotations

import re
import unicodedata

# A short label/unit (e.g. "y =", "k =", "giờ", "máy") around a bare number is still
# graded as that number; anything longer (a full derivation) is compared as text only,
# so we never accidentally match an incidental number inside a long sentence.
_BARE_NUMBER = re.compile(r"^(?:[^=\n]{0,12}=\s*)?(-?\d+(?:[.,]\d+)?)\s*\S{0,10}$")


def _normalize(text: str) -> str:
    normalized = unicodedata.normalize("NFC", text).strip().casefold()
    return re.sub(r"\s+", " ", normalized)


def _bare_number(text: str) -> float | None:
    match = _BARE_NUMBER.match(text.strip())
    if not match:
        return None
    try:
        return float(match.group(1).replace(",", "."))
    except ValueError:
        return None


def grade(response: str, accepted_answers: tuple[str, ...]) -> bool:
    """True when `response` matches any accepted answer, ignoring case/whitespace.

    Also accepts a bare-number match (e.g. "4" grades the same as "y = 4") when both
    sides reduce to a short label/unit around one number.
    """
    if not accepted_answers or not response.strip():
        return False

    normalized_response = _normalize(response)
    response_number = _bare_number(response)

    for candidate in accepted_answers:
        if normalized_response == _normalize(candidate):
            return True
        candidate_number = _bare_number(candidate)
        if (
            response_number is not None
            and candidate_number is not None
            and response_number == candidate_number
        ):
            return True
    return False

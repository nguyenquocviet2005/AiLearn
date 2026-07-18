from __future__ import annotations

from ailearn_content import grade


def test_numeric_answer_requires_standalone_token() -> None:
    assert grade(["15"], "15 máy") is True
    assert grade(["15"], "cần 15 máy cày") is True
    # A numeric key must not match a longer number.
    assert grade(["15"], "150") is False
    assert grade(["4"], "y = 4") is True


def test_word_answer_matches_as_substring() -> None:
    assert grade(["tỉ lệ nghịch", "nghịch"], "em nghĩ là tỉ lệ nghịch") is True
    assert grade(["nghịch"], "tỉ lệ thuận") is False


def test_empty_or_unmatched_response_is_incorrect() -> None:
    assert grade(["6"], "") is False
    assert grade([], "bất kỳ") is False

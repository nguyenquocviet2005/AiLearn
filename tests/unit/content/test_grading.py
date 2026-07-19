from __future__ import annotations

from ailearn_content.grading import grade


def test_grade_matches_exact_text() -> None:
    assert grade("tỉ lệ nghịch", ("tỉ lệ nghịch",)) is True


def test_grade_ignores_case_and_surrounding_whitespace() -> None:
    assert grade("  TỈ LỆ NGHỊCH  ", ("tỉ lệ nghịch",)) is True


def test_grade_collapses_internal_whitespace() -> None:
    assert grade("tỉ   lệ    nghịch", ("tỉ lệ nghịch",)) is True


def test_grade_matches_bare_number_with_label() -> None:
    assert grade("y = 4", ("4",)) is True
    assert grade("4", ("y = 4",)) is True


def test_grade_matches_bare_number_with_unit() -> None:
    assert grade("15 máy", ("15",)) is True


def test_grade_rejects_wrong_answer() -> None:
    assert grade("tỉ lệ thuận", ("tỉ lệ nghịch",)) is False


def test_grade_rejects_wrong_number() -> None:
    assert grade("5", ("4",)) is False


def test_grade_does_not_match_incidental_numbers_in_long_sentences() -> None:
    # A long derivation containing "4" must not accidentally match a short "4" key,
    # since a real long response is text-compared, not number-extracted.
    assert grade("k = 3 x 8 = 24, vậy y2 = 4 không đúng vì thiếu bước", ("4",)) is False


def test_grade_returns_false_for_empty_response() -> None:
    assert grade("   ", ("4",)) is False


def test_grade_returns_false_when_no_accepted_answers() -> None:
    assert grade("anything", ()) is False


def test_grade_accepts_any_matching_candidate_in_a_list() -> None:
    assert grade("nghịch", ("tỉ lệ nghịch", "nghịch")) is True
    assert grade("thuận", ("tỉ lệ nghịch", "nghịch")) is False

from __future__ import annotations

import pytest

from ailearn_diagnostic.loaders import load_curriculum, load_items
from ailearn_diagnostic.session import (
    DEFAULT_SESSION_SIZE,
    MAX_SESSION_SIZE,
    MIN_SESSION_SIZE,
    build_readiness_session,
)


def test_build_readiness_session_size_and_coverage() -> None:
    curriculum = load_curriculum()
    items = load_items()
    session = build_readiness_session(curriculum, items, size=DEFAULT_SESSION_SIZE)
    assert MIN_SESSION_SIZE <= len(session) <= MAX_SESSION_SIZE
    assert len({item.item_id for item in session}) == len(session)

    coverage = curriculum.ancestors(curriculum.target_skill_id) | {
        curriculum.target_skill_id
    }
    covered = {skill_id for item in session for skill_id in item.skill_ids}
    assert covered & coverage


def test_build_readiness_session_rejects_invalid_size() -> None:
    curriculum = load_curriculum()
    items = load_items()
    with pytest.raises(ValueError):
        build_readiness_session(curriculum, items, size=2)
    with pytest.raises(ValueError):
        build_readiness_session(curriculum, items, size=8)

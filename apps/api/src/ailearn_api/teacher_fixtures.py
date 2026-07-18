"""Compatibility exports for deterministic teacher data sources."""

from ailearn_schemas import InterventionReportV1

from ailearn_api.config import API_PROJECT_ROOT
from ailearn_api.teacher_projection import initial_plan_version, initial_snapshot

_REPO_ROOT = API_PROJECT_ROOT.parent.parent


def intervention_report() -> InterventionReportV1:
    """Load and validate the synthetic outcome personas for teacher reporting."""

    return InterventionReportV1.model_validate_json(
        (_REPO_ROOT / "data/fixtures/intervention-report.json").read_text(encoding="utf-8")
    )


__all__ = ["initial_plan_version", "initial_snapshot", "intervention_report"]

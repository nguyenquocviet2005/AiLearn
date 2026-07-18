from ailearn_schemas import InterventionReportV1
from fastapi import APIRouter, HTTPException, status

from ailearn_api.teacher_fixtures import intervention_report

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/{report_id}", response_model=InterventionReportV1)
async def get_intervention_report(report_id: str) -> InterventionReportV1:
    report = intervention_report()
    if report.id != report_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "intervention_report_not_found",
                "message": "Intervention report was not found.",
            },
        )
    return report

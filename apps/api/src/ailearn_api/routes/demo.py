"""Demo persona discovery and in-memory reset endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ailearn_api.demo_data import get_persona, list_personas
from ailearn_api.diagnostic_session_store import clear_sessions
from ailearn_api.routes.remediation import reset_remediation_state

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


class DemoResetRequest(BaseModel):
    persona_id: str


@router.get("/personas")
def get_demo_personas() -> dict[str, list[dict[str, str]]]:
    return {"personas": list_personas()}


@router.post("/reset")
def reset_demo(req: DemoResetRequest) -> dict[str, Any]:
    """Restore one synthetic persona and clear transient API state.

    This reset intentionally does not modify Supabase rows or production data.
    """
    persona = get_persona(req.persona_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="Unknown demo persona")

    clear_sessions()
    reset_remediation_state()
    return {
        "persona": {
            "id": persona["id"],
            "label": persona["label"],
            "student_id": persona["student_id"],
            "display_name": persona["display_name"],
            "profile": persona["profile"],
        }
    }

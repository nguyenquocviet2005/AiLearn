from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"


class DatabaseStatus(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: Literal["operational", "degraded", "maintenance"]
    checked_at: datetime


class SystemStatusResponse(BaseModel):
    status: Literal["ok"] = "ok"
    database: DatabaseStatus


class SystemStatusRecord(BaseModel):
    status: Literal["operational", "degraded", "maintenance"]
    checked_at: datetime

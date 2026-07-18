from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StudentRecord(BaseModel):
    """Persistence row returned from Supabase students."""

    model_config = ConfigDict(extra="ignore")

    id: str
    display_name: str
    class_id: str
    created_at: datetime

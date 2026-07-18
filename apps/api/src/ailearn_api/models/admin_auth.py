from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProfileRecord(BaseModel):
    """Persistence row returned from Supabase profiles."""

    model_config = ConfigDict(extra="ignore")

    id: str
    email: str
    role: str


class AdminLoginRequest(BaseModel):
    """HTTP body for admin email/password login."""

    model_config = ConfigDict(extra="forbid")

    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


class AdminSessionResponse(BaseModel):
    """HTTP response for a newly created admin session."""

    token: str
    expires_at: datetime
    email: str
    role: str


class AdminProfileResponse(BaseModel):
    """HTTP response describing the caller of an authenticated admin session."""

    email: str
    role: str

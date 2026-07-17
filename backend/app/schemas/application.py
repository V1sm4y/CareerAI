"""Job Application Pydantic schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    company_name: str
    role: str
    date_applied: str
    status: ApplicationStatus = ApplicationStatus.APPLIED
    notes: Optional[str] = None


class ApplicationUpdate(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    date_applied: Optional[str] = None
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: int
    company_name: str
    role: str
    date_applied: str
    status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    owner_id: int

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total: int
    by_status: dict
    recent: list

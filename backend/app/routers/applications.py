"""Job application CRUD endpoints."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.application import JobApplication
from app.models.user import User
from app.schemas.application import ApplicationCreate, ApplicationUpdate, ApplicationResponse, DashboardStats
from app.security.dependencies import get_current_user
from app.logging.logger import log_event
from app.logging.event_pipeline import security_pipeline
from datetime import datetime

router = APIRouter(prefix="/api/applications", tags=["applications"])


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Return dashboard statistics for the authenticated user."""
    apps = db.query(JobApplication).filter(JobApplication.owner_id == current_user.id).all()

    by_status = {}
    for app in apps:
        by_status[app.status] = by_status.get(app.status, 0) + 1

    recent = sorted(apps, key=lambda a: a.created_at, reverse=True)[:5]
    recent_data = [
        {"id": a.id, "company_name": a.company_name, "role": a.role,
         "status": a.status, "date_applied": a.date_applied}
        for a in recent
    ]

    return {"total": len(apps), "by_status": by_status, "recent": recent_data}


@router.get("/", response_model=List[ApplicationResponse])
def list_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all job applications for the current user."""
    return db.query(JobApplication).filter(JobApplication.owner_id == current_user.id).order_by(JobApplication.created_at.desc()).all()


@router.post("/", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_application(
    payload: ApplicationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new job application."""
    app = JobApplication(**payload.model_dump(), owner_id=current_user.id)
    db.add(app)
    db.commit()
    db.refresh(app)

    ip = request.client.host if request.client else "unknown"
    log_event("application_created", f"Application created: {payload.company_name}", user=current_user.email, ip=ip)
    security_pipeline.emit("application_created", user=current_user.email, ip=ip, detail={"company": payload.company_name})
    return app


@router.put("/{app_id}", response_model=ApplicationResponse)
def update_application(
    app_id: int,
    payload: ApplicationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing job application."""
    app = db.query(JobApplication).filter(
        JobApplication.id == app_id, JobApplication.owner_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    app.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(app)

    ip = request.client.host if request.client else "unknown"
    log_event("application_updated", f"Application updated: {app_id}", user=current_user.email, ip=ip)
    security_pipeline.emit("application_updated", user=current_user.email, ip=ip, detail={"app_id": app_id})
    return app


@router.delete("/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    app_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a job application."""
    app = db.query(JobApplication).filter(
        JobApplication.id == app_id, JobApplication.owner_id == current_user.id
    ).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()

    ip = request.client.host if request.client else "unknown"
    log_event("application_deleted", f"Application deleted: {app_id}", user=current_user.email, ip=ip)
    security_pipeline.emit("application_deleted", user=current_user.email, ip=ip, detail={"app_id": app_id})

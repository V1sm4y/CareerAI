"""Resume upload, listing, and AI analysis endpoints."""
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.logging.event_pipeline import security_pipeline
from app.logging.logger import log_event
from app.models.resume import Resume
from app.models.user import User
from app.schemas.resume import AnalysisResult, ResumeResponse
from app.security.dependencies import get_current_user
from app.services.ai_analyzer import analyze_resume
from app.services.resume_parser import extract_text_from_pdf

router = APIRouter(prefix="/api/resumes", tags=["resumes"])

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a PDF resume, parse its text, and store it."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 5 MB limit")

    # Save to disk
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}.pdf"
    file_path = upload_dir / unique_name
    file_path.write_bytes(file_bytes)

    # Parse text
    parsed_text = extract_text_from_pdf(file_bytes)

    resume = Resume(
        filename=unique_name,
        original_filename=file.filename,
        file_path=str(file_path),
        file_size=len(file_bytes),
        parsed_text=parsed_text,
        owner_id=current_user.id,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    ip = request.client.host if request.client else "unknown"
    log_event("resume_uploaded", f"Resume uploaded: {file.filename}", user=current_user.email, ip=ip)
    security_pipeline.emit("resume_uploaded", user=current_user.email, ip=ip, detail={"filename": file.filename})
    return resume


@router.get("/", response_model=List[ResumeResponse])
def list_resumes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List all resumes uploaded by the current user."""
    return db.query(Resume).filter(Resume.owner_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()


@router.post("/{resume_id}/analyze", response_model=AnalysisResult)
def analyze(
    resume_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Run AI analysis on a previously uploaded resume."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if not resume.parsed_text:
        raise HTTPException(status_code=422, detail="No parsed text available for this resume")

    result = analyze_resume(resume.parsed_text)

    # Persist results
    resume.ai_score = result["score"]
    resume.ai_recommendations = json.dumps(result)
    resume.analyzed_at = datetime.utcnow()
    db.commit()

    ip = request.client.host if request.client else "unknown"
    log_event("resume_analyzed", f"Resume analyzed: {resume_id} score={result['score']}", user=current_user.email, ip=ip)
    security_pipeline.emit("resume_analyzed", user=current_user.email, ip=ip, detail={"resume_id": resume_id, "score": result["score"]})
    return result


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a single resume record."""
    resume = db.query(Resume).filter(
        Resume.id == resume_id, Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

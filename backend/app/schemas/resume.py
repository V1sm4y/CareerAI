"""Resume Pydantic schemas."""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ResumeResponse(BaseModel):
    id: int
    filename: str
    original_filename: str
    file_size: Optional[int]
    ai_score: Optional[float]
    ai_recommendations: Optional[str]
    uploaded_at: datetime
    analyzed_at: Optional[datetime]
    owner_id: int

    class Config:
        from_attributes = True


class AnalysisResult(BaseModel):
    score: float
    grade: str
    recommendations: List[str]
    strengths: List[str]
    word_count: int
    sections_found: List[str]

"""CareerForge AI — FastAPI application entry point."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os

from app.config import settings
from app.database import engine, Base
from app.middleware import RequestLoggingMiddleware
from app.routers import auth, applications, resumes
from app.logging.logger import log_event


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Ensure upload and log dirs exist
    Path(settings.UPLOAD_DIR).mkdir(exist_ok=True)
    Path(settings.LOG_DIR).mkdir(exist_ok=True)
    log_event("app_startup", "CareerForge AI started", severity="info")
    yield
    log_event("app_shutdown", "CareerForge AI shutting down", severity="info")


app = FastAPI(
    title="CareerForge AI",
    description="Job application tracking platform with AI-powered resume analysis",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logging
app.add_middleware(RequestLoggingMiddleware)

# Routers
app.include_router(auth.router)
app.include_router(applications.router)
app.include_router(resumes.router)


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "careerforge-ai"}

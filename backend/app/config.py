"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List
import json


class Settings(BaseSettings):
    SECRET_KEY: str = "dev-secret-key-change-in-production-minimum-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    DATABASE_URL: str = "sqlite:///./careerforge.db"
    UPLOAD_DIR: str = "uploads"
    LOG_DIR: str = "logs"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # AI Resume Analyzer
    ANALYZER_BACKEND: str = "ollama"          # ollama | mistral | groq | heuristic
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"
    OLLAMA_MODEL: str = "mistral:latest"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


settings = Settings()

"""Application configuration via environment variables."""
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
import secrets
import sys

# Known weak/example keys that must never be used in production
_BANNED_KEYS = {
    "dev-secret-key-change-in-production-minimum-32-chars",
    "your-secret-key-change-in-production-minimum-32-chars",
    "secret",
    "changeme",
    "supersecret",
}


class Settings(BaseSettings):
    # ── Security ──────────────────────────────────────────────────────────────
    # No default — app will refuse to start if this is not set.
    # Generate one with: python -c "import secrets; print(secrets.token_hex(32))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Database ──────────────────────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./careerforge.db"

    # ── Storage ───────────────────────────────────────────────────────────────
    UPLOAD_DIR: str = "uploads"
    LOG_DIR: str = "logs"

    # ── CORS ──────────────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── AI Resume Analyzer ────────────────────────────────────────────────────
    ANALYZER_BACKEND: str = "ollama"   # ollama | mistral | groq | heuristic
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "mixtral-8x7b-32768"
    MISTRAL_API_KEY: str = ""
    MISTRAL_MODEL: str = "mistral-small-latest"
    OLLAMA_MODEL: str = "mistral:latest"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    @field_validator("SECRET_KEY")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """
        Reject weak, known, or too-short secret keys at startup.
        This prevents accidental use of example keys from the repo.
        """
        if len(v) < 32:
            raise ValueError(
                "SECRET_KEY must be at least 32 characters. "
                "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if v.lower() in _BANNED_KEYS:
            raise ValueError(
                f"SECRET_KEY is a known weak/example value. "
                f"Generate a secure key with: python -c \"import secrets; print(secrets.token_hex(32))\""
            )
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"


# Fail fast at startup — do not allow the app to run with an invalid key
try:
    settings = Settings()
except Exception as e:
    print(f"\n[FATAL] Invalid configuration: {e}")
    print(f"[FATAL] Set a secure SECRET_KEY in your .env file.")
    print(f"[FATAL] Run this to generate one:")
    print(f"        python -c \"import secrets; print(secrets.token_hex(32))\"")
    sys.exit(1)

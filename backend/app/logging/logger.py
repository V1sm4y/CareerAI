"""Structured JSON application logger."""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from app.config import settings


class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs structured JSON log entries."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "event_type": getattr(record, "event_type", "app_log"),
            "message": record.getMessage(),
            "user": getattr(record, "user", None),
            "ip": getattr(record, "ip", None),
            "severity": getattr(record, "severity", "info"),
            "extra": getattr(record, "extra_data", {}),
        }
        return json.dumps(log_entry)


def setup_logger() -> logging.Logger:
    """Configure and return the application logger."""
    log_dir = Path(settings.LOG_DIR)
    log_dir.mkdir(exist_ok=True)

    logger = logging.getLogger("careerforge")
    logger.setLevel(logging.DEBUG)

    if not logger.handlers:
        # File handler — structured JSON
        file_handler = logging.FileHandler(log_dir / "app.log")
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)

        # Console handler — human readable
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(
            logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
        )
        logger.addHandler(console_handler)

    return logger


logger = setup_logger()


def log_event(
    event_type: str,
    message: str,
    user: str = None,
    ip: str = None,
    severity: str = "info",
    extra_data: dict = None,
) -> None:
    """Log a structured application event."""
    extra = {
        "event_type": event_type,
        "user": user,
        "ip": ip,
        "severity": severity,
        "extra_data": extra_data or {},
    }
    level = logging.WARNING if severity in ("high", "medium") else logging.INFO
    logger.log(level, message, extra=extra)

"""Security event pipeline — emits SOC-ready events to a dedicated channel."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from app.config import settings


class SecurityEventPipeline:
    """
    Dedicated event pipeline for security events.
    Events are written to security_events.json as newline-delimited JSON (NDJSON).
    Architecture is pluggable — replace _emit() to forward to SIEM, Kafka, etc.
    """

    def __init__(self):
        log_dir = Path(settings.LOG_DIR)
        log_dir.mkdir(exist_ok=True)
        self.event_log_path = log_dir / "security_events.json"

    def emit(
        self,
        event_type: str,
        severity: str = "info",
        user: Optional[str] = None,
        ip: Optional[str] = None,
        detail: Optional[dict] = None,
    ) -> None:
        """Emit a security event to the pipeline."""
        event = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "severity": severity,
            "user": user,
            "ip": ip,
            "detail": detail or {},
        }
        self._emit(event)

    def _emit(self, event: dict) -> None:
        """Write the event to the NDJSON log file."""
        with open(self.event_log_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")


# Singleton pipeline instance
security_pipeline = SecurityEventPipeline()

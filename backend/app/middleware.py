"""Request logging middleware."""
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.logging.logger import log_event


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every incoming API request with method, path, status, and duration."""

    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        ip = request.client.host if request.client else "unknown"
        log_event(
            event_type="api_request",
            message=f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)",
            ip=ip,
            severity="info",
            extra_data={
                "method": request.method,
                "path": str(request.url.path),
                "status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

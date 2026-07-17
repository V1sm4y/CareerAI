"""Authentication endpoints — register and login."""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.services.auth_service import authenticate_user, create_user, get_user_by_email
from app.security.jwt_handler import create_access_token
from app.logging.logger import log_event
from app.logging.event_pipeline import security_pipeline

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _get_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, request: Request, db: Session = Depends(get_db)):
    """Register a new user account."""
    ip = _get_ip(request)
    log_event("registration_attempt", f"Registration attempt for {payload.email}", ip=ip, severity="info")
    security_pipeline.emit("registration_attempt", severity="info", user=payload.email, ip=ip)

    existing = get_user_by_email(db, payload.email)
    if existing:
        log_event("registration_failed", f"Email already registered: {payload.email}", user=payload.email, ip=ip, severity="medium")
        security_pipeline.emit("registration_failed", severity="medium", user=payload.email, ip=ip, detail={"reason": "email_exists"})
        raise HTTPException(status_code=400, detail="Email already registered")

    user = create_user(db, payload.email, payload.full_name, payload.password)
    log_event("registration_success", f"User registered: {payload.email}", user=payload.email, ip=ip, severity="info")
    security_pipeline.emit("registration_success", severity="info", user=payload.email, ip=ip)
    return user


@router.post("/login", response_model=Token)
def login(payload: UserLogin, request: Request, db: Session = Depends(get_db)):
    """Authenticate and return a JWT access token."""
    ip = _get_ip(request)

    user = authenticate_user(db, payload.email, payload.password)
    if not user:
        log_event("login_failed", f"Failed login for {payload.email}", user=payload.email, ip=ip, severity="medium")
        security_pipeline.emit("login_failed", severity="medium", user=payload.email, ip=ip, detail={"reason": "invalid_credentials"})
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id)})
    log_event("login_success", f"User logged in: {payload.email}", user=payload.email, ip=ip, severity="info")
    security_pipeline.emit("login_success", severity="info", user=payload.email, ip=ip)
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_me(request: Request, db: Session = Depends(get_db)):
    """Get the current authenticated user's profile."""
    from app.security.dependencies import get_current_user
    from fastapi.security import OAuth2PasswordBearer
    from fastapi import Header
    # We re-use the dependency inline here
    authorization = request.headers.get("Authorization", "")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else ""
    from app.security.jwt_handler import decode_token
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = payload.get("sub")
    from app.models.user import User
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

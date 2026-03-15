"""Authentication helpers and FastAPI dependencies."""
from typing import Optional
import bcrypt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .database import get_db
from .models import User


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a bcrypt-hashed password. Plain-text fallback removed for HIPAA compliance."""
    if not hashed.startswith("$2"):
        return False  # reject any un-hashed passwords
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def get_current_user(
    x_user_id: Optional[str] = Header(default=None, alias="X-User-ID"),
    db: Session = Depends(get_db),
) -> User:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = db.query(User).filter(User.id == x_user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_manager_or_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "manager"):
        raise HTTPException(status_code=403, detail="Manager or admin access required")
    return user

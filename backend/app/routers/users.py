import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, AuditLog
from ..schemas import UserOut, LoginRequest, UserCreate, UserUpdate, BulkResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()


@router.post("/login", response_model=UserOut)
def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.username == body.username.strip().lower(),
        User.password == body.password,
    ).first()
    if not user:
        logger.warning("Failed login attempt for username '%s'", body.username)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Record audit entry
    ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip() or (request.client.host if request.client else None)
    ua = request.headers.get("user-agent", "")[:500]
    db.add(AuditLog(user_id=user.id, username=user.username, name=user.name, team=user.team, ip_address=ip, user_agent=ua))
    db.commit()
    logger.info("User '%s' logged in (%s) from %s", user.username, user.team, ip)
    return user


@router.post("/", response_model=UserOut, status_code=201)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    username = body.username.strip().lower()
    existing = db.query(User).filter(User.username == username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    data = body.model_dump()
    data["username"] = username
    user = User(**data)
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("User created: %s (%s)", user.username, user.team)
    return user


@router.post("/bulk", response_model=BulkResult)
def bulk_create_users(body: list[UserCreate], db: Session = Depends(get_db)):
    created = skipped = 0
    errors = []
    for u in body:
        username = u.username.strip().lower()
        if db.query(User).filter(User.username == username).first():
            skipped += 1
            continue
        try:
            data = u.model_dump()
            data["username"] = username
            db.add(User(**data))
            db.commit()
            created += 1
        except Exception as e:
            db.rollback()
            errors.append(f"{username}: {str(e)}")
    logger.info("Bulk user import: %d created, %d skipped, %d errors", created, skipped, len(errors))
    return {"created": created, "skipped": skipped, "errors": errors}


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: str, body: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    logger.info("User updated: %s", user.username)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    logger.info("User deleted: %s", user_id)

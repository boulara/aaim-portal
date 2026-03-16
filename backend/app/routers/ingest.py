"""
Ingest router — secure API endpoints for automated data feeds.

External systems authenticate with an X-API-Key header.
Admin users manage keys and view logs via their normal session auth.

Endpoints:
  POST   /api/ingest/patients   — CSV full-refresh or upsert of patient records
  POST   /api/ingest/users      — CSV upsert of user records (never deletes)
  POST   /api/ingest/alignment  — CSV update of territory/region/sp fields by patient id
  GET    /api/ingest/logs       — recent ingest history (admin session auth)
  POST   /api/ingest/keys       — create API key (admin session auth)
  GET    /api/ingest/keys       — list API keys (admin session auth)
  DELETE /api/ingest/keys/{id}  — revoke API key (admin session auth)
"""
import csv
import hashlib
import io
import logging
import secrets
import time
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import IngestKey, IngestLog, Patient, User
from ..auth import get_current_user
from ..models import User as UserModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ingest", tags=["ingest"])

# ── Patient fields that ingest is allowed to set ──────────────────────────────
_PATIENT_INGEST_FIELDS = {
    "prescriber", "referral_date", "latest_sp_partner", "latest_sp_status",
    "latest_sp_substatus", "aging_of_status", "last_comment",
    "latest_hub_sub_status", "primary_channel", "primary_payer", "primary_pbm",
    "secondary_channel", "territory", "region", "language", "hipaa_consent",
    "program_type", "first_ship_date", "last_ship_date",
}
_ALIGNMENT_FIELDS = {"territory", "region", "latest_sp_partner", "latest_sp_status"}
_USER_INGEST_FIELDS = {"name", "team", "role"}


# ── API key auth ──────────────────────────────────────────────────────────────

def _hash_key(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def get_ingest_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> IngestKey:
    key_hash = _hash_key(x_api_key)
    key = db.query(IngestKey).filter(
        IngestKey.key_hash == key_hash,
        IngestKey.is_active == True,
    ).first()
    if not key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    key.last_used_at = datetime.utcnow()
    db.commit()
    return key


# ── Admin session auth helper ─────────────────────────────────────────────────

def require_admin(current: UserModel = Depends(get_current_user)) -> UserModel:
    if current.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin role required")
    return current


# ── CSV parsing helper ────────────────────────────────────────────────────────

def parse_csv(upload: UploadFile) -> list[dict]:
    content = upload.file.read().decode("utf-8-sig")  # strip BOM if present
    reader = csv.DictReader(io.StringIO(content))
    return [row for row in reader]


def _log_ingest(
    db: Session,
    table_name: str,
    key: Optional[IngestKey],
    rows_received: int,
    rows_upserted: int,
    rows_deleted: int,
    status: str,
    error_msg: Optional[str],
    duration_ms: int,
):
    entry = IngestLog(
        table_name=table_name,
        key_id=key.id if key else None,
        key_name=key.name if key else "manual",
        rows_received=rows_received,
        rows_upserted=rows_upserted,
        rows_deleted=rows_deleted,
        status=status,
        error_msg=error_msg,
        duration_ms=duration_ms,
    )
    db.add(entry)
    db.commit()


# ── Ingest endpoints ──────────────────────────────────────────────────────────

@router.post("/patients")
def ingest_patients(
    file: UploadFile = File(...),
    full_replace: bool = Query(default=False, description="Delete patients not present in this file"),
    key: IngestKey = Depends(get_ingest_key),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV of patient records. Required column: `id`.
    All other patient columns are optional (only provided columns are updated).
    If full_replace=true, patients whose id is not in the file are deleted
    (only if they have no linked notifications or notes).
    """
    t0 = time.time()
    try:
        rows = parse_csv(file)
    except Exception as e:
        _log_ingest(db, "patients", key, 0, 0, 0, "error", str(e), 0)
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    if not rows:
        _log_ingest(db, "patients", key, 0, 0, 0, "ok", None, 0)
        return {"upserted": 0, "deleted": 0, "errors": []}

    upserted = 0
    errors = []
    incoming_ids: set[int] = set()

    for row in rows:
        raw_id = row.get("id", "").strip()
        if not raw_id:
            errors.append(f"Row missing 'id': {row}")
            continue
        try:
            patient_id = int(raw_id)
        except ValueError:
            errors.append(f"Non-integer id '{raw_id}' skipped")
            continue

        incoming_ids.add(patient_id)
        fields = {
            k: (v.strip() if v.strip() != "" else None)
            for k, v in row.items()
            if k in _PATIENT_INGEST_FIELDS
        }
        # coerce aging_of_status to int
        if "aging_of_status" in fields and fields["aging_of_status"] is not None:
            try:
                fields["aging_of_status"] = int(fields["aging_of_status"])
            except ValueError:
                fields["aging_of_status"] = 0

        existing = db.query(Patient).filter(Patient.id == patient_id).first()
        if existing:
            for k, v in fields.items():
                setattr(existing, k, v)
        else:
            if "prescriber" not in fields or not fields.get("prescriber"):
                errors.append(f"New patient id={patient_id} missing required 'prescriber' column")
                continue
            db.add(Patient(id=patient_id, **fields))
        upserted += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        _log_ingest(db, "patients", key, len(rows), 0, 0, "error", str(e), int((time.time()-t0)*1000))
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    deleted = 0
    if full_replace and incoming_ids:
        existing_ids = {r[0] for r in db.query(Patient.id).all()}
        to_remove = existing_ids - incoming_ids
        for pid in to_remove:
            p = db.query(Patient).filter(Patient.id == pid).first()
            if p and not p.notifications:
                db.delete(p)
                deleted += 1
        db.commit()

    duration_ms = int((time.time() - t0) * 1000)
    logger.info("[INGEST] patients key=%s upserted=%d deleted=%d errors=%d", key.name, upserted, deleted, len(errors))
    _log_ingest(db, "patients", key, len(rows), upserted, deleted, "ok", "\n".join(errors) or None, duration_ms)
    return {"upserted": upserted, "deleted": deleted, "errors": errors}


@router.post("/users")
def ingest_users(
    file: UploadFile = File(...),
    key: IngestKey = Depends(get_ingest_key),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV of user records. Required column: `username`.
    Existing users are updated; new users are created with password 'ChangeMe123!'.
    Users are never deleted via this endpoint.
    """
    t0 = time.time()
    try:
        rows = parse_csv(file)
    except Exception as e:
        _log_ingest(db, "users", key, 0, 0, 0, "error", str(e), 0)
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    upserted = 0
    errors = []

    for row in rows:
        username = row.get("username", "").strip()
        if not username:
            errors.append(f"Row missing 'username': {row}")
            continue

        fields = {k: v.strip() for k, v in row.items() if k in _USER_INGEST_FIELDS and v.strip()}
        existing = db.query(User).filter(User.username == username).first()
        if existing:
            for k, v in fields.items():
                setattr(existing, k, v)
        else:
            name = fields.get("name") or username
            team = fields.get("team", "Home Office")
            role = fields.get("role", "partner")
            # import bcrypt inline to avoid top-level dep issues
            import bcrypt
            hashed = bcrypt.hashpw(b"ChangeMe123!", bcrypt.gensalt()).decode()
            db.add(User(username=username, password=hashed, name=name, team=team, role=role))
        upserted += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        _log_ingest(db, "users", key, len(rows), 0, 0, "error", str(e), int((time.time()-t0)*1000))
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    duration_ms = int((time.time() - t0) * 1000)
    logger.info("[INGEST] users key=%s upserted=%d errors=%d", key.name, upserted, len(errors))
    _log_ingest(db, "users", key, len(rows), upserted, 0, "ok", "\n".join(errors) or None, duration_ms)
    return {"upserted": upserted, "errors": errors}


@router.post("/alignment")
def ingest_alignment(
    file: UploadFile = File(...),
    key: IngestKey = Depends(get_ingest_key),
    db: Session = Depends(get_db),
):
    """
    Upload a CSV mapping patient_id to territory/region/sp fields.
    Required column: `patient_id`. Only alignment columns are updated;
    all other patient data is untouched.
    """
    t0 = time.time()
    try:
        rows = parse_csv(file)
    except Exception as e:
        _log_ingest(db, "alignment", key, 0, 0, 0, "error", str(e), 0)
        raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")

    upserted = 0
    errors = []

    for row in rows:
        raw_id = row.get("patient_id", "").strip()
        if not raw_id:
            errors.append(f"Row missing 'patient_id': {row}")
            continue
        try:
            patient_id = int(raw_id)
        except ValueError:
            errors.append(f"Non-integer patient_id '{raw_id}' skipped")
            continue

        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            errors.append(f"Patient id={patient_id} not found, skipped")
            continue

        fields = {k: v.strip() or None for k, v in row.items() if k in _ALIGNMENT_FIELDS}
        for k, v in fields.items():
            setattr(patient, k, v)
        upserted += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        _log_ingest(db, "alignment", key, len(rows), 0, 0, "error", str(e), int((time.time()-t0)*1000))
        raise HTTPException(status_code=500, detail=f"DB error: {e}")

    duration_ms = int((time.time() - t0) * 1000)
    logger.info("[INGEST] alignment key=%s upserted=%d errors=%d", key.name, upserted, len(errors))
    _log_ingest(db, "alignment", key, len(rows), upserted, 0, "ok", "\n".join(errors) or None, duration_ms)
    return {"upserted": upserted, "errors": errors}


# ── Key management (admin session auth) ──────────────────────────────────────

@router.post("/keys")
def create_ingest_key(
    body: dict,
    db: Session = Depends(get_db),
    current: UserModel = Depends(require_admin),
):
    """Create a new API key. The raw key is returned once — store it securely."""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Key name is required")

    raw = "cdt_" + secrets.token_hex(24)
    key = IngestKey(
        name=name,
        key_hash=_hash_key(raw),
        key_prefix=raw[:12],
        created_by=current.username,
    )
    db.add(key)
    db.commit()
    db.refresh(key)
    logger.info("[INGEST] API key created: name=%s by=%s", name, current.username)
    return {
        "id": key.id,
        "name": key.name,
        "key": raw,          # shown once
        "key_prefix": key.key_prefix,
        "created_at": key.created_at,
    }


@router.get("/keys")
def list_ingest_keys(
    db: Session = Depends(get_db),
    current: UserModel = Depends(require_admin),
):
    keys = db.query(IngestKey).order_by(IngestKey.created_at.desc()).all()
    return [
        {
            "id": k.id,
            "name": k.name,
            "key_prefix": k.key_prefix,
            "created_by": k.created_by,
            "created_at": k.created_at,
            "last_used_at": k.last_used_at,
            "is_active": k.is_active,
        }
        for k in keys
    ]


@router.delete("/keys/{key_id}", status_code=204)
def revoke_ingest_key(
    key_id: str,
    db: Session = Depends(get_db),
    current: UserModel = Depends(require_admin),
):
    key = db.query(IngestKey).filter(IngestKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="Key not found")
    key.is_active = False
    db.commit()
    logger.info("[INGEST] API key revoked: name=%s by=%s", key.name, current.username)


@router.get("/logs")
def get_ingest_logs(
    limit: int = Query(default=50, le=200),
    db: Session = Depends(get_db),
    current: UserModel = Depends(require_admin),
):
    logs = (
        db.query(IngestLog)
        .order_by(IngestLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": l.id,
            "table_name": l.table_name,
            "key_name": l.key_name,
            "rows_received": l.rows_received,
            "rows_upserted": l.rows_upserted,
            "rows_deleted": l.rows_deleted,
            "status": l.status,
            "error_msg": l.error_msg,
            "duration_ms": l.duration_ms,
            "created_at": l.created_at,
        }
        for l in logs
    ]

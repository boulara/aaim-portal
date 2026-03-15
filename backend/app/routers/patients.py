import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Patient, User
from ..schemas import PatientOut, PatientUpdate, PatientCreate, BulkResult
from ..auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/patients", tags=["patients"])

_UPDATABLE_PATIENT_FIELDS = {
    "prescriber", "referral_date", "latest_sp_partner", "latest_sp_status",
    "latest_sp_substatus", "aging_of_status", "last_comment",
    "latest_hub_sub_status", "primary_channel", "primary_payer", "primary_pbm",
    "secondary_channel", "territory", "region", "language", "hipaa_consent",
    "program_type", "first_ship_date", "last_ship_date",
}


@router.get("/", response_model=list[PatientOut])
def list_patients(
    search: str = Query(default=""),
    region: str = Query(default="All"),
    channel: str = Query(default="All"),
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
):
    q = db.query(Patient)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Patient.prescriber.ilike(like)
            | Patient.territory.ilike(like)
            | Patient.primary_payer.ilike(like)
        )
    if region and region != "All":
        q = q.filter(Patient.region == region)
    if channel and channel != "All":
        q = q.filter(Patient.primary_channel == channel)
    results = q.all()
    logger.info(
        "[PHI ACCESS] user=%s team=%s accessed patient list (n=%d search=%r region=%r channel=%r)",
        _current.username, _current.team, len(results),
        search or None,
        region if region != "All" else None,
        channel if channel != "All" else None,
    )
    return results


@router.post("/bulk", response_model=BulkResult)
def bulk_create_patients(
    body: list[PatientCreate],
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
):
    created = skipped = 0
    errors = []
    for p in body:
        try:
            db.add(Patient(**p.model_dump()))
            db.flush()
            created += 1
        except Exception as e:
            db.rollback()
            errors.append(f"{p.prescriber}: {str(e)}")
    db.commit()
    logger.info("Bulk patient import: %d created, %d skipped, %d errors", created, skipped, len(errors))
    return {"created": created, "skipped": skipped, "errors": errors}


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    logger.info("[PHI ACCESS] user=%s team=%s accessed patient id=%s", _current.username, _current.team, patient_id)
    return patient


@router.patch("/{patient_id}", response_model=PatientOut)
def update_patient(
    patient_id: int,
    body: PatientUpdate,
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    updates = {k: v for k, v in body.model_dump(exclude_none=True).items() if k in _UPDATABLE_PATIENT_FIELDS}
    for k, v in updates.items():
        setattr(patient, k, v)
    db.commit()
    db.refresh(patient)
    logger.info("Patient %s updated", patient_id)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(
    patient_id: int,
    db: Session = Depends(get_db),
    _current: User = Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    logger.info("Patient %s deleted", patient_id)

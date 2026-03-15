"""
Shareable analytics report endpoints.

POST /api/reports/share   – authenticated; creates a 7-day share token
GET  /api/reports/{token} – public; returns a data snapshot or 410 if expired
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import SharedReport, Patient, Notification, NotificationReply
from ..auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.post("/share", status_code=201)
def create_share_link(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a 7-day shareable analytics link (authenticated users only)."""
    report = SharedReport(
        created_by=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=7),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return {"token": report.id, "expires_at": report.expires_at.isoformat()}


@router.get("/{token}")
def get_shared_report(token: str, request: Request, response: Response, db: Session = Depends(get_db)):
    """Return a data snapshot for the given share token. Returns 410 if expired."""
    report = db.query(SharedReport).filter(SharedReport.id == token).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if datetime.utcnow() > report.expires_at:
        raise HTTPException(status_code=410, detail="This report link has expired")

    ip = (request.headers.get("x-forwarded-for", "").split(",")[0].strip()
          or (request.client.host if request.client else "unknown"))
    logger.info("[PHI ACCESS] shared_report token=%s accessed from ip=%s", token, ip)

    patients = db.query(Patient).all()
    notifications = db.query(Notification).all()

    def serialize_patient(p):
        return {
            "id": p.id,
            "prescriber": p.prescriber,
            "referral_date": p.referral_date,
            "latest_sp_partner": p.latest_sp_partner,
            "latest_sp_status": p.latest_sp_status,
            "latest_sp_substatus": p.latest_sp_substatus,
            "aging_of_status": p.aging_of_status,
            "last_comment": p.last_comment,
            "latest_hub_sub_status": p.latest_hub_sub_status,
            "primary_channel": p.primary_channel,
            "primary_payer": p.primary_payer,
            "primary_pbm": p.primary_pbm,
            "secondary_channel": p.secondary_channel,
            "territory": p.territory,
            "region": p.region,
            "language": p.language,
            "hipaa_consent": p.hipaa_consent,
            "program_type": p.program_type,
            "first_ship_date": p.first_ship_date,
            "last_ship_date": p.last_ship_date,
        }

    def serialize_notification(n):
        return {
            "id": n.id,
            "patient_id": n.patient_id,
            "from_team": n.from_team,
            "from_user": n.from_user,
            "to_team": n.to_team,
            "comment": n.comment,
            "priority": n.priority,
            "status": n.status,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "acknowledged_at": n.acknowledged_at.isoformat() if n.acknowledged_at else None,
            "acknowledged_by": n.acknowledged_by,
            "replies": [
                {
                    "id": r.id,
                    "text": r.text,
                    "from_user": r.from_user,
                    "from_team": r.from_team,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in n.replies
            ],
        }

    return {
        "patients": [serialize_patient(p) for p in patients],
        "notifications": [serialize_notification(n) for n in notifications],
        "expires_at": report.expires_at.isoformat(),
        "created_at": report.created_at.isoformat(),
    }

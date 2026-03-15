import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    prescriber = Column(String, nullable=False)
    referral_date = Column(String)
    latest_sp_partner = Column(String)
    latest_sp_status = Column(String)
    latest_sp_substatus = Column(String)
    aging_of_status = Column(Integer, default=0)
    last_comment = Column(Text)
    latest_hub_sub_status = Column(String)
    primary_channel = Column(String)
    primary_payer = Column(String)
    primary_pbm = Column(String)
    secondary_channel = Column(String)
    territory = Column(String)
    region = Column(String)
    language = Column(String)
    hippa_consent = Column(String)
    program_type = Column(String)
    first_ship_date = Column(String)
    last_ship_date = Column(String)

    notifications = relationship("Notification", back_populates="patient")


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    team = Column(String, nullable=False)
    role = Column(String, default="partner")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    from_team = Column(String, nullable=False)
    from_user = Column(String, nullable=False)
    to_team = Column(String, nullable=False)
    comment = Column(Text, nullable=False)
    priority = Column(String, default="normal")
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime)
    acknowledged_by = Column(String)

    patient = relationship("Patient", back_populates="notifications")
    replies = relationship("NotificationReply", back_populates="notification", order_by="NotificationReply.created_at")


class NotificationReply(Base):
    __tablename__ = "notification_replies"

    id = Column(String, primary_key=True, default=gen_uuid)
    notification_id = Column(String, ForeignKey("notifications.id"), nullable=False)
    text = Column(Text, nullable=False)
    from_user = Column(String, nullable=False)
    from_team = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    notification = relationship("Notification", back_populates="replies")


class CaseNote(Base):
    __tablename__ = "case_notes"

    id = Column(String, primary_key=True, default=gen_uuid)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    user_id = Column(String, nullable=False)
    user_name = Column(String, nullable=False)
    user_team = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    follow_up_date = Column(String, nullable=True)  # ISO date YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient")

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class PatientOut(BaseModel):
    id: int
    prescriber: str
    referral_date: Optional[str]
    latest_sp_partner: Optional[str]
    latest_sp_status: Optional[str]
    latest_sp_substatus: Optional[str]
    aging_of_status: int
    last_comment: Optional[str]
    latest_hub_sub_status: Optional[str]
    primary_channel: Optional[str]
    primary_payer: Optional[str]
    primary_pbm: Optional[str]
    secondary_channel: Optional[str]
    territory: Optional[str]
    region: Optional[str]
    language: Optional[str]
    hipaa_consent: Optional[str]
    program_type: Optional[str]
    first_ship_date: Optional[str]
    last_ship_date: Optional[str]

    model_config = {"from_attributes": True}


class UserOut(BaseModel):
    id: str
    username: str
    name: str
    team: str
    role: str

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    team: str
    role: str = "partner"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    name: Optional[str] = None
    team: Optional[str] = None
    role: Optional[str] = None


class ReplyOut(BaseModel):
    id: str
    text: str
    from_user: str
    from_team: str
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationOut(BaseModel):
    id: str
    patient_id: int
    patient_name: Optional[str] = None
    from_team: str
    from_user: str
    to_team: str
    comment: str
    priority: str
    status: str
    created_at: datetime
    acknowledged_at: Optional[datetime]
    acknowledged_by: Optional[str]
    replies: list[ReplyOut] = []

    model_config = {"from_attributes": True}


class PatientCreate(BaseModel):
    prescriber: str
    referral_date: Optional[str] = None
    latest_sp_partner: Optional[str] = None
    latest_sp_status: Optional[str] = None
    latest_sp_substatus: Optional[str] = None
    aging_of_status: int = 0
    last_comment: Optional[str] = None
    latest_hub_sub_status: Optional[str] = None
    primary_channel: Optional[str] = None
    primary_payer: Optional[str] = None
    primary_pbm: Optional[str] = None
    secondary_channel: Optional[str] = None
    territory: Optional[str] = None
    region: Optional[str] = None
    language: Optional[str] = None
    hipaa_consent: Optional[str] = None
    program_type: Optional[str] = None
    first_ship_date: Optional[str] = None
    last_ship_date: Optional[str] = None


class BulkResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class PatientUpdate(BaseModel):
    prescriber: Optional[str] = None
    referral_date: Optional[str] = None
    latest_sp_partner: Optional[str] = None
    latest_sp_status: Optional[str] = None
    latest_sp_substatus: Optional[str] = None
    aging_of_status: Optional[int] = None
    last_comment: Optional[str] = None
    latest_hub_sub_status: Optional[str] = None
    primary_channel: Optional[str] = None
    primary_payer: Optional[str] = None
    primary_pbm: Optional[str] = None
    secondary_channel: Optional[str] = None
    territory: Optional[str] = None
    region: Optional[str] = None
    language: Optional[str] = None
    hipaa_consent: Optional[str] = None
    program_type: Optional[str] = None
    first_ship_date: Optional[str] = None
    last_ship_date: Optional[str] = None


class NotificationCreate(BaseModel):
    patient_id: int
    to_team: str
    comment: str
    priority: str = "normal"
    from_user: str
    from_team: str


class NotificationUpdate(BaseModel):
    status: Optional[str] = None
    acknowledged_by: Optional[str] = None


class ReplyCreate(BaseModel):
    text: str
    from_user: str
    from_team: str


class CaseNoteCreate(BaseModel):
    patient_id: int
    user_id: str
    user_name: str
    user_team: str
    text: str
    follow_up_date: Optional[str] = None


class CaseNoteUpdate(BaseModel):
    text: Optional[str] = None
    follow_up_date: Optional[str] = None
    completed_at: Optional[datetime] = None


class CaseNoteOut(BaseModel):
    id: str
    patient_id: int
    user_id: str
    user_name: str
    user_team: str
    text: str
    follow_up_date: Optional[str]
    completed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}

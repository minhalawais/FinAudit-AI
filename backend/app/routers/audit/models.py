"""
Pydantic models for audit routes
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

class AuditCreate(BaseModel):
    name: str
    description: str
    scope: str
    audit_type: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    estimated_budget: Optional[float] = None
    selected_auditors: List[dict] = []
    requirements: List[dict] = []
    risk_categories: List[dict] = []

class FinancialAuditCreate(BaseModel):
    name: str
    description: str
    financial_audit_type: str
    scope: str
    start_date: datetime
    end_date: datetime
    deadline: datetime
    materiality_threshold: Optional[float] = 50000
    estimated_budget: Optional[float] = None
    audit_methodology: str = "risk_based"
    compliance_frameworks: List[str] = []
    industry_type: Optional[str] = None
    template_id: Optional[int] = None
    auditor_emails: List[str] = []
    
    @validator('end_date')
    def end_date_after_start(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('End date must be after start date')
        return v
    
    @validator('deadline')
    def deadline_after_end(cls, v, values):
        if 'end_date' in values and v <= values['end_date']:
            raise ValueError('Deadline must be after end date')
        return v
    
    @validator('estimated_budget')
    def budget_validation(cls, v, values):
        if v and 'materiality_threshold' in values:
            threshold = values['materiality_threshold']
            if v < threshold * 0.1 or v > threshold * 10:
                raise ValueError('Budget should be reasonable compared to materiality threshold')
        return v

class AuditValidationResponse(BaseModel):
    is_valid: bool
    errors: List[str]
    warnings: List[str]
    suggestions: List[str]

class AuditorAvailabilityCheck(BaseModel):
    auditor_id: int
    is_available: bool
    conflicts: List[Dict[str, Any]]
    current_workload: int
    max_capacity: int

class AIRiskAssessmentResponse(BaseModel):
    risk_categories: List[dict]
    suggested_documents: List[dict]
    focus_areas: List[str]
    overall_risk_score: float

class AuditUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    estimated_budget: Optional[float] = None

class RequirementCreate(BaseModel):
    document_type: str
    required_fields: dict = {}
    validation_rules: dict = {}
    deadline: Optional[datetime] = None
    is_mandatory: bool = True
    auto_escalate: bool = False

class FindingCreate(BaseModel):
    title: str
    description: str
    severity: str
    recommendation: str
    due_date: Optional[datetime] = None
    estimated_impact: Optional[str] = None
    likelihood: Optional[str] = None

class FindingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    recommendation: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None

class ActionItemCreate(BaseModel):
    description: str
    assigned_to: int
    due_date: Optional[datetime] = None


class MeetingAgendaItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    time_allocation: Optional[int] = 10
    order_index: Optional[int] = 0

class MeetingCreate(BaseModel):
    title: str
    meeting_type: str
    scheduled_time: datetime
    duration_minutes: Optional[int] = 60
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    meeting_objectives: Optional[str] = None
    is_recurring: Optional[bool] = False
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    preparation_checklist: Optional[List[str]] = None
    attendee_emails: List[str] = []
    agenda_items: List[MeetingAgendaItemCreate] = []

class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    meeting_type: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    meeting_objectives: Optional[str] = None
    meeting_outcomes: Optional[str] = None
    status: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    preparation_checklist: Optional[List[str]] = None
    attendee_emails: Optional[List[str]] = None
    agenda_items: Optional[List[MeetingAgendaItemCreate]] = None

# New Pydantic model for meeting completion data
class MeetingCompletionData(BaseModel):
    meeting_outcomes: Optional[str] = None
    notes: Optional[str] = None
    recording_url: Optional[str] = None
class AuditorInviteRequest(BaseModel):
    email: str
    role: str = "auditor"
    message: str = ""

class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"

class ReportCreate(BaseModel):
    title: str
    executive_summary: str
    sections: dict

class ReportUpdate(BaseModel):
    title: Optional[str] = None
    executive_summary: Optional[str] = None
    sections: Optional[dict] = None
    status: Optional[str] = None

class DocumentSubmissionRequest(BaseModel):
    requirement_id: int
    notes: Optional[str] = None

class DocumentVerificationRequest(BaseModel):
    status: str  # approved, rejected, needs_revision
    notes: str
    quality_score: Optional[float] = None

class RequirementEscalationRequest(BaseModel):
    escalation_type: str
    reason: str
    escalated_to_id: int

class RequirementCreate(BaseModel):
    document_type: str
    required_fields: Optional[Dict] = None
    validation_rules: Optional[Dict] = None
    deadline: datetime
    is_mandatory: bool
    auto_escalate: bool

class DocumentVerificationRequest(BaseModel):
    status: str
    notes: str
    quality_score: Optional[float] = None

class RequirementEscalationRequest(BaseModel):
    escalated_to_id: int
    reason: str
    escalation_type: str

class AuditUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    deadline: Optional[datetime] = None
    estimated_budget: Optional[float] = None
    actual_cost: Optional[float] = None
    scope: Optional[str] = None

class FinancialAuditCreate(BaseModel):
    name: str
    description: str
    financial_audit_type: str
    scope: str
    start_date: datetime
    end_date: datetime
    deadline: datetime
    materiality_threshold: float
    estimated_budget: Optional[float] = None
    audit_methodology: str
    compliance_frameworks: Optional[List[str]] = None
    industry_type: str
    template_id: Optional[int] = None
    auditor_emails: Optional[List[str]] = None
class AuditorResponse(BaseModel):
    id: int
    name: str
    email: str
    specializations: List[str]
    rating: float
    completed_audits: int
    current_assignments: int
    last_active: Optional[str]
    status: str

class AuditorsListResponse(BaseModel):
    auditors: List[AuditorResponse]


# Add these to your existing models.py file

class MeetingCreate(BaseModel):
    title: str
    meeting_type: str
    scheduled_time: datetime
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    meeting_objectives: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None
    recurrence_end_date: Optional[datetime] = None
    preparation_checklist: Optional[List[Dict[str, Any]]] = None
    attendee_emails: List[str] = []
    agenda_items: List[Dict[str, Any]] = []

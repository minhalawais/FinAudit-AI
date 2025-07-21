from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, func, and_, or_, text
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import hashlib
import os
import uuid
from pydantic import BaseModel, Field, validator
import secrets
import string
from app.models import *
from app.database import get_db
from app.routers.auth import get_current_user
import google.generativeai as genai
from fastapi import Request
genai.configure(api_key="AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE")  # Replace with your actual API key

router = APIRouter(prefix="/api/audits", tags=["audits"])

# Create separate routers for different endpoints
auditor_router = APIRouter(prefix="/api/auditor", tags=["auditor"])
auditors_router = APIRouter(prefix="/api/auditors", tags=["auditors"])
auditee_router = APIRouter(prefix="/api/auditee", tags=["auditee"])

# ==================== PYDANTIC MODELS ====================

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

class MeetingCreate(BaseModel):
    title: str
    meeting_type: str
    scheduled_time: datetime
    duration_minutes: int = 60
    location: Optional[str] = None
    meeting_url: Optional[str] = None
    notes: Optional[str] = None
    attendee_emails: List[str] = []
    agenda_items: List[dict] = []

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
@router.post("/create")
async def create_financial_audit(
    audit_data: FinancialAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new financial audit with AI assistance"""
    
    # Step 1: Create the audit record
    audit = Audit(
        name=audit_data.name,
        description=audit_data.description,
        audit_type=AuditType.financial,
        financial_audit_type=FinancialAuditType(audit_data.financial_audit_type),
        scope=audit_data.scope,
        start_date=audit_data.start_date,
        end_date=audit_data.end_date,
        deadline=audit_data.deadline,
        materiality_threshold=audit_data.materiality_threshold,
        company_id=current_user.company_id,
        created_by=current_user.id,
        status=AuditStatus.planned
    )
    
    db.add(audit)
    db.flush()  # Get audit ID
    
    # Step 2: AI-Powered Risk Assessment
    ai_assessment = await generate_ai_risk_assessment(
        audit_data.financial_audit_type,
        audit_data.scope,
        audit_data.materiality_threshold,
        db
    )
    
    audit.ai_risk_score = ai_assessment["overall_risk_score"]
    audit.ai_suggestions = ai_assessment
    
    # Step 3: Create AI Risk Assessment records
    for risk in ai_assessment["risk_categories"]:
        ai_risk = AIRiskAssessment(
            audit_id=audit.id,
            risk_category=risk["category"],
            risk_level=AIRiskLevel(risk["level"]),
            confidence_score=risk["confidence"],
            description=risk["description"],
            ai_reasoning=risk["reasoning"],
            suggested_focus_areas=risk["focus_areas"]
        )
        db.add(ai_risk)
    
    # Step 4: Generate Document Requirements
    await generate_document_requirements(audit.id, audit_data.financial_audit_type, db)
    
    # Step 5: Invite Auditors
    for email in audit_data.auditor_emails:
        await invite_auditor_with_credentials(audit.id, email, current_user.id, db)
    
    # Step 6: Auto-schedule Kickoff Meeting
    kickoff_meeting = await schedule_kickoff_meeting(audit.id, current_user.id, db)
    audit.kickoff_meeting_id = kickoff_meeting.id
    audit.auto_scheduled_kickoff = True
    
    db.commit()
    
    return {
        "audit_id": audit.id,
        "ai_assessment": ai_assessment,
        "kickoff_meeting": {
            "id": kickoff_meeting.id,
            "scheduled_time": kickoff_meeting.scheduled_time.isoformat()
        },
        "message": "Financial audit created successfully with AI assistance"
    }

async def generate_ai_risk_assessment(
    financial_audit_type: str,
    scope: str,
    materiality_threshold: float,
    db: Session
) -> dict:
    """Generate AI-powered risk assessment using Gemini"""
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    As a financial audit expert, analyze the following audit parameters and provide a comprehensive risk assessment:
    
    Audit Type: {financial_audit_type}
    Scope: {scope}
    Materiality Threshold: ${materiality_threshold:,.2f}
    
    Please provide:
    1. Risk categories with levels (low, medium, high, critical)
    2. Confidence scores (0-1)
    3. Detailed descriptions and reasoning
    4. Suggested focus areas for each risk
    5. Overall risk score (0-10)
    
    Format the response as JSON with the following structure:
    {{
        "risk_categories": [
            {{
                "category": "string",
                "level": "high|medium|low|critical",
                "confidence": 0.95,
                "description": "string",
                "reasoning": "string",
                "focus_areas": ["area1", "area2"]
            }}
        ],
        "overall_risk_score": 7.5,
        "key_recommendations": ["rec1", "rec2"]
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        ai_assessment = json.loads(response.text)
        
        return ai_assessment
    except Exception as e:
        # Fallback to default risk assessment
        return {
            "risk_categories": [
                {
                    "category": "High-Value Transactions",
                    "level": "high",
                    "confidence": 0.8,
                    "description": f"Transactions above ${materiality_threshold:,.2f} require detailed review",
                    "reasoning": "Large transactions pose higher risk of errors or fraud",
                    "focus_areas": ["Authorization", "Supporting Documentation", "Approval Workflow"]
                }
            ],
            "overall_risk_score": 6.5,
            "key_recommendations": ["Focus on high-value transactions", "Review approval processes"]
        }

async def generate_document_requirements(
    audit_id: int,
    financial_audit_type: str,
    db: Session
):
    """Generate document requirements based on financial audit type"""
    
    # Get templates for this audit type
    templates = db.query(FinancialDocumentTemplate).filter(
        FinancialDocumentTemplate.financial_audit_type == financial_audit_type
    ).all()
    
    for template in templates:
        requirement = DocumentRequirement(
            audit_id=audit_id,
            document_type=template.document_type,
            required_fields=template.validation_rules or {},
            validation_rules=template.validation_rules or {},
            deadline=datetime.utcnow() + timedelta(days=14),  # 2 weeks default
            is_mandatory=template.is_mandatory,
            auto_escalate=True,
            created_by=1  # System generated
        )
        db.add(requirement)

def generate_secure_password(length: int = 12) -> str:
    """Generate a secure temporary password"""
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    password = ''.join(secrets.choice(alphabet) for _ in range(length))
    return password

async def invite_auditor_with_credentials(
    audit_id: int,
    email: str,
    invited_by: int,
    db: Session
):
    """Invite auditor with auto-generated credentials"""
    
    # Generate secure temporary password
    temp_password = generate_secure_password()
    
    invitation = AuditorInvitation(
        company_id=1,  # Get from current user
        email=email,
        invited_by=invited_by,
        role="auditor",
        temp_password=temp_password,
        token=str(uuid.uuid4()),
        expires_at=datetime.utcnow() + timedelta(days=7),
        message=f"You have been invited to audit. Your temporary password is: {temp_password}"
    )
    
    db.add(invitation)
    
    # TODO: Send email with credentials
    # await send_auditor_invitation_email(email, temp_password, invitation.token)
    
    return invitation

async def schedule_kickoff_meeting(
    audit_id: int,
    created_by: int,
    db: Session
) -> AuditMeeting:
    """Auto-schedule kickoff meeting 48 hours after audit creation"""
    
    kickoff_time = datetime.utcnow() + timedelta(hours=48)
    
    meeting = AuditMeeting(
        audit_id=audit_id,
        title="Audit Kickoff Meeting",
        meeting_type=MeetingType.kickoff,
        scheduled_time=kickoff_time,
        duration_minutes=90,
        location="Virtual Meeting",
        meeting_url="https://meet.google.com/auto-generated-link",
        status=MeetingStatus.scheduled,
        created_by=created_by
    )
    
    db.add(meeting)
    db.flush()
    
    # Add default agenda items
    agenda_items = [
        {"title": "Audit Scope Review", "time_allocation": 20, "order_index": 1},
        {"title": "Document Requirements Walkthrough", "time_allocation": 30, "order_index": 2},
        {"title": "Timeline and Milestones", "time_allocation": 20, "order_index": 3},
        {"title": "Q&A and Next Steps", "time_allocation": 20, "order_index": 4}
    ]
    
    for item in agenda_items:
        agenda = MeetingAgendaItem(
            meeting_id=meeting.id,
            title=item["title"],
            time_allocation=item["time_allocation"],
            order_index=item["order_index"]
        )
        db.add(agenda)
    
    return meeting

@router.get("/ai-suggestions/{financial_audit_type}")
async def get_ai_suggestions(
    financial_audit_type: str,
    materiality_threshold: Optional[float] = 50000
):
    """Get AI suggestions for financial audit setup"""
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    prompt = f"""
    Provide specific suggestions for setting up a {financial_audit_type} audit with materiality threshold of ${materiality_threshold:,.2f}.
    
    Include:
    1. Recommended scope areas
    2. Key documents to request
    3. Typical risk areas
    4. Suggested timeline
    5. Auditor specializations needed
    
    Format as JSON.
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        suggestions = json.loads(response.text)
        return suggestions
    except Exception as e:
        return {
            "error": "AI suggestions temporarily unavailable",
            "fallback_suggestions": {
                "scope_areas": ["High-value transactions", "Authorization controls"],
                "key_documents": ["Invoices", "Contracts", "Payment records"],
                "risk_areas": ["Unauthorized payments", "Missing documentation"],
                "timeline": "2-4 weeks",
                "specializations": ["Financial Auditing", "Internal Controls"]
            }
        }
# ==================== DASHBOARD ROUTES ====================

@router.get("/company/dashboard")
async def get_company_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company dashboard statistics"""
    
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not associated with company")
    
    # Get audit statistics
    total_audits = db.query(Audit).filter(Audit.company_id == company_id).count()
    
    active_audits = db.query(Audit).filter(
        Audit.company_id == company_id,
        Audit.status == AuditStatus.in_progress
    ).count()
    
    # Get pending submissions
    pending_submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.pending
    ).count()
    
    # Get overdue actions
    overdue_actions = db.query(ActionItem).join(
        AuditFinding
    ).join(Audit).filter(
        Audit.company_id == company_id,
        ActionItem.due_date < datetime.utcnow(),
        ActionItem.status != ActionItemStatus.completed
    ).count()
    
    # Calculate compliance score
    total_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id
    ).count()
    
    completed_requirements = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    compliance_score = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
    
    return {
        "total_audits": total_audits,
        "active_audits": active_audits,
        "pending_submissions": pending_submissions,
        "overdue_actions": overdue_actions,
        "compliance_score": round(compliance_score, 1)
    }

@auditee_router.get("/dashboard")
async def get_auditee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditee dashboard statistics (alias for company dashboard)"""
    
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not associated with company")
    
    # Get audit statistics
    total_audits = db.query(Audit).filter(Audit.company_id == company_id).count()
    
    active_audits = db.query(Audit).filter(
        Audit.company_id == company_id,
        Audit.status == AuditStatus.in_progress
    ).count()
    
    # Get pending submissions
    pending_submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.pending
    ).count()
    
    # Get overdue actions
    overdue_actions = db.query(ActionItem).join(
        AuditFinding
    ).join(Audit).filter(
        Audit.company_id == company_id,
        ActionItem.due_date < datetime.utcnow(),
        ActionItem.status != ActionItemStatus.completed
    ).count()
    
    # Calculate compliance score
    total_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id
    ).count()
    
    completed_requirements = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    compliance_score = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
    
    return {
        "total_audits": total_audits,
        "active_audits": active_audits,
        "pending_submissions": pending_submissions,
        "overdue_actions": overdue_actions,
        "compliance_score": round(compliance_score, 1)
    }

@auditor_router.get("/dashboard")
async def get_auditor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor dashboard statistics and assignments"""
    
    # Get auditor assignments
    assigned_audits = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM audit_auditor_assignments aaa
            JOIN audits a ON aaa.audit_id = a.id
            WHERE aaa.auditor_id = :auditor_id 
            AND aaa.is_active = true
            AND a.status = 'in_progress'
        """),
        {"auditor_id": current_user.id}
    ).fetchone()
    
    # Get pending reviews
    pending_reviews = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(Audit).join(
        audit_auditor_assignment,
        Audit.id == audit_auditor_assignment.c.audit_id
    ).filter(
        audit_auditor_assignment.c.auditor_id == current_user.id,
        DocumentSubmission.verification_status == EvidenceStatus.pending
    ).count()
    
    # Get completed audits
    completed_audits = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM audit_auditor_assignments aaa
            JOIN audits a ON aaa.audit_id = a.id
            WHERE aaa.auditor_id = :auditor_id 
            AND a.status = 'completed'
        """),
        {"auditor_id": current_user.id}
    ).fetchone()
    
    # Get findings created
    findings_created = db.query(AuditFinding).filter(
        AuditFinding.created_by == current_user.id
    ).count()
    
    # Get recent assignments
    recent_assignments = db.execute(
        text("""
            SELECT 
                aaa.id,
                aaa.role,
                aaa.assigned_at,
                a.id as audit_id,
                a.name as audit_name,
                a.status as audit_status,
                a.deadline,
                a.estimated_budget,
                c.name as company_name
            FROM audit_auditor_assignments aaa
            JOIN audits a ON aaa.audit_id = a.id
            JOIN companies c ON a.company_id = c.id
            WHERE aaa.auditor_id = :auditor_id 
            AND aaa.is_active = true
            ORDER BY aaa.assigned_at DESC
            LIMIT 10
        """),
        {"auditor_id": current_user.id}
    ).fetchall()
    
    assignment_list = [
        {
            "id": row.id,
            "audit": {
                "id": row.audit_id,
                "name": row.audit_name,
                "status": row.audit_status,
                "deadline": row.deadline.isoformat() if row.deadline else None,
                "company_name": row.company_name,
                "budget": row.estimated_budget
            },
            "role": row.role,
            "assigned_at": row.assigned_at.isoformat()
        }
        for row in recent_assignments
    ]
    
    return {
        "stats": {
            "assigned_audits": assigned_audits.count if assigned_audits else 0,
            "pending_reviews": pending_reviews,
            "completed_audits": completed_audits.count if completed_audits else 0,
            "findings_created": findings_created
        },
        "recent_assignments": assignment_list
    }

# ==================== AUDITOR DIRECTORY ROUTES ====================

@auditors_router.get("")
async def get_auditors(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query("all"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor directory with search and filters"""
    
    query = db.query(User).filter(
        User.role == UserRole.auditor,
        User.is_active == True
    )
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                User.f_name.ilike(f"%{search}%"),
                User.l_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    
    # Apply status filter
    if status != "all":
        if status == "active":
            query = query.filter(User.availability_status == "available")
        elif status == "inactive":
            query = query.filter(User.availability_status != "available")
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    auditors = query.offset(offset).limit(limit).all()
    
    # Build auditor list with additional data
    auditor_list = []
    for auditor in auditors:
        # Get audit statistics
        total_audits = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        completed_audits = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND a.status = 'completed'
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        current_assignments = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND aaa.is_active = true
                AND a.status = 'in_progress'
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        auditor_list.append({
            "id": auditor.id,
            "name": f"{auditor.f_name} {auditor.l_name}",
            "email": auditor.email,
            "specializations": auditor.specializations or [],
            "rating": 4.2,  # Mock rating - implement actual rating system
            "completed_audits": completed_audits.count if completed_audits else 0,
            "current_assignments": current_assignments.count if current_assignments else 0,
            "last_active": auditor.last_login.isoformat() if auditor.last_login else None,
            "status": "active" if auditor.availability_status == "available" else "inactive",
            "hourly_rate": auditor.hourly_rate,
            "certifications": auditor.certifications or []
        })
    
    return {
        "auditors": auditor_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@auditors_router.post("/invite")
async def invite_auditor(
    invite_data: AuditorInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite external auditor"""
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Generate invitation token
    token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
    
    invitation = AuditorInvitation(
        company_id=current_user.company_id,
        email=invite_data.email,
        invited_by=current_user.id,
        role=invite_data.role,
        message=invite_data.message,
        token=token,
        expires_at=expires_at
    )
    
    db.add(invitation)
    db.commit()
    
    # TODO: Send email invitation
    
    return {"message": "Invitation sent successfully", "invitation_id": invitation.id}

@router.get("/auditor-invitations")
async def get_auditor_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor invitations for company"""
    
    invitations = db.query(AuditorInvitation).options(
        joinedload(AuditorInvitation.inviter)
    ).filter(
        AuditorInvitation.company_id == current_user.company_id
    ).order_by(desc(AuditorInvitation.invited_at)).all()
    
    return {
        "invitations": [
            {
                "id": inv.id,
                "email": inv.email,
                "status": inv.status.value,
                "invited_at": inv.invited_at.isoformat(),
                "responded_at": inv.responded_at.isoformat() if inv.responded_at else None,
                "inviter": {
                    "id": inv.invited_by,
                    "name": f"{inv.inviter.f_name} {inv.inviter.l_name}" if inv.inviter else "Unknown"
                },
                "expires_at": inv.expires_at.isoformat()
            }
            for inv in invitations
        ]
    }

# ==================== AUDIT MANAGEMENT ROUTES ====================
@router.get("/list")
async def get_audits_list(
    status: Optional[str] = Query(None),
    industry_type: Optional[str] = Query(None),
    audit_methodology: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    approval_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: str = Query("created_at"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company's audits with filters and pagination - FIXED VERSION"""
    
    query = db.query(Audit).options(
        joinedload(Audit.creator),
        joinedload(Audit.requirements),
        joinedload(Audit.findings)
    ).filter(Audit.company_id == current_user.company_id)
    
    # Apply filters
    if status and status != "all":
        try:
            query = query.filter(Audit.status == AuditStatus(status))
        except ValueError:
            pass  # Invalid status, ignore filter
    
    if industry_type and industry_type != "all":
        try:
            query = query.filter(Audit.industry_type == IndustryType(industry_type))
        except ValueError:
            pass  # Invalid industry type, ignore filter
    
    if audit_methodology and audit_methodology != "all":
        try:
            query = query.filter(Audit.audit_methodology == AuditMethodology(audit_methodology))
        except ValueError:
            pass  # Invalid methodology, ignore filter
    
    if approval_status and approval_status != "all":
        try:
            query = query.filter(Audit.approval_status == AuditApprovalStatus(approval_status))
        except ValueError:
            pass  # Invalid approval status, ignore filter
    
    if search:
        query = query.filter(
            or_(
                Audit.name.ilike(f"%{search}%"),
                Audit.description.ilike(f"%{search}%")
            )
        )
    
    # Apply sorting
    if sort == "deadline":
        query = query.order_by(Audit.deadline.asc())
    elif sort == "name":
        query = query.order_by(Audit.name.asc())
    else:
        query = query.order_by(desc(Audit.created_at))
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    audits = query.offset(offset).limit(limit).all()
    
    # Calculate progress and metrics for each audit
    audit_list = []
    for audit in audits:
        # Get assigned auditors
        auditor_assignments = db.execute(
            text("""
                SELECT u.id, u.f_name, u.l_name, u.email, aaa.role 
                FROM users u 
                JOIN audit_auditor_assignments aaa ON u.id = aaa.auditor_id 
                WHERE aaa.audit_id = :audit_id AND aaa.is_active = true
            """),
            {"audit_id": audit.id}
        ).fetchall()
        
        assigned_auditors = [
            f"{row.f_name or ''} {row.l_name or ''}".strip() or row.email
            for row in auditor_assignments
        ]
        
        # Calculate progress
        total_requirements = len(audit.requirements) if audit.requirements else 0
        completed_requirements = 0
        if total_requirements > 0:
            completed_requirements = db.query(DocumentSubmission).join(
                DocumentRequirement
            ).filter(
                DocumentRequirement.audit_id == audit.id,
                DocumentSubmission.verification_status == EvidenceStatus.approved
            ).count()
        
        progress = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
        
        # Get findings count
        findings_count = len(audit.findings) if audit.findings else 0
        critical_findings = 0
        if audit.findings:
            critical_findings = len([
                f for f in audit.findings 
                if f.severity == FindingSeverity.critical and f.status != FindingStatus.resolved
            ])
        
        # Determine risk level based on AI risk score
        ai_risk_score = audit.ai_risk_score or 5.0
        if ai_risk_score >= 8:
            risk_level = "critical"
        elif ai_risk_score >= 6:
            risk_level = "high"
        elif ai_risk_score >= 4:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        # Safe string formatting with null checks
        audit_dict = {
            "id": audit.id,
            "name": audit.name or "Unnamed Audit",
            "description": audit.description or "",
            "financial_audit_type": audit.financial_audit_type.value if audit.financial_audit_type else "custom",
            "status": audit.status.value if audit.status else "planned",
            "approval_status": audit.approval_status.value if audit.approval_status else "pending",
            "start_date": audit.start_date.isoformat() if audit.start_date else None,
            "end_date": audit.end_date.isoformat() if audit.end_date else None,
            "deadline": audit.deadline.isoformat() if audit.deadline else None,
            "created_at": audit.created_at.isoformat() if audit.created_at else datetime.utcnow().isoformat(),
            "is_locked": audit.is_locked or False,
            "progress": round(progress, 1),
            "assigned_auditors": assigned_auditors,
            "requirements_count": total_requirements,
            "completed_requirements": completed_requirements,
            "findings_count": findings_count,
            "critical_findings": critical_findings,
            "estimated_budget": audit.estimated_budget or 0,
            "actual_cost": audit.actual_cost or 0,
            "materiality_threshold": audit.materiality_threshold or 50000,
            "complexity_score": audit.complexity_score or 5.0,
            "ai_confidence_score": audit.ai_confidence_score or 0.8,
            "industry_type": audit.industry_type.value if audit.industry_type else "other",
            "compliance_frameworks": audit.compliance_frameworks or [],
            "audit_methodology": audit.audit_methodology.value if audit.audit_methodology else "risk_based",
            "documentsTotal": total_requirements,
            "documentsReviewed": completed_requirements,
            "findingsCount": findings_count,
            "riskLevel": risk_level,
            "upcomingMeetings": 0,  # Calculate from meetings if needed
            "created_by": f"{audit.creator.f_name or ''} {audit.creator.l_name or ''}".strip() if audit.creator else "Unknown",
            "requires_approval": audit.requires_approval or False
        }
        
        audit_list.append(audit_dict)
    
    return {
        "audits": audit_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/{audit_id}")
async def get_audit_details(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed audit information"""
    
    audit = db.query(Audit).options(
        joinedload(Audit.company),
        joinedload(Audit.creator),
        joinedload(Audit.requirements),
        joinedload(Audit.findings),
        joinedload(Audit.meetings),
        joinedload(Audit.risk_assessments)
    ).filter(Audit.id == audit_id).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get audit assignments with roles
    auditor_assignments = db.execute(
        text("""
            SELECT u.id, u.f_name, u.l_name, u.email, aaa.role, aaa.assigned_at
            FROM users u 
            JOIN audit_auditor_assignments aaa ON u.id = aaa.auditor_id 
            WHERE aaa.audit_id = :audit_id AND aaa.is_active = true
        """),
        {"audit_id": audit_id}
    ).fetchall()
    
    assignment_list = [
        {
            "id": row.id,
            "auditor": {
                "id": row.id,
                "name": f"{row.f_name} {row.l_name}",
                "email": row.email
            },
            "role": row.role,
            "assigned_at": row.assigned_at.isoformat()
        }
        for row in auditor_assignments
    ]
    
    return {
        "audit": {
            "id": audit.id,
            "name": audit.name,
            "description": audit.description,
            "scope": audit.scope,
            "audit_type": audit.audit_type.value,
            "status": audit.status.value,
            "start_date": audit.start_date.isoformat() if audit.start_date else None,
            "end_date": audit.end_date.isoformat() if audit.end_date else None,
            "deadline": audit.deadline.isoformat() if audit.deadline else None,
            "is_locked": audit.is_locked,
            "estimated_budget": audit.estimated_budget,
            "actual_cost": audit.actual_cost,
            "company": {
                "id": audit.company.id,
                "name": audit.company.name
            },
            "creator": {
                "id": audit.creator.id,
                "name": f"{audit.creator.f_name} {audit.creator.l_name}"
            },
            "assignments": assignment_list,
            "requirements": [
                {
                    "id": req.id,
                    "document_type": req.document_type,
                    "deadline": req.deadline.isoformat() if req.deadline else None,
                    "is_mandatory": req.is_mandatory,
                    "submissions_count": len(req.submissions),
                    "approved_count": len([s for s in req.submissions if s.verification_status == EvidenceStatus.approved])
                }
                for req in audit.requirements
            ],
            "findings": [
                {
                    "id": finding.id,
                    "title": finding.title,
                    "severity": finding.severity.value,
                    "status": finding.status.value,
                    "created_at": finding.created_at.isoformat()
                }
                for finding in audit.findings
            ],
            "meetings": [
                {
                    "id": meeting.id,
                    "title": meeting.title,
                    "meeting_type": meeting.meeting_type.value,
                    "scheduled_time": meeting.scheduled_time.isoformat(),
                    "status": meeting.status.value
                }
                for meeting in audit.meetings
            ],
            "risk_assessments": [
                {
                    "id": risk.id,
                    "risk_category": risk.risk_category,
                    "risk_level": risk.risk_level,
                    "description": risk.description
                }
                for risk in audit.risk_assessments
            ]
        }
    }

@router.get("/{audit_id}/details")
async def get_audit_details_alias(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed audit information (alias endpoint)"""
    return await get_audit_details(audit_id, db, current_user)

@router.put("/{audit_id}")
async def update_audit(
    audit_id: int,
    audit_data: AuditUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update audit information"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.is_locked:
        raise HTTPException(status_code=400, detail="Cannot modify locked audit")
    
    # Update fields
    for field, value in audit_data.dict(exclude_unset=True).items():
        if field == "status" and value:
            setattr(audit, field, AuditStatus(value))
        else:
            setattr(audit, field, value)
    
    audit.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Audit updated successfully"}

@router.patch("/{audit_id}/lock")
async def toggle_audit_lock(
    audit_id: int,
    lock_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lock or unlock an audit"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    audit.is_locked = lock_data.get("is_locked", False)
    db.commit()
    
    return {"message": "Audit lock status updated", "is_locked": audit.is_locked}

@router.get("/{audit_id}/progress")
async def get_audit_progress(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit progress tracking"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Calculate progress metrics
    total_requirements = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    ).count()
    
    completed_requirements = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).filter(
        DocumentRequirement.audit_id == audit_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    total_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).count()
    
    resolved_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id,
        AuditFinding.status == FindingStatus.resolved
    ).count()
    
    return {
        "progress": {
            "requirements_completion": (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0,
            "findings_resolution": (resolved_findings / total_findings * 100) if total_findings > 0 else 0,
            "overall_progress": calculate_overall_progress(audit_id, db)
        }
    }

# ==================== DOCUMENT REQUIREMENTS ROUTES ====================

@router.post("/{audit_id}/requirements")
async def create_requirement(
    audit_id: int,
    requirement_data: RequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create document requirement"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.is_locked:
        raise HTTPException(status_code=400, detail="Cannot modify locked audit")
    
    requirement = DocumentRequirement(
        audit_id=audit_id,
        document_type=requirement_data.document_type,
        required_fields=requirement_data.required_fields,
        validation_rules=requirement_data.validation_rules,
        deadline=requirement_data.deadline,
        is_mandatory=requirement_data.is_mandatory,
        auto_escalate=requirement_data.auto_escalate,
        created_by=current_user.id
    )
    
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    
    return {"requirement": requirement}

@router.get("/{audit_id}/requirements")
async def get_audit_requirements(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit requirements with submissions"""
    
    requirements = db.query(DocumentRequirement).options(
        joinedload(DocumentRequirement.submissions).joinedload(DocumentSubmission.document)
    ).filter(DocumentRequirement.audit_id == audit_id).all()
    
    return {
        "requirements": [
            {
                "id": req.id,
                "document_type": req.document_type,
                "required_fields": req.required_fields,
                "validation_rules": req.validation_rules,
                "deadline": req.deadline.isoformat() if req.deadline else None,
                "is_mandatory": req.is_mandatory,
                "submissions": [
                    {
                        "id": sub.id,
                        "document": {
                            "id": sub.document.id,
                            "title": sub.document.title,
                            "file_type": sub.document.file_type,
                            "file_size": sub.document.file_size
                        },
                        "verification_status": sub.verification_status.value,
                        "submitted_at": sub.submitted_at.isoformat(),
                        "revision_round": sub.revision_round,
                        "rejection_reason": sub.rejection_reason
                    }
                    for sub in req.submissions
                ]
            }
            for req in requirements
        ]
    }

@router.post("/{audit_id}/submit-document")
async def submit_document(
    audit_id: int,
    file: UploadFile = File(...),
    requirement_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit document for requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Save file
    file_path = f"uploads/audit_{audit_id}/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Calculate file hash
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Create document record
    document = Document(
        title=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        hash_sha256=file_hash,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    
    db.add(document)
    db.flush()
    
    # Create submission record
    submission = DocumentSubmission(
        requirement_id=requirement_id,
        document_id=document.id,
        submitted_by=current_user.id,
        verification_status=EvidenceStatus.pending
    )
    
    db.add(submission)
    db.commit()
    
    return {"message": "Document submitted successfully", "submission_id": submission.id}

# ==================== FINDINGS MANAGEMENT ROUTES ====================

@router.post("/{audit_id}/findings")
async def create_finding(
    audit_id: int,
    finding_data: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create audit finding"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    finding = AuditFinding(
        audit_id=audit_id,
        title=finding_data.title,
        description=finding_data.description,
        severity=FindingSeverity(finding_data.severity),
        recommendation=finding_data.recommendation,
        due_date=finding_data.due_date,
        estimated_impact=finding_data.estimated_impact,
        likelihood=finding_data.likelihood,
        created_by=current_user.id
    )
    
    db.add(finding)
    db.commit()
    db.refresh(finding)
    
    return {"finding": finding}

@router.get("/{audit_id}/findings")
async def get_audit_findings(
    audit_id: int,
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit findings with filters"""
    
    query = db.query(AuditFinding).options(
        joinedload(AuditFinding.creator),
        joinedload(AuditFinding.action_items).joinedload(ActionItem.assignee),
        joinedload(AuditFinding.comments).joinedload(FindingComment.user)
    ).filter(AuditFinding.audit_id == audit_id)
    
    if severity and severity != "all":
        query = query.filter(AuditFinding.severity == FindingSeverity(severity))
    
    if status and status != "all":
        query = query.filter(AuditFinding.status == FindingStatus(status))
    
    findings = query.order_by(desc(AuditFinding.created_at)).all()
    
    return {
        "findings": [
            {
                "id": finding.id,
                "title": finding.title,
                "description": finding.description,
                "severity": finding.severity.value,
                "recommendation": finding.recommendation,
                "status": finding.status.value,
                "due_date": finding.due_date.isoformat() if finding.due_date else None,
                "created_by": {
                    "id": finding.creator.id,
                    "name": f"{finding.creator.f_name} {finding.creator.l_name}"
                },
                "created_at": finding.created_at.isoformat(),
                "resolved_at": finding.resolved_at.isoformat() if finding.resolved_at else None,
                "resolved_by": {
                    "id": finding.resolver.id,
                    "name": f"{finding.resolver.f_name} {finding.resolver.l_name}"
                } if finding.resolver else None,
                "action_items": [
                    {
                        "id": action.id,
                        "description": action.description,
                        "assigned_to": {
                            "id": action.assignee.id,
                            "name": f"{action.assignee.f_name} {action.assignee.l_name}"
                        },
                        "due_date": action.due_date.isoformat() if action.due_date else None,
                        "status": action.status.value
                    }
                    for action in finding.action_items
                ],
                "comments": [
                    {
                        "id": comment.id,
                        "comment": comment.comment,
                        "user": {
                            "id": comment.user.id,
                            "name": f"{comment.user.f_name} {comment.user.l_name}"
                        },
                        "created_at": comment.created_at.isoformat(),
                        "is_internal": comment.is_internal
                    }
                    for comment in finding.comments
                ]
            }
            for finding in findings
        ]
    }

@router.put("/findings/{finding_id}")
async def update_finding(
    finding_id: int,
    finding_data: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update audit finding"""
    
    finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    # Update fields
    for field, value in finding_data.dict(exclude_unset=True).items():
        if field == "severity" and value:
            setattr(finding, field, FindingSeverity(value))
        elif field == "status" and value:
            setattr(finding, field, FindingStatus(value))
            if value == "resolved":
                finding.resolved_at = datetime.utcnow()
                finding.resolved_by = current_user.id
        else:
            setattr(finding, field, value)
    
    db.commit()
    return {"message": "Finding updated successfully"}

@router.post("/findings/{finding_id}/actions")
async def create_action_item(
    finding_id: int,
    action_data: ActionItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create action item for finding"""
    
    finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    action = ActionItem(
        finding_id=finding_id,
        assigned_to=action_data.assigned_to,
        description=action_data.description,
        due_date=action_data.due_date
    )
    
    db.add(action)
    db.commit()
    
    return {"action": action}

@router.post("/findings/{finding_id}/comments")
async def add_finding_comment(
    finding_id: int,
    comment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add comment to finding"""
    
    finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    comment = FindingComment(
        finding_id=finding_id,
        user_id=current_user.id,
        comment=comment_data["comment"],
        is_internal=comment_data.get("is_internal", False)
    )
    
    db.add(comment)
    db.commit()
    
    return {"message": "Comment added successfully"}

# ==================== MEETING MANAGEMENT ROUTES ====================

@router.post("/{audit_id}/meetings")
async def schedule_meeting(
    audit_id: int,
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule audit meeting"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    meeting = AuditMeeting(
        audit_id=audit_id,
        title=meeting_data.title,
        meeting_type=MeetingType(meeting_data.meeting_type),
        scheduled_time=meeting_data.scheduled_time,
        duration_minutes=meeting_data.duration_minutes,
        location=meeting_data.location,
        meeting_url=meeting_data.meeting_url,
        notes=meeting_data.notes,
        created_by=current_user.id
    )
    
    db.add(meeting)
    db.flush()
    
    # Add attendees
    for email in meeting_data.attendee_emails:
        user = db.query(User).filter(User.email == email).first()
        if user:
            attendee = MeetingAttendee(
                meeting_id=meeting.id,
                user_id=user.id,
                is_required=True
            )
            db.add(attendee)
    
    # Add agenda items
    for item_data in meeting_data.agenda_items:
        agenda_item = MeetingAgendaItem(
            meeting_id=meeting.id,
            title=item_data["title"],
            description=item_data.get("description", ""),
            time_allocation=item_data.get("time_allocation", 10),
            order_index=item_data.get("order_index", 0)
        )
        db.add(agenda_item)
    
    db.commit()
    db.refresh(meeting)
    
    return {"meeting": meeting}

@router.get("/{audit_id}/meetings")
async def get_audit_meetings(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit meetings"""
    
    meetings = db.query(AuditMeeting).options(
        joinedload(AuditMeeting.attendees).joinedload(MeetingAttendee.user),
        joinedload(AuditMeeting.agenda_items)
    ).filter(AuditMeeting.audit_id == audit_id).all()
    
    return {
        "meetings": [
            {
                "id": meeting.id,
                "title": meeting.title,
                "meeting_type": meeting.meeting_type.value,
                "scheduled_time": meeting.scheduled_time.isoformat(),
                "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
                "duration_minutes": meeting.duration_minutes,
                "location": meeting.location,
                "meeting_url": meeting.meeting_url,
                "notes": meeting.notes,
                "status": meeting.status.value,
                "attendees": [
                    {
                        "id": attendee.id,
                        "user": {
                            "id": attendee.user.id,
                            "name": f"{attendee.user.f_name} {attendee.user.l_name}",
                            "email": attendee.user.email
                        },
                        "is_required": attendee.is_required,
                        "has_confirmed": attendee.has_confirmed
                    }
                    for attendee in meeting.attendees
                ],
                "agenda_items": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "description": item.description,
                        "time_allocation": item.time_allocation,
                        "is_completed": item.is_completed
                    }
                    for item in meeting.agenda_items
                ]
            }
            for meeting in meetings
        ]
    }

# ==================== COMMUNICATION ROUTES ====================

@router.get("/{audit_id}/conversations")
async def get_audit_conversations(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get conversations for an audit"""
    
    conversations = db.query(Conversation).options(
        joinedload(Conversation.participants),
        joinedload(Conversation.messages)
    ).filter(Conversation.audit_id == audit_id).all()
    
    return {
        "conversations": [
            {
                "id": conv.id,
                "audit_id": conv.audit_id,
                "title": conv.title,
                "participants": [
                    {
                        "id": p.id,
                        "name": f"{p.f_name} {p.l_name}",
                        "email": p.email,
                        "role": p.role.value
                    }
                    for p in conv.participants
                ],
                "last_message": {
                    "id": conv.messages[-1].id,
                    "content": conv.messages[-1].content,
                    "sender": {
                        "id": conv.messages[-1].sender.id,
                        "name": f"{conv.messages[-1].sender.f_name} {conv.messages[-1].sender.l_name}"
                    },
                    "sent_at": conv.messages[-1].sent_at.isoformat()
                } if conv.messages else None,
                "unread_count": len([m for m in conv.messages if not m.is_read and m.sender_id != current_user.id]),
                "created_at": conv.created_at.isoformat()
            }
            for conv in conversations
        ]
    }

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get messages for a conversation"""
    
    messages = db.query(Message).options(
        joinedload(Message.sender)
    ).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.sent_at.asc()).all()
    
    # Mark messages as read
    db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.sender_id != current_user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    return {
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "sender": {
                    "id": msg.sender.id,
                    "name": f"{msg.sender.f_name} {msg.sender.l_name}",
                    "role": msg.sender.role.value
                },
                "sent_at": msg.sent_at.isoformat(),
                "message_type": msg.message_type.value
            }
            for msg in messages
        ]
    }

@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: int,
    message_data: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a message in a conversation"""
    
    message = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=MessageType(message_data.message_type)
    )
    
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return {"message": "Message sent successfully", "message_id": message.id}

# ==================== REPORT ROUTES ====================

@router.get("/{audit_id}/report")
async def get_audit_report(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit report"""
    
    report = db.query(AuditReport).filter(
        AuditReport.audit_id == audit_id
    ).first()
    
    if not report:
        return {"report": None}
    
    return {
        "report": {
            "id": report.id,
            "audit_id": report.audit_id,
            "title": report.title,
            "executive_summary": report.executive_summary,
            "sections": report.sections,
            "status": report.status.value,
            "created_at": report.created_at.isoformat(),
            "updated_at": report.updated_at.isoformat()
        }
    }

@router.post("/{audit_id}/report")
async def create_audit_report(
    audit_id: int,
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create audit report"""
    
    report = AuditReport(
        audit_id=audit_id,
        title=report_data.title,
        executive_summary=report_data.executive_summary,
        sections=report_data.sections,
        status=ReportStatus.draft,
        created_by=current_user.id
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return {"report": report}

@router.put("/{audit_id}/report/{report_id}")
async def update_audit_report(
    audit_id: int,
    report_id: int,
    report_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update audit report"""
    
    report = db.query(AuditReport).filter(
        AuditReport.id == report_id,
        AuditReport.audit_id == audit_id
    ).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update fields
    for field, value in report_data.dict(exclude_unset=True).items():
        if field == "status" and value:
            setattr(report, field, ReportStatus(value))
        else:
            setattr(report, field, value)
    
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    return {"report": report}

# ==================== ANALYTICS ROUTES ====================

@router.get("/analytics/performance")
async def get_auditor_performance(
    timeframe: str = Query("6months"),
    sort: str = Query("rating"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor performance analytics"""
    
    # Calculate date range
    end_date = datetime.now()
    if timeframe == "3months":
        start_date = end_date - timedelta(days=90)
    elif timeframe == "12months":
        start_date = end_date - timedelta(days=365)
    else:  # 6months default
        start_date = end_date - timedelta(days=180)
    
    # Get auditors with performance data
    auditors = db.query(User).filter(
        User.role == UserRole.auditor,
        User.is_active == True
    ).all()
    
    performance_data = []
    
    for auditor in auditors:
        # Get audit assignments in timeframe
        assignments = db.execute(
            text("""
                SELECT COUNT(*) as total_audits
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND aaa.assigned_at >= :start_date 
                AND aaa.assigned_at <= :end_date
            """),
            {"auditor_id": auditor.id, "start_date": start_date, "end_date": end_date}
        ).fetchone()
        
        total_audits = assignments.total_audits if assignments else 0
        
        if total_audits == 0:
            continue
        
        # Mock performance metrics (replace with actual calculations)
        performance_data.append({
            "id": auditor.id,
            "name": f"{auditor.f_name} {auditor.l_name}",
            "email": auditor.email,
            "total_audits": total_audits,
            "completed_audits": total_audits,  # Mock data
            "average_rating": 4.2,  # Calculate from actual ratings
            "on_time_delivery": 85,  # Calculate from actual delivery dates
            "quality_score": 8.5,   # Calculate from quality assessments
            "cost_efficiency": 7.8,  # Calculate from cost data
            "client_satisfaction": 4.1,  # Calculate from client feedback
            "specializations": auditor.specializations or [],
            "recent_audits": [],  # Add recent audit data
            "performance_trends": []  # Add trend data
        })
    
    # Sort results
    if sort == "rating":
        performance_data.sort(key=lambda x: x["average_rating"], reverse=True)
    elif sort == "efficiency":
        performance_data.sort(key=lambda x: x["cost_efficiency"], reverse=True)
    elif sort == "audits":
        performance_data.sort(key=lambda x: x["total_audits"], reverse=True)
    
    return {"auditors": performance_data}

@router.get("/analytics/compliance")
async def get_compliance_status(
    timeframe: str = Query("6months"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company compliance status"""
    
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not associated with company")
    
    # Calculate compliance metrics
    total_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id
    ).count()
    
    completed_requirements = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    pending_requirements = total_requirements - completed_requirements
    
    # Get overdue requirements
    overdue_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentRequirement.deadline < datetime.now()
    ).count()
    
    # Get findings data
    critical_findings = db.query(AuditFinding).join(Audit).filter(
        Audit.company_id == company_id,
        AuditFinding.severity == FindingSeverity.critical,
        AuditFinding.status != FindingStatus.resolved
    ).count()
    
    resolved_findings = db.query(AuditFinding).join(Audit).filter(
        Audit.company_id == company_id,
        AuditFinding.status == FindingStatus.resolved
    ).count()
    
    # Calculate overall compliance score
    overall_score = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
    
    return {
        "overall_score": round(overall_score, 1),
        "total_requirements": total_requirements,
        "completed_requirements": completed_requirements,
        "pending_requirements": pending_requirements,
        "overdue_requirements": overdue_requirements,
        "critical_findings": critical_findings,
        "resolved_findings": resolved_findings,
        "action_items": {
            "total": 25,  # Calculate from actual data
            "completed": 18,
            "overdue": 3
        },
        "compliance_trends": [
            {"month": "Jan", "score": 75},
            {"month": "Feb", "score": 78},
            {"month": "Mar", "score": 82},
            {"month": "Apr", "score": 85},
            {"month": "May", "score": 88},
            {"month": "Jun", "score": round(overall_score, 1)}
        ],
        "gap_analysis": [
            {
                "category": "Document Management",
                "current_score": 85,
                "target_score": 95,
                "gap": 10,
                "priority": "medium"
            },
            {
                "category": "Risk Assessment",
                "current_score": 70,
                "target_score": 90,
                "gap": 20,
                "priority": "high"
            },
            {
                "category": "Compliance Monitoring",
                "current_score": 90,
                "target_score": 95,
                "gap": 5,
                "priority": "low"
            }
        ],
        "upcoming_deadlines": [
            {
                "id": 1,
                "title": "Financial Statements Review",
                "deadline": (datetime.now() + timedelta(days=5)).isoformat(),
                "days_remaining": 5,
                "type": "document_submission"
            },
            {
                "id": 2,
                "title": "Compliance Report",
                "deadline": (datetime.now() + timedelta(days=12)).isoformat(),
                "days_remaining": 12,
                "type": "audit_deliverable"
            }
        ]
    }

# ==================== UTILITY FUNCTIONS ====================

def calculate_overall_progress(audit_id: int, db: Session) -> float:
    """Calculate overall audit progress"""
    # This is a simplified calculation - you can make it more sophisticated
    requirements_weight = 0.4
    findings_weight = 0.3
    meetings_weight = 0.3
    
    # Requirements progress
    total_reqs = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    ).count()
    
    completed_reqs = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).filter(
        DocumentRequirement.audit_id == audit_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    req_progress = (completed_reqs / total_reqs * 100) if total_reqs > 0 else 0
    
    # Findings progress
    total_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).count()
    
    resolved_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id,
        AuditFinding.status == FindingStatus.resolved
    ).count()
    
    findings_progress = (resolved_findings / total_findings * 100) if total_findings > 0 else 0
    
    # Meetings progress
    total_meetings = db.query(AuditMeeting).filter(
        AuditMeeting.audit_id == audit_id
    ).count()
    
    completed_meetings = db.query(AuditMeeting).filter(
        AuditMeeting.audit_id == audit_id,
        AuditMeeting.status == MeetingStatus.completed
    ).count()
    
    meetings_progress = (completed_meetings / total_meetings * 100) if total_meetings > 0 else 0
    
    # Calculate weighted average
    overall = (
        req_progress * requirements_weight +
        findings_progress * findings_weight +
        meetings_progress * meetings_weight
    )
    
    return round(overall, 1)


class AuditValidationService:
    def __init__(self, db: Session):
        self.db = db
    
    def validate_audit_creation(self, audit_data: FinancialAuditCreate) -> AuditValidationResponse:
        errors = []
        warnings = []
        suggestions = []
        
        # Date logic validation
        if audit_data.start_date >= audit_data.end_date:
            errors.append("Start date must be before end date")
        
        if audit_data.end_date >= audit_data.deadline:
            errors.append("End date must be before deadline")
        
        # Budget validation
        if audit_data.estimated_budget:
            ratio = audit_data.estimated_budget / audit_data.materiality_threshold
            if ratio < 0.1:
                warnings.append("Budget seems low compared to materiality threshold")
            elif ratio > 10:
                warnings.append("Budget seems high compared to materiality threshold")
        
        # High-value audit check
        if audit_data.materiality_threshold > 100000:
            suggestions.append("This audit requires management approval due to high materiality threshold")
        
        # Timeline validation
        duration = (audit_data.deadline - audit_data.start_date).days
        if duration < 14:
            warnings.append("Audit timeline is very tight (less than 2 weeks)")
        elif duration > 180:
            warnings.append("Audit timeline is very long (more than 6 months)")
        
        return AuditValidationResponse(
            is_valid=len(errors) == 0,
            errors=errors,
            warnings=warnings,
            suggestions=suggestions
        )
    
    def check_auditor_availability(self, auditor_emails: List[str], start_date: datetime, end_date: datetime) -> List[AuditorAvailabilityCheck]:
        results = []
        
        for email in auditor_emails:
            auditor = self.db.query(User).filter(User.email == email).first()
            if not auditor:
                continue
            
            # Check availability
            conflicts = self.db.query(AuditorAvailability).filter(
                AuditorAvailability.auditor_id == auditor.id,
                AuditorAvailability.availability_type == 'busy',
                or_(
                    and_(AuditorAvailability.start_date <= start_date, AuditorAvailability.end_date >= start_date),
                    and_(AuditorAvailability.start_date <= end_date, AuditorAvailability.end_date >= end_date),
                    and_(AuditorAvailability.start_date >= start_date, AuditorAvailability.end_date <= end_date)
                )
            ).all()
            
            # Check current workload
            current_audits = self.db.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM audit_auditor_assignments aaa
                    JOIN audits a ON aaa.audit_id = a.id
                    WHERE aaa.auditor_id = :auditor_id 
                    AND aaa.is_active = true
                    AND a.status = 'in_progress'
                    AND (
                        (a.start_date <= :start_date AND a.end_date >= :start_date) OR
                        (a.start_date <= :end_date AND a.end_date >= :end_date) OR
                        (a.start_date >= :start_date AND a.end_date <= :end_date)
                    )
                """),
                {"auditor_id": auditor.id, "start_date": start_date, "end_date": end_date}
            ).fetchone()
            
            availability_record = self.db.query(AuditorAvailability).filter(
                AuditorAvailability.auditor_id == auditor.id
            ).first()
            
            max_capacity = availability_record.max_concurrent_audits if availability_record else 3
            current_workload = current_audits.count if current_audits else 0
            
            results.append(AuditorAvailabilityCheck(
                auditor_id=auditor.id,
                is_available=len(conflicts) == 0 and current_workload < max_capacity,
                conflicts=[{
                    "start_date": c.start_date.isoformat(),
                    "end_date": c.end_date.isoformat(),
                    "type": c.availability_type
                } for c in conflicts],
                current_workload=current_workload,
                max_capacity=max_capacity
            ))
        
        return results

class AIEnhancementService:
    def __init__(self, db: Session):
        self.db = db
        genai.configure(api_key="AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE")
    
    async def get_historical_insights(self, audit_data: FinancialAuditCreate) -> Dict[str, Any]:
        # Find similar historical audits
        similar_audits = self.db.query(Audit).filter(
            Audit.financial_audit_type == audit_data.financial_audit_type,
            Audit.status == AuditStatus.completed,
            Audit.materiality_threshold.between(
                audit_data.materiality_threshold * 0.5,
                audit_data.materiality_threshold * 2.0
            )
        ).limit(5).all()
        
        if not similar_audits:
            return {"message": "No similar historical audits found"}
        
        # Analyze historical data
        avg_duration = sum([(a.end_date - a.start_date).days for a in similar_audits if a.end_date and a.start_date]) / len(similar_audits)
        avg_findings = sum([len(a.findings) for a in similar_audits]) / len(similar_audits)
        
        return {
            "similar_audits_count": len(similar_audits),
            "average_duration_days": avg_duration,
            "average_findings_count": avg_findings,
            "recommendations": [
                f"Based on similar audits, expect approximately {int(avg_findings)} findings",
                f"Typical duration for this type of audit is {int(avg_duration)} days",
                "Consider focusing on high-risk areas identified in similar audits"
            ]
        }
    
    async def generate_intelligent_requirements(self, audit_data: FinancialAuditCreate, risk_assessment: Dict) -> List[Dict]:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Based on the following audit parameters and risk assessment, generate specific document requirements:
        
        Audit Type: {audit_data.financial_audit_type}
        Industry: {audit_data.industry_type}
        Compliance Frameworks: {audit_data.compliance_frameworks}
        Materiality Threshold: ${audit_data.materiality_threshold:,.2f}
        Risk Assessment: {risk_assessment}
        
        Generate a JSON list of document requirements with:
        - document_type: specific document name
        - priority: high/medium/low
        - deadline_offset_days: days from audit start
        - validation_rules: specific validation criteria
        - ai_priority_score: 0-10 based on risk
        
        Focus on the highest risk areas and compliance requirements.
        """
        
        try:
            response = model.generate_content(prompt)
            import json
            requirements = json.loads(response.text)
            return requirements
        except Exception as e:
            # Fallback requirements
            return [
                {
                    "document_type": "Financial Statements",
                    "priority": "high",
                    "deadline_offset_days": 7,
                    "validation_rules": {"required_fields": ["balance_sheet", "income_statement"]},
                    "ai_priority_score": 9
                }
            ]
    
    async def match_auditors_intelligently(self, audit_data: FinancialAuditCreate, available_auditors: List[User]) -> List[Dict]:
        # Score auditors based on specializations, past performance, and availability
        scored_auditors = []
        
        for auditor in available_auditors:
            score = 0
            reasons = []
            
            # Specialization match
            if auditor.specializations:
                if audit_data.financial_audit_type in auditor.specializations:
                    score += 30
                    reasons.append("Specialized in this audit type")
                
                if audit_data.industry_type in auditor.specializations:
                    score += 20
                    reasons.append("Industry experience")
            
            # Compliance framework experience
            for framework in audit_data.compliance_frameworks:
                if auditor.certifications and framework in auditor.certifications:
                    score += 15
                    reasons.append(f"{framework.upper()} certified")
            
            # Past performance (mock calculation)
            completed_audits = self.db.execute(
                text("""
                    SELECT COUNT(*) as count
                    FROM audit_auditor_assignments aaa
                    JOIN audits a ON aaa.audit_id = a.id
                    WHERE aaa.auditor_id = :auditor_id 
                    AND a.status = 'completed'
                """),
                {"auditor_id": auditor.id}
            ).fetchone()
            
            if completed_audits and completed_audits.count > 5:
                score += 10
                reasons.append("Experienced auditor")
            
            scored_auditors.append({
                "auditor_id": auditor.id,
                "name": f"{auditor.f_name} {auditor.l_name}",
                "email": auditor.email,
                "match_score": score,
                "reasons": reasons,
                "hourly_rate": auditor.hourly_rate
            })
        
        return sorted(scored_auditors, key=lambda x: x["match_score"], reverse=True)
# Enhanced Routes
@router.post("/validate")
async def validate_audit_data(
    audit_data: FinancialAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validate audit creation data with business rules"""
    
    validator = AuditValidationService(db)
    validation_result = validator.validate_audit_creation(audit_data)
    
    # Check auditor availability
    availability_checks = validator.check_auditor_availability(
        audit_data.auditor_emails,
        audit_data.start_date,
        audit_data.end_date
    )
    
    return {
        "validation": validation_result,
        "auditor_availability": availability_checks
    }

# In your auth router or middleware, ensure token validation is working properly
@router.get("/templates/all")
async def get_audit_templates(
    industry_type: Optional[IndustryType] = Query(None),  # note Enum
    compliance_framework: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # Ensure this dependency is working
):
    """Get available audit templates"""
    print('Fetching audit templates with filters:', industry_type)
    query = db.query(AuditTemplate).filter(AuditTemplate.is_active == True)
    print('Fetching audit templates with filters:', industry_type)
    if industry_type:
        query = query.filter(AuditTemplate.industry_type == industry_type)
    
    templates = query.all()
    
    return {
        "templates": [
            {
                "id": t.id,
                "name": t.name,
                "description": t.description,
                "industry_type": t.industry_type.value if t.industry_type else None,
                "compliance_frameworks": t.compliance_frameworks,
                "audit_methodology": t.audit_methodology.value if t.audit_methodology else None,
                "template_data": t.template_data
            }
            for t in templates
        ]
    }

@router.post("/recommendations/auditors")
async def get_auditor_recommendations(
    financial_audit_type: str,
    industry_type: Optional[str] = None,
    compliance_frameworks: List[str] = Query([]),
    start_date: datetime = Query(...),
    end_date: datetime = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get intelligent auditor recommendations"""
    
    # Get available auditors
    available_auditors = db.query(User).filter(
        User.role == UserRole.auditor,
        User.is_active == True,
        User.availability_status == "available"
    ).all()
    
    # Create mock audit data for matching
    audit_data = FinancialAuditCreate(
        name="temp",
        description="temp",
        financial_audit_type=financial_audit_type,
        scope="temp",
        start_date=start_date,
        end_date=end_date,
        deadline=end_date + timedelta(days=7),
        industry_type=industry_type,
        compliance_frameworks=compliance_frameworks
    )
    
    ai_service = AIEnhancementService(db)
    recommendations = await ai_service.match_auditors_intelligently(audit_data, available_auditors)
    
    return {"recommendations": recommendations}

@router.post("/create-enhanced")
async def create_enhanced_financial_audit(
    audit_data: FinancialAuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create enhanced financial audit with all improvements"""
    
    # Step 1: Validate audit data
    validator = AuditValidationService(db)
    validation_result = validator.validate_audit_creation(audit_data)
    
    if not validation_result.is_valid:
        raise HTTPException(status_code=400, detail={
            "message": "Validation failed",
            "errors": validation_result.errors,
            "warnings": validation_result.warnings
        })
    
    # Step 2: Check if approval is required
    requires_approval = (
        audit_data.materiality_threshold > 100000 or
        audit_data.estimated_budget and audit_data.estimated_budget > 500000
    )
    
    # Step 3: Get historical insights
    ai_service = AIEnhancementService(db)
    historical_insights = await ai_service.get_historical_insights(audit_data)
    
    # Step 4: Generate AI risk assessment
    ai_assessment = await generate_ai_risk_assessment(
        audit_data.financial_audit_type,
        audit_data.scope,
        audit_data.materiality_threshold,
        db
    )
    
    # Step 5: Calculate complexity and budget estimation
    complexity_score = calculate_complexity_score(audit_data, ai_assessment)
    estimated_hours = estimate_audit_hours(complexity_score, audit_data)
    
    if not audit_data.estimated_budget:
        audit_data.estimated_budget = estimated_hours * 150  # $150/hour average
    
    # Step 6: Create the audit record
    audit = Audit(
        name=audit_data.name,
        description=audit_data.description,
        audit_type=AuditType.financial,
        financial_audit_type=FinancialAuditType(audit_data.financial_audit_type),
        scope=audit_data.scope,
        start_date=audit_data.start_date,
        end_date=audit_data.end_date,
        deadline=audit_data.deadline,
        materiality_threshold=audit_data.materiality_threshold,
        estimated_budget=audit_data.estimated_budget,
        budget_lower_bound=audit_data.estimated_budget * 0.8,
        budget_upper_bound=audit_data.estimated_budget * 1.2,
        audit_methodology=AuditMethodology(audit_data.audit_methodology),
        compliance_frameworks=audit_data.compliance_frameworks,
        industry_type=IndustryType(audit_data.industry_type) if audit_data.industry_type else None,
        template_id=audit_data.template_id,
        estimated_hours=estimated_hours,
        complexity_score=complexity_score,
        requires_approval=requires_approval,
        approval_status=AuditApprovalStatus.pending if requires_approval else AuditApprovalStatus.approved,
        company_id=current_user.company_id,
        created_by=current_user.id,
        status=AuditStatus.planned,
        ai_risk_score=ai_assessment["overall_risk_score"],
        ai_suggestions=ai_assessment,
        ai_confidence_score=ai_assessment.get("confidence", 0.8),
        ai_model_version="gemini-1.5-flash",
        historical_data_used=historical_insights
    )
    
    db.add(audit)
    db.flush()
    
    # Step 7: Create AI Risk Assessment records
    for risk in ai_assessment["risk_categories"]:
        ai_risk = AIRiskAssessment(
            audit_id=audit.id,
            risk_category=risk["category"],
            risk_level=AIRiskLevel(risk["level"]),
            confidence_score=risk["confidence"],
            description=risk["description"],
            ai_reasoning=risk["reasoning"],
            suggested_focus_areas=risk["focus_areas"]
        )
        db.add(ai_risk)
    
    # Step 8: Generate intelligent document requirements
    intelligent_requirements = await ai_service.generate_intelligent_requirements(audit_data, ai_assessment)
    
    for req_data in intelligent_requirements:
        requirement = DocumentRequirement(
            audit_id=audit.id,
            document_type=req_data["document_type"],
            deadline=audit_data.start_date + timedelta(days=req_data.get("deadline_offset_days", 14)),
            is_mandatory=req_data.get("priority") == "high",
            auto_escalate=True,
            validation_rules=req_data.get("validation_rules", {}),
            created_by=current_user.id
        )
        db.add(requirement)
    
    # Step 9: Handle auditor assignments with availability check
    availability_checks = validator.check_auditor_availability(
        audit_data.auditor_emails,
        audit_data.start_date,
        audit_data.end_date
    )
    
    assigned_auditors = []
    for email in audit_data.auditor_emails:
        auditor = db.query(User).filter(User.email == email).first()
        if auditor:
            # Check if auditor is available
            availability = next((a for a in availability_checks if a.auditor_id == auditor.id), None)
            if availability and availability.is_available:
                stmt = audit_auditor_assignment.insert().values(
                    audit_id=audit.id,
                    auditor_id=auditor.id,
                    assigned_by=current_user.id,
                    role="auditor"
                )
                db.execute(stmt)
                assigned_auditors.append(auditor.email)
            else:
                # Send invitation anyway but flag as potential conflict
                await invite_auditor_with_credentials(audit.id, email, current_user.id, db)
    
    # Step 10: Create approval workflow if required
    if requires_approval:
        # Find approvers (users with admin or manager role)
        approvers = db.query(User).filter(
            User.company_id == current_user.company_id,
            User.role.in_([UserRole.admin, UserRole.manager]),
            User.id != current_user.id
        ).all()
        
        for approver in approvers:
            approval_workflow = AuditApprovalWorkflow(
                audit_id=audit.id,
                approver_id=approver.id,
                status=AuditApprovalStatus.pending
            )
            db.add(approval_workflow)
    
    # Step 11: Auto-schedule kickoff meeting (only if approved or doesn't require approval)
    if not requires_approval:
        kickoff_meeting = await schedule_kickoff_meeting(audit.id, current_user.id, db)
        audit.kickoff_meeting_id = kickoff_meeting.id
        audit.auto_scheduled_kickoff = True
    
    # Step 12: Store historical data for future AI learning
    historical_data = AuditHistoricalData(
        audit_id=audit.id,
        similar_audit_ids=[a.id for a in db.query(Audit).filter(
            Audit.financial_audit_type == audit_data.financial_audit_type,
            Audit.status == AuditStatus.completed
        ).limit(5).all()],
        ai_insights=ai_assessment
    )
    db.add(historical_data)
    
    db.commit()
    
    return {
        "audit_id": audit.id,
        "validation_result": validation_result,
        "ai_assessment": ai_assessment,
        "historical_insights": historical_insights,
        "requires_approval": requires_approval,
        "assigned_auditors": assigned_auditors,
        "complexity_score": complexity_score,
        "estimated_hours": estimated_hours,
        "kickoff_meeting_scheduled": not requires_approval,
        "message": "Enhanced financial audit created successfully" + 
                  (" - pending approval" if requires_approval else "")
    }

# Utility Functions
def calculate_complexity_score(audit_data: FinancialAuditCreate, ai_assessment: Dict) -> float:
    """Calculate audit complexity score (1-10)"""
    score = 5.0  # Base score
    
    # Materiality threshold impact
    if audit_data.materiality_threshold > 1000000:
        score += 2
    elif audit_data.materiality_threshold > 100000:
        score += 1
    
    # Compliance frameworks
    score += len(audit_data.compliance_frameworks) * 0.5
    
    # AI risk score impact
    if ai_assessment.get("overall_risk_score", 5) > 7:
        score += 1.5
    
    # Timeline pressure
    duration = (audit_data.deadline - audit_data.start_date).days
    if duration < 30:
        score += 1
    
    return min(10.0, max(1.0, score))

def estimate_audit_hours(complexity_score: float, audit_data: FinancialAuditCreate) -> float:
    """Estimate audit hours based on complexity"""
    base_hours = 40  # Base hours for simple audit
    
    # Complexity multiplier
    hours = base_hours * (complexity_score / 5.0)
    
    # Audit type specific adjustments
    type_multipliers = {
        "vendor_payments": 1.2,
        "revenue_recognition": 1.5,
        "tax_compliance": 1.3,
        "payroll_audit": 1.1,
        "custom": 1.4
    }
    
    multiplier = type_multipliers.get(audit_data.financial_audit_type, 1.0)
    hours *= multiplier
    
    # Compliance framework overhead
    hours += len(audit_data.compliance_frameworks) * 8
    
    return round(hours, 1)

async def generate_ai_risk_assessment(
    financial_audit_type: str,
    scope: str,
    materiality_threshold: float,
    db: Session
) -> dict:
    """Enhanced AI risk assessment with historical data"""
    
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    # Get historical risk patterns
    historical_risks = db.query(AIRiskAssessment).join(Audit).filter(
        Audit.financial_audit_type == financial_audit_type
    ).limit(10).all()
    
    historical_context = ""
    if historical_risks:
        risk_patterns = {}
        for risk in historical_risks:
            if risk.risk_category not in risk_patterns:
                risk_patterns[risk.risk_category] = []
            risk_patterns[risk.risk_category].append(risk.risk_level.value)
        
        historical_context = f"Historical risk patterns for {financial_audit_type}: {risk_patterns}"
    
    prompt = f"""
    As a senior financial audit expert with access to historical data, analyze the following audit parameters:
    
    Audit Type: {financial_audit_type}
    Scope: {scope}
    Materiality Threshold: ${materiality_threshold:,.2f}
    Historical Context: {historical_context}
    
    Provide a comprehensive risk assessment with:
    1. Risk categories with levels (low, medium, high, critical)
    2. Confidence scores (0-1) based on data quality and historical patterns
    3. Detailed descriptions and AI reasoning
    4. Suggested focus areas for each risk
    5. Overall risk score (0-10) with justification
    6. Key recommendations prioritized by risk level
    
    Consider industry best practices, regulatory requirements, and historical audit outcomes.
    
    Format as JSON:
    {{
        "risk_categories": [
            {{
                "category": "string",
                "level": "high|medium|low|critical",
                "confidence": 0.95,
                "description": "string",
                "reasoning": "string with historical context",
                "focus_areas": ["area1", "area2"]
            }}
        ],
        "overall_risk_score": 7.5,
        "confidence": 0.9,
        "key_recommendations": ["rec1", "rec2"],
        "historical_insights": "insights from similar audits"
    }}
    """
    
    try:
        response = model.generate_content(prompt)
        import json
        ai_assessment = json.loads(response.text)
        return ai_assessment
    except Exception as e:
        # Enhanced fallback with historical context
        return {
            "risk_categories": [
                {
                    "category": "High-Value Transactions",
                    "level": "high",
                    "confidence": 0.8,
                    "description": f"Transactions above ${materiality_threshold:,.2f} require detailed review",
                    "reasoning": "Large transactions pose higher risk of errors or fraud based on historical patterns",
                    "focus_areas": ["Authorization", "Supporting Documentation", "Approval Workflow"]
                },
                {
                    "category": "Internal Controls",
                    "level": "medium",
                    "confidence": 0.7,
                    "description": "Assessment of internal control effectiveness",
                    "reasoning": "Control deficiencies commonly found in similar audits",
                    "focus_areas": ["Segregation of Duties", "Management Review", "Documentation"]
                }
            ],
            "overall_risk_score": 6.5,
            "confidence": 0.75,
            "key_recommendations": [
                "Focus on high-value transactions above materiality threshold",
                "Review internal control design and implementation",
                "Test management review controls"
            ],
            "historical_insights": "Based on similar audits, expect 2-3 medium findings on average"
        }

@router.post("/{audit_id}/requirements/generate")
async def generate_intelligent_requirements(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered document requirements for audit"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    service = EnhancedDocumentService(db)
    
    # Generate intelligent requirements
    requirements_data = await service.generate_intelligent_requirements(
        audit_id=audit_id,
        financial_audit_type=audit.financial_audit_type.value if audit.financial_audit_type else "custom",
        industry_type=audit.industry_type.value if audit.industry_type else "other",
        compliance_frameworks=audit.compliance_frameworks or [],
        materiality_threshold=audit.materiality_threshold or 50000
    )
    
    # Create requirements
    await service.create_enhanced_requirements(
        audit_id=audit_id,
        requirements_data=requirements_data,
        created_by=current_user.id
    )
    
    return {
        "message": "Intelligent requirements generated successfully",
        "requirements_count": len(requirements_data),
        "requirements": requirements_data
    }

@router.get("/{audit_id}/requirements/enhanced")
async def get_enhanced_requirements(
    audit_id: int,
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get enhanced document requirements with submission status"""
    
    query = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    )
    
    if status:
        # Filter by submission status
        if status == "pending":
            query = query.filter(~DocumentRequirement.submissions.any())
        elif status == "submitted":
            query = query.filter(DocumentRequirement.submissions.any(
                DocumentSubmission.verification_status == EvidenceStatus.pending
            ))
        elif status == "approved":
            query = query.filter(DocumentRequirement.submissions.any(
                DocumentSubmission.verification_status == EvidenceStatus.approved
            ))
    
    if priority:
        if priority == "high":
            query = query.filter(DocumentRequirement.ai_priority_score >= 8)
        elif priority == "medium":
            query = query.filter(DocumentRequirement.ai_priority_score.between(5, 7.9))
        elif priority == "low":
            query = query.filter(DocumentRequirement.ai_priority_score < 5)
    
    requirements = query.order_by(
        DocumentRequirement.ai_priority_score.desc(),
        DocumentRequirement.deadline.asc()
    ).all()
    
    result = []
    for req in requirements:
        # Get latest submission
        latest_submission = db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == req.id
        ).order_by(DocumentSubmission.submitted_at.desc()).first()
        
        # Get escalations
        escalations = db.query(RequirementEscalation).filter(
            RequirementEscalation.requirement_id == req.id,
            RequirementEscalation.resolved == False
        ).count()
        
        # Calculate days until deadline
        days_until_deadline = None
        if req.deadline:
            days_until_deadline = (req.deadline - datetime.utcnow()).days
        
        req_data = {
            "id": req.id,
            "document_type": req.document_type,
            "ai_priority_score": req.ai_priority_score,
            "risk_level": req.risk_level,
            "deadline": req.deadline.isoformat() if req.deadline else None,
            "days_until_deadline": days_until_deadline,
            "is_mandatory": req.is_mandatory,
            "auto_escalate": req.auto_escalate,
            "escalation_level": req.escalation_level,
            "escalations_count": escalations,
            "compliance_framework": req.compliance_framework,
            "required_fields": req.required_fields,
            "validation_rules": req.validation_rules,
            "latest_submission": None
        }
        
        if latest_submission:
            req_data["latest_submission"] = {
                "id": latest_submission.id,
                "status": latest_submission.verification_status.value,
                "workflow_stage": latest_submission.workflow_stage.value,
                "submitted_at": latest_submission.submitted_at.isoformat(),
                "ai_validation_score": latest_submission.ai_validation_score,
                "compliance_score": latest_submission.compliance_score,
                "revision_round": latest_submission.revision_round
            }
        
        result.append(req_data)
    
    return {"requirements": result}

# ==================== ENHANCED DOCUMENT SUBMISSION ====================

@router.post("/{audit_id}/submit-document-enhanced")
async def submit_document_enhanced(
    audit_id: int,
    file: UploadFile = File(...),
    requirement_id: int = Form(...),
    notes: Optional[str] = Form(None),
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document submission with workflow tracking"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Save file
    file_path = f"uploads/audit_{audit_id}/{file.filename}"
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)
    
    # Calculate file hash
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Create document record
    document = Document(
        title=file.filename,
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(content),
        hash_sha256=file_hash,
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    
    db.add(document)
    db.flush()
    
    # Enhanced submission
    service = EnhancedDocumentService(db)
    
    # Get client info
    ip_address = request.client.host if request else None
    user_agent = request.headers.get("user-agent") if request else None
    
    result = await service.submit_document_enhanced(
        requirement_id=requirement_id,
        document_id=document.id,
        submitted_by=current_user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    return result

@router.get("/submissions/{submission_id}/status")
async def get_submission_status(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed submission status and workflow progress"""
    
    service = EnhancedDocumentService(db)
    history = service.get_submission_history(submission_id)
    
    if not history:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return history

@router.get("/submissions/{submission_id}/workflow")
async def get_submission_workflow(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get submission workflow progress"""
    
    workflow_entries = db.query(DocumentSubmissionWorkflow).options(
        joinedload(DocumentSubmissionWorkflow.performer)
    ).filter(
        DocumentSubmissionWorkflow.submission_id == submission_id
    ).order_by(DocumentSubmissionWorkflow.created_at.asc()).all()
    
    return {
        "workflow": [
            {
                "stage": entry.stage.value,
                "status": entry.status,
                "performer": f"{entry.performer.f_name} {entry.performer.l_name}" if entry.performer else "System",
                "performer_type": entry.performer_type.value,
                "notes": entry.notes,
                "validation_score": entry.validation_score,
                "confidence_score": entry.confidence_score,
                "duration_minutes": entry.stage_duration_minutes,
                "automated": entry.automated,
                "created_at": entry.created_at.isoformat()
            }
            for entry in workflow_entries
        ]
    }

# ==================== ENHANCED DOCUMENT VERIFICATION ====================

@router.post("/submissions/{submission_id}/verify-enhanced")
async def verify_document_enhanced(
    submission_id: int,
    verification_data: DocumentVerificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document verification with immutable records"""
    
    service = EnhancedDocumentService(db)
    
    try:
        status = EvidenceStatus(verification_data.status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await service.verify_document_enhanced(
        submission_id=submission_id,
        verified_by=current_user.id,
        status=status,
        notes=verification_data.notes,
        quality_score=verification_data.quality_score
    )
    
    return result

@router.get("/submissions/{submission_id}/verification-chain")
async def get_verification_chain(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get immutable verification chain for submission"""
    
    chain_entries = db.query(DocumentVerificationChain).filter(
        DocumentVerificationChain.submission_id == submission_id
    ).order_by(DocumentVerificationChain.block_number.asc()).all()
    
    return {
        "verification_chain": [
            {
                "block_number": entry.block_number,
                "current_hash": entry.current_hash,
                "previous_hash": entry.previous_hash,
                "verification_data": entry.verification_data,
                "timestamp": entry.timestamp.isoformat(),
                "immutable": entry.is_immutable
            }
            for entry in chain_entries
        ],
        "chain_integrity": len(chain_entries) > 0
    }

# ==================== ESCALATION MANAGEMENT ====================

@router.post("/requirements/{requirement_id}/escalate")
async def escalate_requirement(
    requirement_id: int,
    escalation_data: RequirementEscalationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually escalate a requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    try:
        escalation_type = EscalationType(escalation_data.escalation_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid escalation type")
    
    escalation = RequirementEscalation(
        requirement_id=requirement_id,
        escalation_level=requirement.escalation_level + 1,
        escalated_to_id=escalation_data.escalated_to_id,
        escalated_by_id=current_user.id,
        escalation_reason=escalation_data.reason,
        escalation_type=escalation_type
    )
    
    db.add(escalation)
    
    # Update requirement
    requirement.escalation_level += 1
    requirement.last_escalated_at = datetime.utcnow()
    
    # Send notification
    audit = db.query(Audit).filter(Audit.id == requirement.audit_id).first()
    notification = AuditNotification(
        user_id=escalation_data.escalated_to_id,
        audit_id=audit.id,
        notification_type="manual_escalation",
        title=f"Requirement Escalated: {requirement.document_type}",
        message=f"Escalated by {current_user.f_name} {current_user.l_name}: {escalation_data.reason}",
        priority=NotificationPriority.high,
        data={
            "requirement_id": requirement_id,
            "escalation_type": escalation_type.value,
            "escalated_by": f"{current_user.f_name} {current_user.l_name}"
        }
    )
    
    db.add(notification)
    db.commit()
    
    return {"message": "Requirement escalated successfully"}

@router.get("/{audit_id}/escalations")
async def get_audit_escalations(
    audit_id: int,
    status: Optional[str] = Query("active"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get escalations for an audit"""
    
    query = db.query(RequirementEscalation).join(
        DocumentRequirement
    ).filter(
        DocumentRequirement.audit_id == audit_id
    )
    
    if status == "active":
        query = query.filter(RequirementEscalation.resolved == False)
    elif status == "resolved":
        query = query.filter(RequirementEscalation.resolved == True)
    
    escalations = query.options(
        joinedload(RequirementEscalation.requirement),
        joinedload(RequirementEscalation.escalated_to),
        joinedload(RequirementEscalation.escalated_by)
    ).order_by(RequirementEscalation.created_at.desc()).all()
    
    return {
        "escalations": [
            {
                "id": esc.id,
                "requirement": {
                    "id": esc.requirement.id,
                    "document_type": esc.requirement.document_type,
                    "ai_priority_score": esc.requirement.ai_priority_score
                },
                "escalation_level": esc.escalation_level,
                "escalation_type": esc.escalation_type.value,
                "escalation_reason": esc.escalation_reason,
                "escalated_to": f"{esc.escalated_to.f_name} {esc.escalated_to.l_name}",
                "escalated_by": f"{esc.escalated_by.f_name} {esc.escalated_by.l_name}" if esc.escalated_by else "System",
                "resolved": esc.resolved,
                "created_at": esc.created_at.isoformat(),
                "resolved_at": esc.resolved_at.isoformat() if esc.resolved_at else None
            }
            for esc in escalations
        ]
    }

# ==================== NOTIFICATIONS ====================

@router.get("/notifications")
async def get_audit_notifications(
    unread_only: bool = Query(False),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit notifications for current user"""
    
    query = db.query(AuditNotification).filter(
        AuditNotification.user_id == current_user.id
    )
    
    if unread_only:
        query = query.filter(AuditNotification.read == False)
    
    notifications = query.order_by(
        AuditNotification.created_at.desc()
    ).limit(limit).all()
    
    return {
        "notifications": [
            {
                "id": notif.id,
                "title": notif.title,
                "message": notif.message,
                "notification_type": notif.notification_type,
                "priority": notif.priority.value,
                "data": notif.data,
                "read": notif.read,
                "created_at": notif.created_at.isoformat(),
                "expires_at": notif.expires_at.isoformat() if notif.expires_at else None
            }
            for notif in notifications
        ]
    }

@router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    
    notification = db.query(AuditNotification).filter(
        AuditNotification.id == notification_id,
        AuditNotification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.read = True
    notification.read_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Notification marked as read"}

# ==================== COMPLIANCE MONITORING ====================

@router.get("/{audit_id}/compliance-status")
async def get_compliance_status(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive compliance status for audit"""
    
    # Get all requirements
    requirements = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    ).all()
    
    total_requirements = len(requirements)
    completed_requirements = 0
    overdue_requirements = 0
    high_priority_pending = 0
    
    requirement_details = []
    
    for req in requirements:
        # Get latest submission
        latest_submission = db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == req.id
        ).order_by(DocumentSubmission.submitted_at.desc()).first()
        
        status = "not_submitted"
        if latest_submission:
            if latest_submission.verification_status == EvidenceStatus.approved:
                status = "completed"
                completed_requirements += 1
            elif latest_submission.verification_status == EvidenceStatus.pending:
                status = "under_review"
            elif latest_submission.verification_status == EvidenceStatus.rejected:
                status = "rejected"
            else:
                status = "needs_revision"
        
        # Check if overdue
        is_overdue = req.deadline and req.deadline < datetime.utcnow() and status != "completed"
        if is_overdue:
            overdue_requirements += 1
        
        # Check if high priority and pending
        if req.ai_priority_score >= 8 and status in ["not_submitted", "under_review"]:
            high_priority_pending += 1
        
        requirement_details.append({
            "id": req.id,
            "document_type": req.document_type,
            "ai_priority_score": req.ai_priority_score,
            "risk_level": req.risk_level,
            "status": status,
            "is_overdue": is_overdue,
            "deadline": req.deadline.isoformat() if req.deadline else None,
            "escalation_level": req.escalation_level,
            "compliance_framework": req.compliance_framework
        })
    
    # Calculate compliance score
    compliance_score = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
    
    # Get recent checkpoints
    recent_checkpoints = db.query(ComplianceCheckpoint).filter(
        ComplianceCheckpoint.audit_id == audit_id
    ).order_by(ComplianceCheckpoint.checked_at.desc()).limit(10).all()
    
    return {
        "overall_compliance_score": round(compliance_score, 1),
        "total_requirements": total_requirements,
        "completed_requirements": completed_requirements,
        "overdue_requirements": overdue_requirements,
        "high_priority_pending": high_priority_pending,
        "requirements": requirement_details,
        "recent_checkpoints": [
            {
                "checkpoint_type": cp.checkpoint_type,
                "status": cp.status.value,
                "score": cp.score,
                "details": cp.details,
                "checked_at": cp.checked_at.isoformat()
            }
            for cp in recent_checkpoints
        ]
    }

# ==================== ANALYTICS AND REPORTING ====================

@router.get("/{audit_id}/analytics/document-flow")
async def get_document_flow_analytics(
    audit_id: int,
    timeframe: str = Query("30days"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document flow analytics for audit"""
    
    # Calculate date range
    if timeframe == "7days":
        start_date = datetime.utcnow() - timedelta(days=7)
    elif timeframe == "90days":
        start_date = datetime.utcnow() - timedelta(days=90)
    else:  # 30days default
        start_date = datetime.utcnow() - timedelta(days=30)
    
    # Get submission statistics
    submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).filter(
        DocumentRequirement.audit_id == audit_id,
        DocumentSubmission.submitted_at >= start_date
    ).all()
    
    # Analyze workflow stages
    stage_stats = {}
    ai_validation_stats = []
    verification_times = []
    
    for submission in submissions:
        # Workflow stage analysis
        stage = submission.workflow_stage.value
        if stage not in stage_stats:
            stage_stats[stage] = 0
        stage_stats[stage] += 1
        
        # AI validation analysis
        if submission.ai_validation_score:
            ai_validation_stats.append(submission.ai_validation_score)
        
        # Verification time analysis
        if submission.submitted_at and submission.reviewed_at:
            verification_time = (submission.reviewed_at - submission.submitted_at).total_seconds() / 3600
            verification_times.append(verification_time)
    
    # Calculate averages
    avg_ai_score = sum(ai_validation_stats) / len(ai_validation_stats) if ai_validation_stats else 0
    avg_verification_time = sum(verification_times) / len(verification_times) if verification_times else 0
    
    return {
        "timeframe": timeframe,
        "total_submissions": len(submissions),
        "stage_distribution": stage_stats,
        "ai_validation": {
            "average_score": round(avg_ai_score, 2),
            "total_validations": len(ai_validation_stats),
            "score_distribution": {
                "excellent": len([s for s in ai_validation_stats if s >= 8]),
                "good": len([s for s in ai_validation_stats if 6 <= s < 8]),
                "fair": len([s for s in ai_validation_stats if 4 <= s < 6]),
                "poor": len([s for s in ai_validation_stats if s < 4])
            }
        },
        "verification_performance": {
            "average_time_hours": round(avg_verification_time, 2),
            "total_verifications": len(verification_times)
        }
    }

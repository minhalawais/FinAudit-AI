from sqlalchemy import (
    Date,Column, Integer, String, DateTime, ForeignKey, JSON, Text, Boolean, Enum, Float, Table
)
from sqlalchemy.dialects.postgresql import INET,JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base
from datetime import datetime

# Enums
class UserRole(enum.Enum):
    admin = "admin"
    manager = "manager"
    employee = "employee"
    auditor = "auditor"
    auditee = "auditee"

class AuditStatus(enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
    archived = "archived"

class AuditType(enum.Enum):
    compliance = "compliance"
    financial = "financial"
    operational = "operational"
    it = "it"
    internal = "internal"
    external = "external"

class FindingSeverity(enum.Enum):
    critical = "critical"
    major = "major"
    minor = "minor"
    informational = "informational"

class FindingStatus(enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"

class EvidenceStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    needs_revision = "needs_revision"

class InvitationStatus(enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"
    expired = "expired"

class MeetingType(enum.Enum):
    kickoff = "kickoff"
    progress = "progress"
    urgent = "urgent"
    exit = "exit"
    ad_hoc = "ad_hoc"

class MeetingStatus(enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"

class ActionItemStatus(enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    overdue = "overdue"

class ReportStatus(enum.Enum):
    draft = "draft"
    review = "review"
    final = "final"

class MessageType(enum.Enum):
    text = "text"
    file = "file"
    system = "system"

class FinancialAuditType(enum.Enum):
    vendor_payments = "vendor_payments"
    expense_reimbursements = "expense_reimbursements" 
    tax_compliance = "tax_compliance"
    payroll_audit = "payroll_audit"
    revenue_recognition = "revenue_recognition"
    accounts_payable = "accounts_payable"
    accounts_receivable = "accounts_receivable"
    inventory_valuation = "inventory_valuation"
    custom = "custom"

class AIRiskLevel(enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class AuditMethodology(enum.Enum):
    risk_based = "risk_based"
    compliance_based = "compliance_based"
    substantive = "substantive"
    analytical = "analytical"
    hybrid = "hybrid"

class ComplianceFramework(enum.Enum):
    sox = "sox"
    gdpr = "gdpr"
    hipaa = "hipaa"
    iso27001 = "iso27001"
    pci_dss = "pci_dss"
    custom = "custom"

class AuditApprovalStatus(enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    requires_revision = "requires_revision"

class IndustryType(enum.Enum):
    healthcare = "healthcare"
    financial_services = "financial_services"
    technology = "technology"
    manufacturing = "manufacturing"
    retail = "retail"
    government = "government"
    education = "education"
    other = "other"
class WorkflowStage(enum.Enum):
    submitted = "submitted"
    ai_validating = "ai_validating"
    ai_validated = "ai_validated"
    under_review = "under_review"
    approved = "approved"
    rejected = "rejected"
    needs_revision = "needs_revision"
    escalated = "escalated"

class EscalationType(enum.Enum):
    overdue = "overdue"
    high_priority = "high_priority"
    compliance_critical = "compliance_critical"
    quality_issue = "quality_issue"

class NotificationPriority(enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    critical = "critical"

class ActorType(enum.Enum):
    user = "user"
    system = "system"
    ai = "ai"

class ComplianceStatus(enum.Enum):
    passed = "passed"
    failed = "failed"
    warning = "warning"
    pending_review = "pending_review"
class FindingType(enum.Enum):
    compliance = "compliance"
    control_deficiency = "control_deficiency"
    documentation_issue = "documentation_issue"
    process_inefficiency = "process_inefficiency"
    risk_exposure = "risk_exposure"
    best_practice = "best_practice"

class RemediationStatus(enum.Enum):
    not_started = "not_started"
    in_progress = "in_progress"
    completed = "completed"
    verified = "verified"
    closed = "closed"
    
# Association Tables
audit_auditor_assignment = Table(
    'audit_auditor_assignments',
    Base.metadata,
    Column('id', Integer, primary_key=True),
    Column('audit_id', Integer, ForeignKey('audits.id'), nullable=False),
    Column('auditor_id', Integer, ForeignKey('users.id'), nullable=False),
    Column('assigned_by', Integer, ForeignKey('users.id'), nullable=False),
    Column('role', String(50), default='auditor'),
    Column('assigned_at', DateTime, default=datetime.utcnow),
    Column('is_active', Boolean, default=True)
)

conversation_participants = Table(
    'conversation_participants',
    Base.metadata,
    Column('conversation_id', Integer, ForeignKey('conversations.id')),
    Column('user_id', Integer, ForeignKey('users.id'))
)

finding_evidence = Table(
    'finding_evidence',
    Base.metadata,
    Column('finding_id', Integer, ForeignKey('audit_findings.id')),
    Column('document_id', Integer, ForeignKey('documents.id'))
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)
    phone_number = Column(String(15), nullable=True)
    f_name = Column(String(50), nullable=False)
    l_name = Column(String(50), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=True)
    
    # Auditor-specific fields
    certifications = Column(JSON)
    specializations = Column(JSON)
    hourly_rate = Column(Float)
    availability_status = Column(String(20), default="available")

    # Relationships
    employee = relationship("Employee", back_populates="user", uselist=False)
    activities = relationship("Activity", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    company = relationship("Company", back_populates="users")
    created_audits = relationship("Audit", foreign_keys="Audit.created_by", back_populates="creator")
    
    assigned_audits = relationship(
        "Audit", 
        secondary=audit_auditor_assignment,
        primaryjoin="User.id == audit_auditor_assignments.c.auditor_id",
        secondaryjoin="Audit.id == audit_auditor_assignments.c.audit_id",
        back_populates="auditors"
    )
    
    audit_assignments_made = relationship(
        "Audit",
        secondary=audit_auditor_assignment,
        primaryjoin="User.id == audit_auditor_assignments.c.assigned_by",
        secondaryjoin="Audit.id == audit_auditor_assignments.c.audit_id",
        viewonly=True
    )
    
    sent_invitations = relationship("AuditorInvitation", foreign_keys="AuditorInvitation.invited_by", back_populates="inviter")
    document_submissions = relationship("DocumentSubmission", foreign_keys="DocumentSubmission.submitted_by", back_populates="submitter")
    document_verifications = relationship("DocumentVerification", foreign_keys="DocumentVerification.verified_by", back_populates="verifier")
    created_findings = relationship("AuditFinding", foreign_keys="AuditFinding.created_by", back_populates="creator")
    resolved_findings = relationship("AuditFinding", foreign_keys="AuditFinding.resolved_by", back_populates="resolver")
    assigned_actions = relationship("ActionItem", foreign_keys="ActionItem.assigned_to", back_populates="assignee")
    created_meetings = relationship("AuditMeeting", foreign_keys="AuditMeeting.created_by", back_populates="creator")
    meeting_attendances = relationship("MeetingAttendee", back_populates="user")
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")
    conversations = relationship("Conversation", secondary=conversation_participants, back_populates="participants")
    created_reports = relationship("AuditReport", foreign_keys="AuditReport.created_by", back_populates="creator")

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    address = Column(String)
    industry = Column(String)
    size = Column(String(50))
    subscription_plan = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employees = relationship("Employee", back_populates="company")
    documents = relationship("Document", back_populates="company")
    integrations = relationship("Integration", back_populates="company")
    workflows = relationship("Workflow", back_populates="company")
    users = relationship("User", back_populates="company")
    audits = relationship("Audit", back_populates="company")
    invitations = relationship("AuditorInvitation", back_populates="company")

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True, index=True)
    position = Column(String)
    department = Column(String)
    company_id = Column(Integer, ForeignKey("companies.id"))
    hire_date = Column(DateTime)

    company = relationship("Company", back_populates="employees")
    user = relationship("User", back_populates="employee", uselist=False)

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(JSON, nullable=True)
    raw_content = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_size = Column(Float, nullable=False)
    hash_sha256 = Column(String(64))
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User")
    company = relationship("Company", back_populates="documents")
    versions = relationship("DocumentVersion", back_populates="document")
    comments = relationship("Comment", back_populates="document")
    document_workflows = relationship("DocumentWorkflow", back_populates="document")
    ai_analyses = relationship("DocumentAIAnalysis", back_populates="document")
    document_metadata = relationship("DocumentMetadata", back_populates="document")
    annotations = relationship("Annotation", back_populates="document")
    audit_documents = relationship("AuditDocument", back_populates="document")
    submissions = relationship("DocumentSubmission", back_populates="document")
    evidence_documents = relationship("AuditFinding", secondary=finding_evidence, back_populates="evidence_documents")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="activities")

class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    integration_type = Column(String(50))
    config = Column(JSON)
    is_active = Column(Boolean, default=True)

    company = relationship("Company", back_populates="integrations")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50))

    user = relationship("User", back_populates="notifications")

class DocumentVersion(Base):
    __tablename__ = "document_versions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    version_number = Column(Integer)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    file_path = Column(String, nullable=True)

    document = relationship("Document", back_populates="versions")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="comments")
    user = relationship("User")

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    company_id = Column(Integer, ForeignKey("companies.id"))

    company = relationship("Company", back_populates="workflows")
    steps = relationship("WorkflowStep", back_populates="workflow")
    document_workflows = relationship("DocumentWorkflow", back_populates="workflow")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    step_number = Column(Integer)
    action = Column(String)
    role_required = Column(Enum('admin', 'manager', 'employee', 'auditor', name="role_required_enum"))
    timeout_duration = Column(Integer, nullable=True)
    is_parallel = Column(Boolean, default=False)

    workflow = relationship("Workflow", back_populates="steps")

class DocumentWorkflow(Base):
    __tablename__ = "document_workflows"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    workflow_id = Column(Integer, ForeignKey("workflows.id"))
    current_step = Column(Integer)
    status = Column(Enum("in_progress", "completed", "rejected", "timed_out", name="workflow_status_enum"))
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    rejected_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    timeout_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="document_workflows")
    workflow = relationship("Workflow", back_populates="document_workflows")
    execution_history = relationship("WorkflowExecutionHistory", back_populates="document_workflow")
    rejected_user = relationship("User", foreign_keys=[rejected_by])

class WorkflowExecutionHistory(Base):
    __tablename__ = "workflow_execution_history"

    id = Column(Integer, primary_key=True, index=True)
    document_workflow_id = Column(Integer, ForeignKey("document_workflows.id"))
    step_number = Column(Integer)
    action = Column(String)
    performed_by = Column(Integer, ForeignKey("users.id"))
    performed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    status = Column(Enum("completed", "rejected", "timed_out", name="execution_status_enum"))

    document_workflow = relationship("DocumentWorkflow", back_populates="execution_history")
    user = relationship("User")

class AIModel(Base):
    __tablename__ = "ai_models"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    version = Column(String)
    model_type = Column(String)
    trained_at = Column(DateTime)
    performance_metrics = Column(JSON)

    document_analyses = relationship("DocumentAIAnalysis", back_populates="ai_model")

class DocumentAIAnalysis(Base):
    __tablename__ = "document_ai_analysis"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    ai_model_id = Column(Integer, ForeignKey("ai_models.id"))
    analysis_type = Column(String)
    results = Column(JSON)
    confidence_score = Column(Float)
    processed_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="ai_analyses")
    ai_model = relationship("AIModel", back_populates="document_analyses")

class DocumentMetadata(Base):
    __tablename__ = "document_metadata"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    key = Column(String, nullable=False)
    value = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="document_metadata")

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    text = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", back_populates="annotations")
    user = relationship("User")

class RelatedDocument(Base):
    __tablename__ = "related_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    related_document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    document = relationship("Document", foreign_keys=[document_id])
    related_document = relationship("Document", foreign_keys=[related_document_id])

# ==================== AUDIT MODELS ====================

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    scope = Column(Text, nullable=False)
    audit_type = Column(Enum(AuditType), default=AuditType.compliance)
    status = Column(Enum(AuditStatus), default=AuditStatus.planned)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    deadline = Column(DateTime)
    is_locked = Column(Boolean, default=False)
    estimated_budget = Column(Float)
    actual_cost = Column(Float)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    financial_audit_type = Column(Enum(FinancialAuditType))
    materiality_threshold = Column(Float)
    ai_risk_score = Column(Float)
    ai_suggestions = Column(JSON)
    auto_scheduled_kickoff = Column(Boolean, default=False)
    kickoff_meeting_id = Column(Integer, ForeignKey("audit_meetings.id"), nullable=True)
    
    company = relationship("Company", back_populates="audits")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_audits")
    
    auditors = relationship(
        "User", 
        secondary=audit_auditor_assignment,
        primaryjoin="Audit.id == audit_auditor_assignments.c.audit_id",
        secondaryjoin="User.id == audit_auditor_assignments.c.auditor_id",
        back_populates="assigned_audits"
    )
    
    requirements = relationship("DocumentRequirement", back_populates="audit")
    findings = relationship("AuditFinding", back_populates="audit")
    risk_assessments = relationship("RiskAssessment", back_populates="audit")
        
    audit_documents = relationship("AuditDocument", back_populates="audit")
    conversations = relationship("Conversation", back_populates="audit")
    reports = relationship("AuditReport", back_populates="audit")
    estimated_hours = Column(Float)
    complexity_score = Column(Float)  # 1-10 scale
    budget_lower_bound = Column(Float)
    budget_upper_bound = Column(Float)
    
    # AI and Templates
    audit_methodology = Column(Enum(AuditMethodology), default=AuditMethodology.risk_based)
    compliance_frameworks = Column(JSON)  # List of applicable frameworks
    industry_type = Column(Enum(IndustryType))
    template_id = Column(Integer, ForeignKey("audit_templates.id"), nullable=True)
    template = relationship("AuditTemplate", back_populates="template_audits")

    # Quality Assurance
    requires_approval = Column(Boolean, default=False)
    approval_status = Column(Enum(AuditApprovalStatus), default=AuditApprovalStatus.pending)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    peer_reviewed = Column(Boolean, default=False)
    peer_reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    peer_review_notes = Column(Text)
    
    # AI Learning
    historical_data_used = Column(JSON)  # References to similar past audits
    ai_confidence_score = Column(Float)
    ai_model_version = Column(String(50))
    
    # Rollback capability
    version_number = Column(Integer, default=1)
    parent_audit_id = Column(Integer, ForeignKey("audits.id"), nullable=True)
    is_active_version = Column(Boolean, default=True)

    kickoff_meeting = relationship(
        "AuditMeeting", 
        foreign_keys=[kickoff_meeting_id],
        post_update=True
    )
    meetings = relationship(
        "AuditMeeting", 
        back_populates="audit",
        foreign_keys="AuditMeeting.audit_id"
    )

# New Models
class AuditTemplate(Base):
    __tablename__ = "audit_templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    industry_type = Column(Enum(IndustryType))
    compliance_frameworks = Column(JSON)
    audit_methodology = Column(Enum(AuditMethodology))
    template_data = Column(JSON)  # Stores template structure
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    creator = relationship("User")
    template_audits = relationship("Audit", back_populates="template")

class AuditApprovalWorkflow(Base):
    __tablename__ = "audit_approval_workflows"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    approver_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(AuditApprovalStatus))
    comments = Column(Text)
    requested_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime)
    
    audit = relationship("Audit")
    approver = relationship("User")

class AuditValidationRule(Base):
    __tablename__ = "audit_validation_rules"
    
    id = Column(Integer, primary_key=True)
    rule_name = Column(String(255), nullable=False)
    rule_type = Column(String(100))  # date_logic, budget, availability, etc.
    rule_config = Column(JSON)
    is_active = Column(Boolean, default=True)
    error_message = Column(Text)
    
class AuditorAvailability(Base):
    __tablename__ = "auditor_availability"
    
    id = Column(Integer, primary_key=True)
    auditor_id = Column(Integer, ForeignKey("users.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    availability_type = Column(String(50))  # available, busy, vacation
    max_concurrent_audits = Column(Integer, default=3)
    
    auditor = relationship("User")

class AuditHistoricalData(Base):
    __tablename__ = "audit_historical_data"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    similar_audit_ids = Column(JSON)  # List of similar past audit IDs
    performance_metrics = Column(JSON)
    lessons_learned = Column(Text)
    ai_insights = Column(JSON)
    
    audit = relationship("Audit")
class AuditorInvitation(Base):
    __tablename__ = "auditor_invitations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"))
    email = Column(String(255))
    invited_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(InvitationStatus), default=InvitationStatus.pending)
    role = Column(String(50), default="auditor")
    message = Column(Text)
    invited_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    token = Column(String(255), unique=True)
    expires_at = Column(DateTime)
    temp_password = Column(String(255))
    specialization_required = Column(JSON)
    estimated_hours = Column(Float)
    hourly_rate_offered = Column(Float)
    
    company = relationship("Company", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by], back_populates="sent_invitations")

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    risk_category = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)
    description = Column(Text)
    mitigation_strategy = Column(Text)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit", back_populates="risk_assessments")
    creator = relationship("User")

class AIRiskAssessment(Base):
    __tablename__ = "ai_risk_assessments"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    risk_category = Column(String(255))
    risk_level = Column(Enum(AIRiskLevel))
    confidence_score = Column(Float)
    description = Column(Text)
    ai_reasoning = Column(Text)
    suggested_focus_areas = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")

class FinancialDocumentTemplate(Base):
    __tablename__ = "financial_document_templates"
    
    id = Column(Integer, primary_key=True)
    financial_audit_type = Column(Enum(FinancialAuditType))
    document_type = Column(String(255))
    is_mandatory = Column(Boolean, default=True)
    validation_rules = Column(JSON)
    ai_priority_score = Column(Float)
    description = Column(Text)

class DocumentRequirement(Base):
    __tablename__ = "document_requirements"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    document_type = Column(String(255), nullable=False)
    required_fields = Column(JSON)
    validation_rules = Column(JSON)
    deadline = Column(DateTime)
    is_mandatory = Column(Boolean, default=True)
    auto_escalate = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    ai_priority_score = Column(Float, default=5.0)
    risk_level = Column(String(20), default='medium')
    escalation_level = Column(Integer, default=0)
    last_escalated_at = Column(DateTime)
    notification_sent_at = Column(DateTime)
    compliance_framework = Column(String(50))
    audit = relationship("Audit", back_populates="requirements")
    submissions = relationship("DocumentSubmission", back_populates="requirement")
    creator = relationship("User")
class DocumentSubmission(Base):
    __tablename__ = "document_submissions"
    
    id = Column(Integer, primary_key=True)
    requirement_id = Column(Integer, ForeignKey("document_requirements.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    submitted_by = Column(Integer, ForeignKey("users.id"))
    submitted_at = Column(DateTime, default=datetime.utcnow)
    verification_status = Column(Enum(EvidenceStatus), default=EvidenceStatus.pending)
    reviewed_at = Column(DateTime)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    revision_round = Column(Integer, default=1)
    rejection_reason = Column(Text)
    auto_verified = Column(Boolean, default=False)
    verification_score = Column(Float)
    tags = Column(JSON)
    ai_validation_score = Column(Float)
    ai_validation_notes = Column(Text)
    workflow_stage = Column(Enum(WorkflowStage), default=WorkflowStage.submitted)
    escalation_count = Column(Integer, default=0)
    priority_level = Column(String(20), default='normal')
    compliance_score = Column(Float)
    requirement = relationship("DocumentRequirement", back_populates="submissions")
    document = relationship("Document", back_populates="submissions")
    submitter = relationship("User", foreign_keys=[submitted_by], back_populates="document_submissions")
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    verifications = relationship("DocumentVerification", back_populates="submission")

class DocumentVerification(Base):
    __tablename__ = "document_verifications"
    
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    verified_by = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(EvidenceStatus))
    notes = Column(Text)
    verified_at = Column(DateTime, default=datetime.utcnow)
    is_immutable = Column(Boolean, default=True)
    
    submission = relationship("DocumentSubmission", back_populates="verifications")
    verifier = relationship("User", foreign_keys=[verified_by], back_populates="document_verifications")

# Update the AuditFinding model with new columns
class AuditFinding(Base):
    __tablename__ = "audit_findings"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(FindingSeverity), nullable=False)
    recommendation = Column(Text)
    status = Column(Enum(FindingStatus), default=FindingStatus.open)
    due_date = Column(DateTime)
    estimated_impact = Column(String(50))
    likelihood = Column(String(20))
    risk_score = Column(Float)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Enhanced fields from migration
    finding_id = Column(String(50), unique=True)
    finding_type = Column(String(50), default='compliance')
    ai_detected = Column(Boolean, default=False)
    ai_confidence_score = Column(Float, default=0.0)
    ai_risk_score = Column(Float, default=0.0)
    ai_recommendations = Column(JSON)
    document_id = Column(Integer, ForeignKey("documents.id"))
    document_page = Column(Integer)
    document_section = Column(String(255))
    meeting_id = Column(Integer, ForeignKey("audit_meetings.id"))
    assigned_to = Column(String(255))
    assigned_date = Column(DateTime)
    evidence = Column(JSON)
    remediation_plan = Column(Text)
    remediation_status = Column(String(100))
    remediation_notes = Column(Text)
    
    # New simplified workflow fields
    document_submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    finding_source = Column(String(50), default='manual')
    priority_level = Column(String(20), default='medium')
    impact_assessment = Column(Text)
    root_cause_analysis = Column(Text)
    management_response = Column(Text)
    target_completion_date = Column(Date)
    actual_completion_date = Column(Date)
    verification_evidence = Column(Text)
    closure_notes = Column(Text)
    business_impact = Column(Text)
    regulatory_impact = Column(Text)
    closed_at = Column(DateTime)
    closed_by = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    audit = relationship("Audit", back_populates="findings")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_findings")
    resolver = relationship("User", foreign_keys=[resolved_by], back_populates="resolved_findings")
    closer = relationship("User", foreign_keys=[closed_by])
    action_items = relationship("ActionItem", back_populates="finding")
    evidence_documents = relationship("Document", secondary=finding_evidence, back_populates="evidence_documents")
    related_document = relationship("Document", foreign_keys=[document_id])
    related_meeting = relationship("AuditMeeting", foreign_keys=[meeting_id])
    document_submission = relationship("DocumentSubmission", foreign_keys=[document_submission_id])
    comments = relationship("FindingComment", back_populates="finding")
    workflow_history = relationship("AuditFindingWorkflow", back_populates="finding", cascade="all, delete-orphan")

# Simplified workflow tracking table
class AuditFindingWorkflow(Base):
    __tablename__ = "audit_finding_workflow"
    
    id = Column(Integer, primary_key=True)
    finding_id = Column(Integer, ForeignKey("audit_findings.id"), nullable=False)
    from_status = Column(String(50))
    to_status = Column(String(50), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    change_reason = Column(Text)
    changed_at = Column(DateTime, default=datetime.utcnow)
    workflow_data = Column(JSON, default=lambda: {})
    
    # Fix relationships
    finding = relationship("AuditFinding", back_populates="workflow_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])

# Enhanced FindingComment model (update existing model)
class FindingComment(Base):
    __tablename__ = "finding_comments"
    
    id = Column(Integer, primary_key=True)
    finding_id = Column(Integer, ForeignKey("audit_findings.id"), nullable=False)
    comment = Column(Text, nullable=False)
    comment_type = Column(String(50), default='general')
    comment_category = Column(String(50), default='general')
    is_internal = Column(Boolean, default=False)
    attachment_data = Column(JSON)
    created_by = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    finding = relationship("AuditFinding", back_populates="comments")


class ActionItem(Base):
    __tablename__ = "action_items"
    
    id = Column(Integer, primary_key=True)
    finding_id = Column(Integer, ForeignKey("audit_findings.id"))
    assigned_to = Column(Integer, ForeignKey("users.id"))
    description = Column(Text, nullable=False)
    due_date = Column(DateTime)
    status = Column(Enum(ActionItemStatus), default=ActionItemStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    finding = relationship("AuditFinding", back_populates="action_items")
    assignee = relationship("User", foreign_keys=[assigned_to], back_populates="assigned_actions")

class AuditMeeting(Base):
    __tablename__ = "audit_meetings"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    title = Column(String(255), nullable=False)
    meeting_type = Column(Enum(MeetingType))
    scheduled_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    duration_minutes = Column(Integer, default=60)
    location = Column(String(500))
    meeting_url = Column(String(500))
    recording_url = Column(String(500))
    notes = Column(Text)
    meeting_minutes = Column(Text)
    status = Column(Enum(MeetingStatus), default=MeetingStatus.scheduled)
    action_items_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # New fields
    recurrence_pattern = Column(String(100))
    recurrence_end_date = Column(DateTime)
    preparation_checklist = Column(JSON)
    meeting_objectives = Column(Text)
    meeting_outcomes = Column(Text)
    is_recurring = Column(Boolean, default=False)
    parent_meeting_id = Column(Integer, ForeignKey("audit_meetings.id"))
    external_calendar_id = Column(String(255))
    
    audit = relationship("Audit", back_populates="meetings", foreign_keys=[audit_id])
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_meetings")
    attendees = relationship("MeetingAttendee", back_populates="meeting")
    agenda_items = relationship("MeetingAgendaItem", back_populates="meeting")
    minutes = relationship("MeetingMinutes", backref="meeting")
    feedback = relationship("MeetingFeedback", backref="meeting")
    parent_meeting = relationship("AuditMeeting", remote_side=[id])
    audit = relationship(
        "Audit", 
        back_populates="meetings", 
        foreign_keys=[audit_id]  # Specify which foreign key to use
    )
class MeetingAttendee(Base):
    __tablename__ = "meeting_attendees"
    
    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("audit_meetings.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    is_required = Column(Boolean, default=True)
    has_confirmed = Column(Boolean, default=False)
    attended = Column(Boolean, default=False)
    
    meeting = relationship("AuditMeeting", back_populates="attendees")
    user = relationship("User", back_populates="meeting_attendances")

class MeetingAgendaItem(Base):
    __tablename__ = "meeting_agenda_items"
    
    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("audit_meetings.id"))
    title = Column(String(255), nullable=False)
    description = Column(Text)
    time_allocation = Column(Integer)
    order_index = Column(Integer)
    is_completed = Column(Boolean, default=False)
    
    meeting = relationship("AuditMeeting", back_populates="agenda_items")

class AuditDocument(Base):
    __tablename__ = "audit_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    added_at = Column(DateTime, default=datetime.utcnow)
    added_by = Column(Integer, ForeignKey("users.id"))
    
    audit = relationship("Audit", back_populates="audit_documents")
    document = relationship("Document", back_populates="audit_documents")
    user = relationship("User")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    title = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit", back_populates="conversations")
    participants = relationship("User", secondary=conversation_participants, back_populates="conversations")
    messages = relationship("Message", back_populates="conversation")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.text)
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")

class AuditReport(Base):
    __tablename__ = "audit_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    title = Column(String(255), nullable=False)
    executive_summary = Column(Text)
    sections = Column(JSON)
    status = Column(Enum(ReportStatus), default=ReportStatus.draft)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    audit = relationship("Audit", back_populates="reports")
    creator = relationship("User", foreign_keys=[created_by], back_populates="created_reports")


class DocumentRequirementTemplate(Base):
    __tablename__ = "document_requirement_templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    document_type = Column(String(255), nullable=False)
    financial_audit_type = Column(String(50))
    industry_type = Column(String(50))
    compliance_frameworks = Column(JSON)
    ai_priority_score = Column(Float, default=5.0)
    risk_assessment = Column(JSON)
    validation_rules = Column(JSON)
    required_fields = Column(JSON)
    is_mandatory = Column(Boolean, default=True)
    auto_escalate = Column(Boolean, default=False)
    escalation_threshold_hours = Column(Integer, default=48)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class DocumentSubmissionWorkflow(Base):
    __tablename__ = "document_submission_workflow"
    
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    stage = Column(Enum(WorkflowStage), nullable=False)
    status = Column(String(50), nullable=False)
    performer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    performer_type = Column(Enum(ActorType))
    notes = Column(Text)
    validation_score = Column(Float)
    confidence_score = Column(Float)
    stage_duration_minutes = Column(Integer)
    automated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    submission = relationship("DocumentSubmission")
    performer = relationship("User")

class DocumentVerificationChain(Base):
    __tablename__ = "document_verification_chain"
    
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    verification_id = Column(Integer, ForeignKey("document_verifications.id"))
    previous_hash = Column(String(64))
    current_hash = Column(String(64), nullable=False)
    verification_data = Column(JSON, nullable=False)
    block_number = Column(Integer, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_immutable = Column(Boolean, default=True)
    
    submission = relationship("DocumentSubmission")
    verification = relationship("DocumentVerification")

class RequirementEscalation(Base):
    __tablename__ = "requirement_escalations"
    
    id = Column(Integer, primary_key=True)
    requirement_id = Column(Integer, ForeignKey("document_requirements.id"))
    escalation_level = Column(Integer, nullable=False)
    escalated_to_id = Column(Integer, ForeignKey("users.id"))
    escalated_by_id = Column(Integer, ForeignKey("users.id"))
    escalation_reason = Column(Text)
    escalation_type = Column(Enum(EscalationType))
    resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    requirement = relationship("DocumentRequirement")
    escalated_to = relationship("User", foreign_keys=[escalated_to_id])
    escalated_by = relationship("User", foreign_keys=[escalated_by_id])

class DocumentAuditTrail(Base):
    __tablename__ = "document_audit_trail"
    
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    action = Column(String(100), nullable=False)
    actor_id = Column(Integer, ForeignKey("users.id"))
    actor_type = Column(Enum(ActorType))
    details = Column(JSON)
    ip_address = Column(INET)
    user_agent = Column(Text)
    session_id = Column(String(255))
    timestamp = Column(DateTime, default=datetime.utcnow)
    hash_chain = Column(String(64))
    
    submission = relationship("DocumentSubmission")
    actor = relationship("User")

class AIDocumentValidation(Base):
    __tablename__ = "ai_document_validations"
    
    id = Column(Integer, primary_key=True)
    submission_id = Column(Integer, ForeignKey("document_submissions.id"))
    ai_model_version = Column(String(50))
    validation_type = Column(String(50))
    validation_score = Column(Float)
    confidence_score = Column(Float)
    validation_results = Column(JSON)
    issues_found = Column(JSONB)
    recommendations = Column(JSON)
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    submission = relationship("DocumentSubmission")

class ComplianceCheckpoint(Base):
    __tablename__ = "compliance_checkpoints"
    
    id = Column(Integer, primary_key=True)
    audit_id = Column(Integer, ForeignKey("audits.id"))
    requirement_id = Column(Integer, ForeignKey("document_requirements.id"))
    checkpoint_type = Column(String(50))
    status = Column(Enum(ComplianceStatus))
    score = Column(Float)
    details = Column(JSON)
    checked_at = Column(DateTime, default=datetime.utcnow)
    next_check_at = Column(DateTime)
    
    audit = relationship("Audit")
    requirement = relationship("DocumentRequirement")

class AuditNotification(Base):
    __tablename__ = "audit_notifications"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    audit_id = Column(Integer, ForeignKey("audits.id"))
    notification_type = Column(String(50))
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.normal)
    data = Column(JSON)
    read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
    audit = relationship("Audit")

class MeetingTemplate(Base):
    __tablename__ = "meeting_templates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    meeting_type = Column(String(50), nullable=False)
    default_duration = Column(Integer, default=60)
    default_agenda = Column(JSON)
    company_id = Column(Integer, ForeignKey("companies.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    company = relationship("Company")
    creator = relationship("User")

class MeetingMinutes(Base):
    __tablename__ = "meeting_minutes"
    
    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("audit_meetings.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    approved_by = Column(Integer, ForeignKey("users.id"))
    version = Column(Integer, default=1)
    
    creator = relationship("User", foreign_keys=[created_by])
    approver = relationship("User", foreign_keys=[approved_by])

class MeetingFeedback(Base):
    __tablename__ = "meeting_feedback"
    
    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer, ForeignKey("audit_meetings.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer)
    comments = Column(Text)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")
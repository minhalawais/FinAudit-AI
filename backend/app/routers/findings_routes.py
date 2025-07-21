from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
from app.database import get_db
from app.models import (
    User, Audit, AuditFinding, FindingSeverity, 
    DocumentSubmission, ActionItem, UserRole, DocumentRequirement
)
from app.routers.auth import get_current_user
from sqlalchemy import and_, or_, func

router = APIRouter()

# Helper function to check if user is an auditor
def check_auditor_role(current_user: User):
    if current_user.role != UserRole.auditor and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only auditors can perform this action"
        )

# Helper function to set due date based on severity
def set_due_date_from_severity(severity: FindingSeverity) -> datetime:
    now = datetime.utcnow()
    if severity == FindingSeverity.critical:
        return now + timedelta(hours=24)
    elif severity == FindingSeverity.major:
        return now + timedelta(hours=72)
    elif severity == FindingSeverity.minor:
        return now + timedelta(days=7)
    else:  # informational
        return now + timedelta(days=14)

# E. Findings & Actions
@router.post("/findings/auto-generate")
async def auto_generate_findings(
    audit_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI analysis to automatically generate findings
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    if "audit_id" not in audit_data:
        raise HTTPException(status_code=400, detail="audit_id is required")
    
    audit_id = audit_data["audit_id"]
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # In a real system, this would use an AI model to analyze submissions and generate findings
    # For now, we'll return mock findings based on the audit's submissions
    
    # Get all submissions for the audit
    submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).filter(
        DocumentRequirement.audit_id == audit_id
    ).all()
    
    # Generate mock findings
    generated_findings = []
    
    # Example: Find missing documents
    requirements_with_submissions = set(sub.requirement_id for sub in submissions)
    all_requirements = set(req.id for req in audit.requirements)
    missing_requirements = all_requirements - requirements_with_submissions
    
    if missing_requirements:
        finding = AuditFinding(
            audit_id=audit_id,
            title="Missing Required Documents",
            description=f"The following document requirements have no submissions: {', '.join(map(str, missing_requirements))}",
            severity=FindingSeverity.major,
            recommendation="Request the missing documents from the auditee",
            created_by=current_user.id,
            due_date=set_due_date_from_severity(FindingSeverity.major)
        )
        db.add(finding)
        db.commit()
        db.refresh(finding)
        generated_findings.append({
            "id": finding.id,
            "title": finding.title,
            "severity": finding.severity.value,
            "due_date": finding.due_date.isoformat()
        })
    
    # Example: Find rejected submissions
    rejected_submissions = [sub for sub in submissions if sub.verification_status.value == "rejected"]
    if rejected_submissions:
        finding = AuditFinding(
            audit_id=audit_id,
            title="Rejected Document Submissions",
            description=f"{len(rejected_submissions)} document submissions were rejected and need revision",
            severity=FindingSeverity.minor,
            recommendation="Follow up with the auditee to revise and resubmit the rejected documents",
            created_by=current_user.id,
            due_date=set_due_date_from_severity(FindingSeverity.minor)
        )
        db.add(finding)
        db.commit()
        db.refresh(finding)
        generated_findings.append({
            "id": finding.id,
            "title": finding.title,
            "severity": finding.severity.value,
            "due_date": finding.due_date.isoformat()
        })
    
    return {
        "message": f"Generated {len(generated_findings)} findings",
        "findings": generated_findings
    }

@router.post("/findings/{finding_id}/link-docs")
async def link_documents_to_finding(
    finding_id: int,
    link_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Associate evidence documents with a finding
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    if "submission_ids" not in link_data or not isinstance(link_data["submission_ids"], list):
        raise HTTPException(status_code=400, detail="submission_ids list is required")
    
    submission_ids = link_data["submission_ids"]
    
    # Get the finding
    finding = db.query(AuditFinding).join(Audit).filter(
        AuditFinding.id == finding_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    # Get the submissions
    submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(
        Audit
    ).filter(
        DocumentSubmission.id.in_(submission_ids),
        Audit.id == finding.audit_id
    ).all()
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No valid submissions found")
    
    # Link submissions to the finding
    for submission in submissions:
        submission.finding_id = finding_id
    
    db.commit()
    
    return {
        "message": f"Linked {len(submissions)} documents to finding",
        "finding": {
            "id": finding.id,
            "title": finding.title
        },
        "linked_submissions": [
            {
                "id": sub.id,
                "document_id": sub.document_id,
                "document_title": sub.document.title if sub.document else None
            }
            for sub in submissions
        ]
    }

@router.get("/actions/reminders")
async def list_overdue_actions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List overdue action items
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can access action items"
        )
    
    # Build query for action items
    query = db.query(ActionItem).join(
        AuditFinding
    ).join(
        Audit
    ).filter(
        Audit.company_id == current_user.company_id,
        ActionItem.status == "pending",
        ActionItem.due_date < datetime.utcnow()
    )
    
    # If user is an auditee, only show actions assigned to them
    if current_user.role == UserRole.auditee:
        query = query.filter(ActionItem.assigned_to == current_user.id)
    
    overdue_actions = query.order_by(ActionItem.due_date.asc()).all()
    
    return {
        "overdue_actions": [
            {
                "id": action.id,
                "description": action.description,
                "due_date": action.due_date.isoformat(),
                "days_overdue": (datetime.utcnow() - action.due_date).days,
                "finding": {
                    "id": action.finding.id,
                    "title": action.finding.title,
                    "severity": action.finding.severity.value
                },
                "assigned_to": {
                    "id": action.assignee.id,
                    "name": f"{action.assignee.f_name} {action.assignee.l_name}"
                }
            }
            for action in overdue_actions
        ]
    }

@router.post("/findings/{finding_id}/actions")
async def create_action_item(
    finding_id: int,
    action_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create an action item for a finding
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    required_fields = ["description", "assigned_to"]
    for field in required_fields:
        if field not in action_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Get the finding
    finding = db.query(AuditFinding).join(Audit).filter(
        AuditFinding.id == finding_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    # Parse due date if provided
    due_date = None
    if "due_date" in action_data:
        try:
            due_date = datetime.fromisoformat(action_data["due_date"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid due_date format. Use ISO format (YYYY-MM-DD)")
    else:
        # Default due date based on finding severity
        due_date = set_due_date_from_severity(finding.severity)
    
    # Create action item
    action_item = ActionItem(
        finding_id=finding_id,
        assigned_to=action_data["assigned_to"],
        description=action_data["description"],
        due_date=due_date,
        status="pending",
        meeting_id=action_data.get("meeting_id")
    )
    
    db.add(action_item)
    db.commit()
    db.refresh(action_item)
    
    return {
        "message": "Action item created successfully",
        "action_item": {
            "id": action_item.id,
            "description": action_item.description,
            "due_date": action_item.due_date.isoformat(),
            "status": action_item.status,
            "assigned_to": action_item.assigned_to
        }
    }

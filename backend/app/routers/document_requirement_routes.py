from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta
import json
from app.database import get_db
from app.models import (
    User, Audit, DocumentRequirement, UserRole
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

# B. Document Requirements (Auditor Only)
@router.post("/audits/{audit_id}/requirements")
async def create_requirement(
    audit_id: int,
    requirement_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new document requirement for an audit
    """
    check_auditor_role(current_user)
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.is_locked:
        raise HTTPException(status_code=400, detail="Cannot add requirements to a locked audit")
    
    # Validate required fields
    required_fields = ["document_type"]
    for field in required_fields:
        if field not in requirement_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Parse deadline if provided
    deadline = None
    if "deadline" in requirement_data:
        try:
            deadline = datetime.fromisoformat(requirement_data["deadline"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline format. Use ISO format (YYYY-MM-DD)")
    
    # Create new requirement
    new_requirement = DocumentRequirement(
        audit_id=audit_id,
        document_type=requirement_data["document_type"],
        required_fields=requirement_data.get("required_fields", {}),
        validation_rules=requirement_data.get("validation_rules", {}),
        deadline=deadline,
        is_mandatory=requirement_data.get("is_mandatory", True),
        auto_escalate=requirement_data.get("auto_escalate", True)
    )
    
    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)
    
    return {
        "message": "Document requirement created successfully",
        "requirement": {
            "id": new_requirement.id,
            "document_type": new_requirement.document_type,
            "required_fields": new_requirement.required_fields,
            "validation_rules": new_requirement.validation_rules,
            "deadline": new_requirement.deadline.isoformat() if new_requirement.deadline else None,
            "is_mandatory": new_requirement.is_mandatory,
            "auto_escalate": new_requirement.auto_escalate
        }
    }

@router.put("/requirements/{req_id}")
async def update_requirement(
    req_id: int,
    requirement_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an existing document requirement
    """
    check_auditor_role(current_user)
    
    # Get the requirement
    requirement = db.query(DocumentRequirement).join(Audit).filter(
        DocumentRequirement.id == req_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Check if audit is locked
    if requirement.audit.is_locked:
        raise HTTPException(status_code=400, detail="Cannot update requirements for a locked audit")
    
    # Update fields
    if "document_type" in requirement_data:
        requirement.document_type = requirement_data["document_type"]
    
    if "required_fields" in requirement_data:
        requirement.required_fields = requirement_data["required_fields"]
    
    if "validation_rules" in requirement_data:
        requirement.validation_rules = requirement_data["validation_rules"]
    
    if "deadline" in requirement_data:
        try:
            requirement.deadline = datetime.fromisoformat(requirement_data["deadline"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid deadline format. Use ISO format (YYYY-MM-DD)")
    
    if "is_mandatory" in requirement_data:
        requirement.is_mandatory = requirement_data["is_mandatory"]
    
    if "auto_escalate" in requirement_data:
        requirement.auto_escalate = requirement_data["auto_escalate"]
    
    db.commit()
    db.refresh(requirement)
    
    return {
        "message": "Document requirement updated successfully",
        "requirement": {
            "id": requirement.id,
            "document_type": requirement.document_type,
            "required_fields": requirement.required_fields,
            "validation_rules": requirement.validation_rules,
            "deadline": requirement.deadline.isoformat() if requirement.deadline else None,
            "is_mandatory": requirement.is_mandatory,
            "auto_escalate": requirement.auto_escalate
        }
    }

@router.post("/requirements/{req_id}/auto-request")
async def auto_request_documents(
    req_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI-suggest documents for a requirement
    """
    check_auditor_role(current_user)
    
    # Get the requirement
    requirement = db.query(DocumentRequirement).join(Audit).filter(
        DocumentRequirement.id == req_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # This would typically involve an AI model to suggest documents
    # For now, we'll return a mock response
    
    # Example AI-suggested documents based on the requirement
    suggested_documents = []
    
    if requirement.document_type.lower() == "invoice":
        suggested_documents = [
            {
                "title": "Q1 Vendor Invoice",
                "description": "Quarterly invoice from main vendor",
                "confidence": 0.92,
                "matches_rules": True
            },
            {
                "title": "Annual Service Contract",
                "description": "Contains payment terms and invoice schedule",
                "confidence": 0.85,
                "matches_rules": True
            }
        ]
    elif requirement.document_type.lower() == "policy":
        suggested_documents = [
            {
                "title": "Corporate Policy Manual",
                "description": "Contains all company policies",
                "confidence": 0.95,
                "matches_rules": True
            },
            {
                "title": "Department Procedures",
                "description": "Specific procedures for each department",
                "confidence": 0.78,
                "matches_rules": False
            }
        ]
    
    return {
        "message": "AI document suggestions generated",
        "requirement": {
            "id": requirement.id,
            "document_type": requirement.document_type
        },
        "suggested_documents": suggested_documents
    }

@router.get("/audits/{audit_id}/requirements")
async def list_requirements(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all document requirements for an audit
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can access audit requirements"
        )
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get requirements
    requirements = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    ).all()
    
    return {
        "requirements": [
            {
                "id": req.id,
                "document_type": req.document_type,
                "required_fields": req.required_fields,
                "validation_rules": req.validation_rules,
                "deadline": req.deadline.isoformat() if req.deadline else None,
                "is_mandatory": req.is_mandatory,
                "auto_escalate": req.auto_escalate,
                "submissions_count": len(req.submissions)
            }
            for req in requirements
        ]
    }

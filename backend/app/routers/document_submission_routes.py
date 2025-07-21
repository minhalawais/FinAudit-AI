from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import hashlib
import os
import shutil
from app.database import get_db
from app.models import (
    User, Audit, DocumentRequirement, DocumentSubmission, 
    EvidenceStatus, UserRole, Document, AuditStatus
)
from app.routers.auth import get_current_user
from sqlalchemy import and_, or_, func

router = APIRouter()

# Helper function to check if user is an auditee
def check_auditee_role(current_user: User):
    if current_user.role != UserRole.auditee and current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=403,
            detail="Only auditees can perform this action"
        )

# Helper function to validate document against requirement rules
def validate_document_against_rules(document, metadata, requirement):
    # This would be a more complex validation in a real system
    validation_errors = []
    
    # Check required fields
    if requirement.required_fields:
        for field, field_type in requirement.required_fields.items():
            if field not in metadata:
                validation_errors.append(f"Missing required field: {field}")
    
    # Check validation rules
    if requirement.validation_rules:
        for rule, value in requirement.validation_rules.items():
            if rule == "min_amount" and "amount" in metadata:
                try:
                    amount = float(metadata["amount"])
                    if amount < value:
                        validation_errors.append(f"Amount {amount} is less than minimum required: {value}")
                except (ValueError, TypeError):
                    validation_errors.append("Invalid amount format")
            
            elif rule == "required_fields":
                for required_field in value:
                    if required_field not in metadata:
                        validation_errors.append(f"Missing required field: {required_field}")
    
    return validation_errors

# C. Document Submission (Dual-Portal)
@router.post("/submissions")
async def submit_document(
    file: UploadFile = File(...),
    requirement_id: int = Form(...),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submit a document for a requirement
    """
    check_auditee_role(current_user)
    
    # Parse metadata
    try:
        metadata_dict = json.loads(metadata)
        if not isinstance(metadata_dict, dict):
            raise ValueError("Metadata must be a JSON object")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Get the requirement
    requirement = db.query(DocumentRequirement).join(Audit).filter(
        DocumentRequirement.id == requirement_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Check if audit is locked for submissions
    if requirement.audit.status in [AuditStatus.completed, AuditStatus.cancelled, AuditStatus.archived]:
        raise HTTPException(status_code=400, detail="Cannot submit documents for a completed, cancelled, or archived audit")
    
    # Save the file
    file_content = await file.read()
    file_hash = hashlib.sha256(file_content).hexdigest()
    
    # Create upload directory if it doesn't exist
    upload_dir = f"uploads/audit_{requirement.audit_id}/requirement_{requirement_id}"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Save the file with a unique name
    file_extension = os.path.splitext(file.filename)[1]
    file_path = f"{upload_dir}/{file_hash}{file_extension}"
    
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # Create document record
    document = Document(
        title=metadata_dict.get("title", file.filename),
        file_path=file_path,
        file_type=file.content_type,
        file_size=len(file_content),
        owner_id=current_user.id,
        company_id=current_user.company_id
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    # Validate document against requirement rules
    validation_errors = validate_document_against_rules(document, metadata_dict, requirement)
    
    # Create submission record
    submission = DocumentSubmission(
        requirement_id=requirement_id,
        document_id=document.id,
        submitted_by=current_user.id,
        document_metadata=metadata_dict,
        verification_status=EvidenceStatus.pending if not validation_errors else EvidenceStatus.needs_revision,
        hash_sha256=file_hash
    )
    
    if validation_errors:
        submission.rejection_reason = "Automatic rejection due to validation errors: " + ", ".join(validation_errors)
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {
        "message": "Document submitted successfully" if not validation_errors else "Document submitted with validation errors",
        "submission": {
            "id": submission.id,
            "document_id": document.id,
            "status": submission.verification_status.value,
            "validation_errors": validation_errors,
            "submitted_at": submission.submitted_at.isoformat()
        }
    }

@router.put("/submissions/{sub_id}/revise")
async def revise_submission(
    sub_id: int,
    file: Optional[UploadFile] = File(None),
    metadata: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revise a rejected submission
    """
    check_auditee_role(current_user)
    
    # Parse metadata
    try:
        metadata_dict = json.loads(metadata)
        if not isinstance(metadata_dict, dict):
            raise ValueError("Metadata must be a JSON object")
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid metadata JSON format")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Get the submission
    submission = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(
        Audit
    ).filter(
        DocumentSubmission.id == sub_id,
        DocumentSubmission.submitted_by == current_user.id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission.verification_status not in [EvidenceStatus.rejected, EvidenceStatus.needs_revision]:
        raise HTTPException(status_code=400, detail="Only rejected submissions can be revised")
    
    # Update metadata
    submission.metadata = metadata_dict
    
    # If a new file is provided, update the document
    if file:
        file_content = await file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Create upload directory if it doesn't exist
        upload_dir = f"uploads/audit_{submission.requirement.audit_id}/requirement_{submission.requirement_id}"
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save the file with a unique name
        file_extension = os.path.splitext(file.filename)[1]
        file_path = f"{upload_dir}/{file_hash}{file_extension}"
        
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        # Update document record
        document = submission.document
        document.title = metadata_dict.get("title", file.filename)
        document.file_path = file_path
        document.file_type = file.content_type
        document.file_size = len(file_content)
        document.updated_at = datetime.utcnow()
        
        # Update submission
        submission.hash_sha256 = file_hash
    
    # Validate document against requirement rules
    validation_errors = validate_document_against_rules(
        submission.document, metadata_dict, submission.requirement
    )
    
    # Update submission status
    submission.verification_status = EvidenceStatus.pending if not validation_errors else EvidenceStatus.needs_revision
    submission.revision_round += 1
    
    if validation_errors:
        submission.rejection_reason = "Automatic rejection due to validation errors: " + ", ".join(validation_errors)
    else:
        submission.rejection_reason = None
    
    db.commit()
    db.refresh(submission)
    
    return {
        "message": "Submission revised successfully" if not validation_errors else "Submission revised with validation errors",
        "submission": {
            "id": submission.id,
            "document_id": submission.document_id,
            "status": submission.verification_status.value,
            "validation_errors": validation_errors,
            "revision_round": submission.revision_round,
            "submitted_at": submission.submitted_at.isoformat()
        }
    }

@router.get("/audits/{audit_id}/submissions")
async def list_submissions(
    audit_id: int,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all submissions for an audit
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can access audit submissions"
        )
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Build query for submissions
    query = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).filter(
        DocumentRequirement.audit_id == audit_id
    )
    
    # If user is an auditee, only show their submissions
    if current_user.role == UserRole.auditee:
        query = query.filter(DocumentSubmission.submitted_by == current_user.id)
    
    # Filter by status if provided
    if status:
        try:
            evidence_status = EvidenceStatus[status]
            query = query.filter(DocumentSubmission.verification_status == evidence_status)
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status: {status}")
    
    submissions = query.order_by(DocumentSubmission.submitted_at.desc()).all()
    
    return {
        "submissions": [
            {
                "id": sub.id,
                "requirement_id": sub.requirement_id,
                "document_type": sub.requirement.document_type,
                "document_id": sub.document_id,
                "document_title": sub.document.title if sub.document else None,
                "status": sub.verification_status.value,
                "submitted_by": {
                    "id": sub.submitter.id,
                    "name": f"{sub.submitter.f_name} {sub.submitter.l_name}"
                },
                "submitted_at": sub.submitted_at.isoformat(),
                "revision_round": sub.revision_round,
                "rejection_reason": sub.rejection_reason
            }
            for sub in submissions
        ]
    }

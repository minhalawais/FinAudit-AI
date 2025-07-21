from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime
import json
from app.database import get_db
from app.models import (
    User, DocumentSubmission, DocumentVerification, 
    EvidenceStatus, UserRole, DocumentRequirement, Audit
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

# D. Verification Workflow (Auditor Only)
@router.post("/submissions/{sub_id}/verify")
async def verify_submission(
    sub_id: int,
    verification_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve or reject a document submission
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    if "status" not in verification_data:
        raise HTTPException(status_code=400, detail="Status is required")
    
    status = verification_data["status"]
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    # Get the submission
    submission = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(
        Audit
    ).filter(
        DocumentSubmission.id == sub_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    if submission.verification_status not in [EvidenceStatus.pending]:
        raise HTTPException(status_code=400, detail="Only pending submissions can be verified")
    
    # Create verification record
    verification = DocumentVerification(
        submission_id=sub_id,
        verified_by=current_user.id,
        status=EvidenceStatus.approved if status == "approved" else EvidenceStatus.rejected,
        notes=verification_data.get("notes", ""),
        verified_at=datetime.utcnow()
    )
    
    db.add(verification)
    
    # Update submission status
    submission.verification_status = EvidenceStatus.approved if status == "approved" else EvidenceStatus.rejected
    
    if status == "rejected":
        submission.rejection_reason = verification_data.get("notes", "No reason provided")
    
    # Handle escalation if specified
    escalate_to = verification_data.get("escalate_to")
    if escalate_to:
        # In a real system, this would send an email or notification
        # For now, we'll just log it in the verification notes
        verification.notes = f"{verification.notes}\n\nEscalated to: {escalate_to}"
    
    db.commit()
    db.refresh(verification)
    
    return {
        "message": f"Submission {status}",
        "verification": {
            "id": verification.id,
            "status": verification.status.value,
            "notes": verification.notes,
            "verified_at": verification.verified_at.isoformat(),
            "verified_by": {
                "id": current_user.id,
                "name": f"{current_user.f_name} {current_user.l_name}"
            }
        }
    }

@router.get("/submissions/{sub_id}/versions")
async def get_submission_versions(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    View revision history of a submission
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can access submission versions"
        )
    
    # Get the submission
    submission = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(
        Audit
    ).filter(
        DocumentSubmission.id == sub_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    # If user is an auditee, check if they are the submitter
    if current_user.role == UserRole.auditee and submission.submitted_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only view your own submissions")
    
    # Get verifications
    verifications = db.query(DocumentVerification).filter(
        DocumentVerification.submission_id == sub_id
    ).order_by(DocumentVerification.verified_at.desc()).all()
    
    return {
        "submission": {
            "id": submission.id,
            "requirement_id": submission.requirement_id,
            "document_type": submission.requirement.document_type,
            "document_id": submission.document_id,
            "document_title": submission.document.title if submission.document else None,
            "status": submission.verification_status.value,
            "submitted_by": {
                "id": submission.submitter.id,
                "name": f"{submission.submitter.f_name} {submission.submitter.l_name}"
            },
            "submitted_at": submission.submitted_at.isoformat(),
            "revision_round": submission.revision_round,
            "rejection_reason": submission.rejection_reason
        },
        "verifications": [
            {
                "id": v.id,
                "status": v.status.value,
                "notes": v.notes,
                "verified_at": v.verified_at.isoformat(),
                "verified_by": {
                    "id": v.verifier.id,
                    "name": f"{v.verifier.f_name} {v.verifier.l_name}"
                }
            }
            for v in verifications
        ]
    }

@router.post("/submissions/bulk-verify")
async def bulk_verify_submissions(
    verification_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Batch processing of multiple submissions
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    if "submission_ids" not in verification_data or not isinstance(verification_data["submission_ids"], list):
        raise HTTPException(status_code=400, detail="submission_ids list is required")
    
    if "status" not in verification_data:
        raise HTTPException(status_code=400, detail="Status is required")
    
    status = verification_data["status"]
    if status not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Status must be 'approved' or 'rejected'")
    
    submission_ids = verification_data["submission_ids"]
    notes = verification_data.get("notes", "")
    
    # Get the submissions
    submissions = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).join(
        Audit
    ).filter(
        DocumentSubmission.id.in_(submission_ids),
        Audit.company_id == current_user.company_id,
        DocumentSubmission.verification_status == EvidenceStatus.pending
    ).all()
    
    if not submissions:
        raise HTTPException(status_code=404, detail="No valid pending submissions found")
    
    # Process each submission
    results = []
    for submission in submissions:
        # Create verification record
        verification = DocumentVerification(
            submission_id=submission.id,
            verified_by=current_user.id,
            status=EvidenceStatus.approved if status == "approved" else EvidenceStatus.rejected,
            notes=notes,
            verified_at=datetime.utcnow()
        )
        
        db.add(verification)
        
        # Update submission status
        submission.verification_status = EvidenceStatus.approved if status == "approved" else EvidenceStatus.rejected
        
        if status == "rejected":
            submission.rejection_reason = notes or "No reason provided"
        
        results.append({
            "id": submission.id,
            "status": submission.verification_status.value
        })
    
    db.commit()
    
    return {
        "message": f"Bulk {status} completed",
        "processed_count": len(results),
        "results": results
    }

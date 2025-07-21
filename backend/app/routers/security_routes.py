from fastapi import APIRouter, Depends, HTTPException, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime
import json
import hashlib
import os
import io
import zipfile
from app.database import get_db
from app.models import (
    User, Audit, AuditStatus, DocumentSubmission, 
    DocumentVerification, UserRole, DocumentRequirement, AuditMeeting, MeetingAttendee, MeetingAgendaItem
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

# G. Security & Compliance
@router.post("/audits/{audit_id}/freeze")
async def freeze_audit(
    audit_id: int,
    freeze_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Tamper lockdown of an audit
    """
    check_auditor_role(current_user)
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status == AuditStatus.archived:
        raise HTTPException(status_code=400, detail="Audit is already archived")
    
    # Validate reason
    reason = freeze_data.get("reason")
    if not reason:
        raise HTTPException(status_code=400, detail="Reason for freezing is required")
    
    # Archive the audit
    audit.status = AuditStatus.archived
    audit.end_date = datetime.utcnow()
    
    # Add a note about the archiving
    archive_note = f"\n\nARCHIVED ON {datetime.utcnow().isoformat()} BY {current_user.username}. REASON: {reason}"
    audit.description = (audit.description or "") + archive_note
    
    db.commit()
    
    return {
        "message": "Audit frozen and archived successfully",
        "audit": {
            "id": audit.id,
            "name": audit.name,
            "status": audit.status.value,
            "archived_at": audit.end_date.isoformat()
        }
    }

@router.get("/submissions/{sub_id}/custody")
async def get_submission_custody_chain(
    sub_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get chain of custody for a document submission
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can access submission custody chain"
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
        raise HTTPException(status_code=403, detail="You can only view custody chain for your own submissions")
    
    # Get verifications
    verifications = db.query(DocumentVerification).filter(
        DocumentVerification.submission_id == sub_id
    ).order_by(DocumentVerification.verified_at).all()
    
    # Build custody chain
    custody_chain = [
        {
            "event": "Document Submitted",
            "timestamp": submission.submitted_at.isoformat(),
            "user": {
                "id": submission.submitter.id,
                "name": f"{submission.submitter.f_name} {submission.submitter.l_name}",
                "role": submission.submitter.role.value
            },
            "hash": submission.hash_sha256,
            "metadata": submission.document_metadata
        }
    ]
    
    for verification in verifications:
        custody_chain.append({
            "event": f"Document {verification.status.value.capitalize()}",
            "timestamp": verification.verified_at.isoformat(),
            "user": {
                "id": verification.verifier.id,
                "name": f"{verification.verifier.f_name} {verification.verifier.l_name}",
                "role": verification.verifier.role.value
            },
            "notes": verification.notes,
            "is_immutable": verification.is_immutable
        })
    
    return {
        "submission": {
            "id": submission.id,
            "document_id": submission.document_id,
            "document_type": submission.requirement.document_type,
            "status": submission.verification_status.value,
            "hash": submission.hash_sha256
        },
        "custody_chain": custody_chain
    }

@router.get("/audits/{audit_id}/export")
async def export_audit_archive(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    WORM-compliant archive of an audit
    """
    check_auditor_role(current_user)
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create a ZIP file in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
        # Add audit metadata
        audit_metadata = {
            "id": audit.id,
            "name": audit.name,
            "description": audit.description,
            "scope": audit.scope,
            "status": audit.status.value,
            "start_date": audit.start_date.isoformat() if audit.start_date else None,
            "end_date": audit.end_date.isoformat() if audit.end_date else None,
            "deadline": audit.deadline.isoformat() if audit.deadline else None,
            "is_locked": audit.is_locked,
            "created_at": audit.created_at.isoformat(),
            "created_by": {
                "id": audit.creator.id,
                "name": f"{audit.creator.f_name} {audit.creator.l_name}",
                "role": audit.creator.role.value
            }
        }
        
        zip_file.writestr("audit_metadata.json", json.dumps(audit_metadata, indent=2))
        
        # Add requirements
        requirements_data = [
            {
                "id": req.id,
                "document_type": req.document_type,
                "required_fields": req.required_fields,
                "validation_rules": req.validation_rules,
                "deadline": req.deadline.isoformat() if req.deadline else None,
                "is_mandatory": req.is_mandatory
            }
            for req in audit.requirements
        ]
        
        zip_file.writestr("requirements.json", json.dumps(requirements_data, indent=2))
        
        # Add submissions
        submissions = []
        for req in audit.requirements:
            for sub in req.submissions:
                submission_data = {
                    "id": sub.id,
                    "requirement_id": sub.requirement_id,
                    "document_id": sub.document_id,
                    "document_title": sub.document.title if sub.document else None,
                    "status": sub.verification_status.value,
                    "submitted_by": {
                        "id": sub.submitter.id,
                        "name": f"{sub.submitter.f_name} {sub.submitter.l_name}"
                    },
                    "submitted_at": sub.submitted_at.isoformat(),
                    "revision_round": sub.revision_round,
                    "hash_sha256": sub.hash_sha256,
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
                        for v in sub.verifications
                    ]
                }
                submissions.append(submission_data)
                
                # Add document content if available
                if sub.document and sub.document.file_path and os.path.exists(sub.document.file_path):
                    try:
                        with open(sub.document.file_path, "rb") as doc_file:
                            doc_content = doc_file.read()
                            zip_file.writestr(f"documents/{sub.document_id}_{os.path.basename(sub.document.file_path)}", doc_content)
                    except Exception as e:
                        # Log error but continue
                        print(f"Error adding document {sub.document_id} to archive: {str(e)}")
        
        zip_file.writestr("submissions.json", json.dumps(submissions, indent=2))
        
        # Add findings
        findings_data = [
            {
                "id": finding.id,
                "title": finding.title,
                "description": finding.description,
                "severity": finding.severity.value,
                "recommendation": finding.recommendation,
                "status": finding.status,
                "due_date": finding.due_date.isoformat() if finding.due_date else None,
                "created_at": finding.created_at.isoformat(),
                "created_by": {
                    "id": finding.creator.id,
                    "name": f"{finding.creator.f_name} {finding.creator.l_name}"
                },
                "resolved_at": finding.resolved_at.isoformat() if finding.resolved_at else None,
                "action_items": [
                    {
                        "id": action.id,
                        "description": action.description,
                        "due_date": action.due_date.isoformat() if action.due_date else None,
                        "status": action.status,
                        "assigned_to": {
                            "id": action.assignee.id,
                            "name": f"{action.assignee.f_name} {action.assignee.l_name}"
                        }
                    }
                    for action in finding.action_items
                ]
            }
            for finding in audit.findings
        ]
        
        zip_file.writestr("findings.json", json.dumps(findings_data, indent=2))
        
        # Add meetings
        meetings_data = [
            {
                "id": meeting.id,
                "meeting_type": meeting.meeting_type,
                "title": meeting.title,
                "scheduled_time": meeting.scheduled_time.isoformat() if meeting.scheduled_time else None,
                "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
                "duration_minutes": meeting.duration_minutes,
                "location": meeting.location,
                "notes": meeting.notes,
                "status": meeting.status,
                "attendees": [
                    {
                        "user_id": attendee.user_id,
                        "name": f"{attendee.user.f_name} {attendee.user.l_name}",
                        "is_required": attendee.is_required,
                        "has_confirmed": attendee.has_confirmed
                    }
                    for attendee in meeting.attendees
                ],
                "agenda_items": [
                    {
                        "position": item.position,
                        "title": item.title,
                        "description": item.description,
                        "time_allocation": item.time_allocation,
                        "is_completed": item.is_completed
                    }
                    for item in meeting.agenda_items
                ]
            }
            for meeting in audit.meetings
        ]
        
        zip_file.writestr("meetings.json", json.dumps(meetings_data, indent=2))
        
        # Add a manifest with hash verification
        manifest = {
            "audit_id": audit.id,
            "audit_name": audit.name,
            "export_timestamp": datetime.utcnow().isoformat(),
            "exported_by": {
                "id": current_user.id,
                "name": f"{current_user.f_name} {current_user.l_name}",
                "role": current_user.role.value
            },
            "file_count": len(zip_file.namelist()),
            "files": zip_file.namelist()
        }
        
        zip_file.writestr("manifest.json", json.dumps(manifest, indent=2))
    
    # Reset buffer position
    zip_buffer.seek(0)
    
    # Create a filename with timestamp
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"audit_{audit_id}_{timestamp}_archive.zip"
    
    # Return the ZIP file as a streaming response
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

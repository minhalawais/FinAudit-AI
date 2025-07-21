"""
Enhanced document submission routes with AI finding generation
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from datetime import datetime, timedelta

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from app.cruds.document import create_document
from app.routers.audit.ai_findings_generator import AIFindingGenerator

router = APIRouter(prefix="/api/audits", tags=["audit-document-submission-enhanced"])

async def generate_ai_findings_background(
    document_id: int,
    audit_id: int, 
    document_submission_id: int,
    user_id: int,
    db_session_factory
):
    """
    Background task to generate AI findings from submitted document
    """
    try:
        # Create new database session for background task
        db = db_session_factory()
        
        # Get user for the background task
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"User {user_id} not found for AI finding generation")
            return
        
        # Initialize AI finding generator
        ai_generator = AIFindingGenerator(db)
        
        # Generate findings
        findings = await ai_generator.generate_findings_from_document(
            document_id=document_id,
            audit_id=audit_id,
            document_submission_id=document_submission_id,
            current_user=user
        )
        
        print(f"Generated {len(findings)} AI findings for document {document_id}")
        
        # Update submission with AI analysis status
        submission = db.query(DocumentSubmission).filter(
            DocumentSubmission.id == document_submission_id
        ).first()
        
        if submission:
            submission.ai_validation_score = 8.5 if findings else 6.0
            submission.ai_validation_notes = f"AI analysis completed. Generated {len(findings)} findings."
            db.commit()
        
        db.close()
        
    except Exception as e:
        print(f"Error in background AI finding generation: {e}")
        if 'db' in locals():
            db.close()

@router.post("/{audit_id}/submit-document-enhanced")
async def submit_document_enhanced(
    audit_id: int,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    requirement_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced document submission with AI finding generation"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    try:
        # First, create the document in the document system
        metadata = {
            "title": file.filename,
            "description": f"Document for audit requirement: {requirement.document_type}",
            "category": "audit_submission",
            "audit_id": audit_id,
            "requirement_id": requirement_id
        }
        
        document = create_document(db, file, str(metadata), current_user)
        
        # Then create the submission record
        submission = DocumentSubmission(
            requirement_id=requirement_id,
            document_id=document.id,
            submitted_by=current_user.id,
            submitted_at=datetime.utcnow(),
            verification_status=EvidenceStatus.pending,
            revision_round=1,
            workflow_stage=WorkflowStage.ai_validating
        )
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # Schedule AI finding generation as background task
        from app.database import SessionLocal
        background_tasks.add_task(
            generate_ai_findings_background,
            document_id=document.id,
            audit_id=audit_id,
            document_submission_id=submission.id,
            user_id=current_user.id,
            db_session_factory=SessionLocal
        )
        
        return {
            "message": "Document uploaded and submitted successfully. AI analysis in progress.",
            "submission_id": submission.id,
            "document_id": document.id,
            "status": "ai_validating",
            "next_stage": "under_review",
            "estimated_review_time": "2-4 hours",
            "ai_analysis_status": "processing",
            "workflow_id": f"wf_{submission.id}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit document: {str(e)}")

@router.post("/{audit_id}/submit-selected-document")
async def submit_selected_document(
    audit_id: int,
    background_tasks: BackgroundTasks,
    submission_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit a single existing document with AI finding generation"""
    
    requirement_id = submission_data.get("requirement_id")
    document_id = submission_data.get("document_id")
    notes = submission_data.get("notes", "")
    
    if not requirement_id or not document_id:
        raise HTTPException(status_code=400, detail="Missing requirement_id or document_id")
    
    # Verify requirement exists and belongs to the audit
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Verify document exists and user has access
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.company_id == current_user.company_id,
        Document.is_deleted == False
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found or access denied")
    
    try:
        # Create new submission
        submission = DocumentSubmission(
            requirement_id=requirement_id,
            document_id=document.id,
            submitted_by=current_user.id,
            submitted_at=datetime.utcnow(),
            verification_status=EvidenceStatus.pending,
            revision_round=1,
            workflow_stage=WorkflowStage.ai_validating
        )
        
        db.add(submission)
        db.commit()
        db.refresh(submission)
        
        # Schedule AI finding generation as background task
        from app.database import SessionLocal
        background_tasks.add_task(
            generate_ai_findings_background,
            document_id=document.id,
            audit_id=audit_id,
            document_submission_id=submission.id,
            user_id=current_user.id,
            db_session_factory=SessionLocal
        )
        
        return {
            "message": "Document submitted successfully. AI analysis in progress.",
            "submission_id": submission.id,
            "status": "ai_validating",
            "next_stage": "under_review",
            "estimated_review_time": "2-4 hours",
            "ai_analysis_status": "processing",
            "document": {"id": document.id, "title": document.title}
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit document: {str(e)}")

@router.get("/{audit_id}/ai-findings")
async def get_ai_generated_findings(
    audit_id: int,
    document_submission_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-generated findings for an audit or specific document submission"""
    
    try:
        query = db.query(AuditFinding).filter(
            AuditFinding.audit_id == audit_id,
            AuditFinding.finding_source == "ai_detected"
        )
        
        if document_submission_id:
            query = query.filter(AuditFinding.document_submission_id == document_submission_id)
        
        findings = query.order_by(AuditFinding.created_at.desc()).all()
        
        findings_list = []
        for finding in findings:
            # Get document submission details
            doc_submission = None
            if finding.document_submission_id:
                doc_submission = db.query(DocumentSubmission).filter(
                    DocumentSubmission.id == finding.document_submission_id
                ).first()
            
            finding_data = {
                "id": finding.id,
                "finding_id": finding.finding_id,
                "title": finding.title,
                "description": finding.description,
                "finding_type": finding.finding_type,
                "severity": finding.severity.value,
                "status": finding.status.value,
                "ai_confidence_score": finding.ai_confidence_score,
                "ai_risk_score": finding.ai_risk_score,
                "ai_recommendations": finding.ai_recommendations,
                "created_at": finding.created_at.isoformat(),
                "document_reference": {
                    "submission_id": finding.document_submission_id,
                    "document_title": doc_submission.document.title if doc_submission else None,
                    "requirement_type": doc_submission.requirement.document_type if doc_submission else None
                } if doc_submission else None,
                "evidence": finding.evidence,
                "impact_assessment": finding.impact_assessment
            }
            
            findings_list.append(finding_data)
        
        return {
            "ai_findings": findings_list,
            "total": len(findings_list),
            "audit_id": audit_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get AI findings: {str(e)}")

@router.post("/{audit_id}/regenerate-ai-findings/{document_submission_id}")
async def regenerate_ai_findings(
    audit_id: int,
    document_submission_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Regenerate AI findings for a specific document submission"""
    
    try:
        # Verify submission exists
        submission = db.query(DocumentSubmission).filter(
            DocumentSubmission.id == document_submission_id
        ).first()
        
        if not submission:
            raise HTTPException(status_code=404, detail="Document submission not found")
        
        # Delete existing AI findings for this submission
        existing_findings = db.query(AuditFinding).filter(
            AuditFinding.document_submission_id == document_submission_id,
            AuditFinding.finding_source == "ai_detected"
        ).all()
        
        for finding in existing_findings:
            # Delete workflow history
            db.query(AuditFindingWorkflow).filter(
                AuditFindingWorkflow.finding_id == finding.id
            ).delete()
            
            # Delete the finding
            db.delete(finding)
        
        db.commit()
        
        # Schedule new AI finding generation
        from app.database import SessionLocal
        background_tasks.add_task(
            generate_ai_findings_background,
            document_id=submission.document_id,
            audit_id=audit_id,
            document_submission_id=document_submission_id,
            user_id=current_user.id,
            db_session_factory=SessionLocal
        )
        
        return {
            "message": "AI finding regeneration started",
            "submission_id": document_submission_id,
            "status": "processing"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to regenerate AI findings: {str(e)}")


@router.get("/{audit_id}/submissions/{submission_id}/document")
async def get_submission_document(
    audit_id: int,
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document details for a submission - FIXED VERSION"""
    
    submission = db.query(DocumentSubmission).join(
        DocumentRequirement
    ).filter(
        DocumentSubmission.id == submission_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    document = db.query(Document).filter(
        Document.id == submission.document_id,
        Document.company_id == current_user.company_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {
        "document": {
            "id": document.id,
            "title": document.title,
            "file_type": document.file_type,
            "file_size": document.file_size,
            "created_at": document.created_at.isoformat(),
            "updated_at": document.updated_at.isoformat()
        },
        "submission": {
            "id": submission.id,
            "status": submission.verification_status.value,
            "workflow_stage": submission.workflow_stage.value,
            "submitted_at": submission.submitted_at.isoformat(),
            "revision_round": submission.revision_round
        }
    }

@router.get("/{audit_id}/requirements/enhanced")
async def get_enhanced_requirements(
    audit_id: int,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get enhanced requirements with submission details"""
    
    # Verify audit exists and user has access
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get requirements with submissions
    requirements_query = db.query(DocumentRequirement).filter(
        DocumentRequirement.audit_id == audit_id
    )
    
    requirements = requirements_query.all()
    
    enhanced_requirements = []
    
    for req in requirements:
        # Get all submissions for this requirement
        submissions = db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == req.id
        ).all()
        
        # Calculate days until deadline
        days_until_deadline = None
        if req.deadline:
            delta = req.deadline - datetime.utcnow()
            days_until_deadline = delta.days
        
        # Format submissions
        formatted_submissions = []
        for sub in submissions:
            document = db.query(Document).filter(Document.id == sub.document_id).first()
            if document:
                formatted_submissions.append({
                    "id": sub.id,
                    "status": sub.verification_status.value,
                    "workflow_stage": sub.workflow_stage.value,
                    "submitted_at": sub.submitted_at.isoformat(),
                    "ai_validation_score": sub.ai_validation_score or 0.0,
                    "compliance_score": sub.compliance_score or 0.0,
                    "revision_round": sub.revision_round,
                    "document": {
                        "id": str(document.id),
                        "title": document.title,
                        "file_type": document.file_type,
                        "file_size": document.file_size,
                        "created_at": document.created_at.isoformat()
                    }
                })
        
        enhanced_req = {
            "id": req.id,
            "document_type": req.document_type,
            "description": req.description or "",
            "ai_priority_score": req.ai_priority_score or 5.0,
            "risk_level": req.risk_level or "medium",
            "deadline": req.deadline.isoformat() if req.deadline else None,
            "days_until_deadline": days_until_deadline,
            "is_mandatory": req.is_mandatory,
            "auto_escalate": req.auto_escalate,
            "escalation_level": req.escalation_level or 0,
            "escalations_count": 0,  # TODO: Calculate from escalation table
            "compliance_framework": req.compliance_framework or "SOX",
            "required_fields": req.required_fields or {},
            "validation_rules": req.validation_rules or {},
            "submissions": formatted_submissions
        }
        
        enhanced_requirements.append(enhanced_req)
    
    return {
        "requirements": enhanced_requirements,
        "total": len(enhanced_requirements)
    }

@router.post("/requirements")
async def create_requirement(
    requirement_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new document requirement"""
    
    # Validate audit exists
    audit = db.query(Audit).filter(Audit.id == requirement_data.get("audit_id")).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create new requirement
    new_requirement = DocumentRequirement(
        audit_id=requirement_data.get("audit_id"),
        document_type=requirement_data.get("document_type"),
        description=requirement_data.get("description", ""),
        required_fields=requirement_data.get("required_fields", {}),
        validation_rules=requirement_data.get("validation_rules", {}),
        deadline=datetime.fromisoformat(requirement_data.get("deadline")) if requirement_data.get("deadline") else None,
        is_mandatory=requirement_data.get("is_mandatory", True),
        auto_escalate=requirement_data.get("auto_escalate", False),
        compliance_framework=requirement_data.get("compliance_framework", "SOX"),
        ai_priority_score=requirement_data.get("ai_priority_score", 5.0),
        risk_level=requirement_data.get("risk_level", "medium"),
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_requirement)
    db.commit()
    db.refresh(new_requirement)
    
    return {
        "message": "Requirement created successfully",
        "requirement_id": new_requirement.id,
        "created_at": new_requirement.created_at.isoformat()
    }

@router.put("/{audit_id}/requirements/{requirement_id}")
async def update_requirement(
    audit_id: int,
    requirement_id: int,
    requirement_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a document requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id,
        DocumentRequirement.audit_id == audit_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    # Update fields
    for field, value in requirement_data.items():
        if hasattr(requirement, field):
            if field == "deadline" and value:
                setattr(requirement, field, datetime.fromisoformat(value))
            else:
                setattr(requirement, field, value)
    
    try:
        db.commit()
        return {"message": "Requirement updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update requirement: {str(e)}")

@router.delete("/requirements/{requirement_id}")
async def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document requirement"""
    
    requirement = db.query(DocumentRequirement).filter(
        DocumentRequirement.id == requirement_id
    ).first()
    
    if not requirement:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    try:
        # Delete associated submissions first
        db.query(DocumentSubmission).filter(
            DocumentSubmission.requirement_id == requirement_id
        ).delete()
        
        # Delete the requirement
        db.delete(requirement)
        db.commit()
        
        return {"message": "Requirement deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete requirement: {str(e)}")

@router.get("/submissions/{submission_id}/status")
async def get_submission_status(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed submission status with workflow history"""
    
    submission = db.query(DocumentSubmission).filter(
        DocumentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submitter = db.query(User).filter(User.id == submission.submitted_by).first()
    
    # Mock detailed status data with enhanced workflow
    return {
        "submission": {
            "id": submission.id,
            "document_type": submission.requirement.document_type,
            "status": submission.verification_status.value,
            "workflow_stage": submission.workflow_stage.value,
            "submitted_at": submission.submitted_at.isoformat(),
            "submitter": f"{submitter.f_name} {submitter.l_name}",
            "ai_validation_score": 8.2,
            "compliance_score": 7.8
        },
        "workflow_history": [
            {
                "stage": "submitted",
                "status": "completed",
                "performer": f"{submitter.f_name} {submitter.l_name}",
                "performer_type": "user",
                "notes": "Document submitted for review",
                "validation_score": 0,
                "duration_minutes": 0,
                "automated": False,
                "created_at": submission.submitted_at.isoformat()
            },
            {
                "stage": "ai_validation",
                "status": "completed",
                "performer": "AI Validator",
                "performer_type": "system",
                "notes": "AI validation completed with score 8.2/10",
                "validation_score": 8.2,
                "duration_minutes": 3,
                "automated": True,
                "created_at": (submission.submitted_at + timedelta(minutes=3)).isoformat()
            }
        ],
        "audit_trail": [
            {
                "action": "document_submitted",
                "actor": f"{submitter.f_name} {submitter.l_name}",
                "actor_type": "user",
                "details": {"document_name": submission.document.title},
                "timestamp": submission.submitted_at.isoformat(),
                "hash": "abc123def456"
            }
        ],
        "verification_chain": [
            {
                "block_number": 1,
                "current_hash": "abc123def456ghi789",
                "previous_hash": "000000000000000000",
                "verification_data": {"submission_id": submission.id},
                "timestamp": submission.submitted_at.isoformat(),
                "immutable": True
            }
        ],
        "ai_validations": [
            {
                "validation_type": "document_quality",
                "validation_score": 8.2,
                "confidence_score": 0.95,
                "issues_found": ["Minor formatting inconsistency in header"],
                "recommendations": ["Consider standardizing document headers"],
                "processing_time_ms": 2500,
                "created_at": (submission.submitted_at + timedelta(minutes=2)).isoformat()
            }
        ]
    }

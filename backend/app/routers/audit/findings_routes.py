"""
Enhanced Audit Finding Routes with Simplified 3-Table Structure
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, validator

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *

findings_router = APIRouter(prefix="/api/findings", tags=["enhanced-findings"])

# Pydantic models for request validation
class FindingCreateRequest(BaseModel):
    audit_id: int
    title: str
    description: str
    finding_type: str = "compliance"
    severity: str
    # Either document_submission_id OR meeting_id must be provided for manual findings
    document_submission_id: Optional[int] = None
    meeting_id: Optional[int] = None
    finding_source: str = "manual"
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    priority_level: str = "medium"
    impact_assessment: Optional[str] = None
    root_cause_analysis: Optional[str] = None
    
    @validator('document_submission_id', 'meeting_id')
    def validate_reference(cls, v, values):
        # For manual findings, either document_submission_id or meeting_id must be provided
        if values.get('finding_source') == 'manual':
            doc_id = values.get('document_submission_id')
            meeting_id = values.get('meeting_id')
            if not doc_id and not meeting_id:
                raise ValueError('Manual findings must reference either a document submission or meeting')
        return v

class FindingUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    remediation_plan: Optional[str] = None
    management_response: Optional[str] = None
    target_completion_date: Optional[str] = None
    impact_assessment: Optional[str] = None
    root_cause_analysis: Optional[str] = None

class FindingCommentRequest(BaseModel):
    comment: str
    comment_type: str = "general"
    comment_category: str = "general"
    is_internal: bool = False
    attachment_data: Optional[Dict[str, Any]] = None

@findings_router.post("/")
async def create_finding_enhanced(
    finding_data: FindingCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new audit finding with enhanced workflow validation"""
    
    try:
        # Validate audit exists and user has access
        audit = db.query(Audit).filter(
            Audit.id == finding_data.audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found or access denied")
        
        # Validate document submission reference if provided
        if finding_data.document_submission_id:
            doc_submission = db.query(DocumentSubmission).join(
                DocumentRequirement
            ).filter(
                DocumentSubmission.id == finding_data.document_submission_id,
                DocumentRequirement.audit_id == finding_data.audit_id
            ).first()
            
            if not doc_submission:
                raise HTTPException(
                    status_code=404, 
                    detail="Document submission not found or not part of this audit"
                )
        
        # Validate meeting reference if provided
        if finding_data.meeting_id:
            meeting = db.query(AuditMeeting).filter(
                AuditMeeting.id == finding_data.meeting_id,
                AuditMeeting.audit_id == finding_data.audit_id
            ).first()
            
            if not meeting:
                raise HTTPException(
                    status_code=404, 
                    detail="Meeting not found or not part of this audit"
                )
        
        # Generate unique finding ID
        finding_count = db.query(AuditFinding).filter(AuditFinding.audit_id == finding_data.audit_id).count()
        finding_id = f"F-{audit.id}-{finding_count + 1:03d}"
        
        # Create the finding
        new_finding = AuditFinding(
            audit_id=finding_data.audit_id,
            finding_id=finding_id,
            title=finding_data.title,
            description=finding_data.description,
            finding_type=finding_data.finding_type,
            severity=FindingSeverity(finding_data.severity),
            status=FindingStatus.open,
            document_submission_id=finding_data.document_submission_id,
            meeting_id=finding_data.meeting_id,
            finding_source=finding_data.finding_source,
            assigned_to=finding_data.assigned_to,
            due_date=datetime.fromisoformat(finding_data.due_date) if finding_data.due_date else None,
            priority_level=finding_data.priority_level,
            impact_assessment=finding_data.impact_assessment,
            root_cause_analysis=finding_data.root_cause_analysis,
            created_by=current_user.id,
            created_at=datetime.utcnow()
        )
        
        db.add(new_finding)
        db.flush()  # Get the ID
        
        # Create workflow entry
        workflow_entry = AuditFindingWorkflow(
            finding_id=new_finding.id,
            from_status=None,
            to_status="open",
            changed_by=current_user.id,
            change_reason="Finding created",
            workflow_data={
                "source": finding_data.finding_source,
                "reference_type": "document" if finding_data.document_submission_id else "meeting",
                "reference_id": finding_data.document_submission_id or finding_data.meeting_id
            }
        )
        
        db.add(workflow_entry)
        db.commit()
        db.refresh(new_finding)
        
        return {
            "message": "Finding created successfully",
            "finding": {
                "id": new_finding.id,
                "finding_id": new_finding.finding_id,
                "title": new_finding.title,
                "status": new_finding.status.value,
                "severity": new_finding.severity.value,
                "created_at": new_finding.created_at.isoformat()
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create finding: {str(e)}")

@findings_router.put("/{finding_id}/status")
async def update_finding_status(
    finding_id: int,
    status_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update finding status with proper workflow tracking"""
    
    try:
        finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        
        new_status = status_data.get("status")
        change_reason = status_data.get("reason", "Status updated")
        
        # Validate status transition
        valid_transitions = {
            "open": ["in_progress", "resolved", "closed"],
            "in_progress": ["open", "resolved", "closed"],
            "resolved": ["closed", "open"],  # Can reopen if verification fails
            "closed": []  # Closed findings cannot be changed
        }
        
        current_status = finding.status.value
        if current_status == "closed":
            raise HTTPException(status_code=400, detail="Cannot modify closed findings")
        
        if new_status not in valid_transitions.get(current_status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {current_status} to {new_status}"
            )
        
        # Update finding status
        old_status = finding.status.value
        finding.status = FindingStatus(new_status)
        
        # Set additional fields based on status
        if new_status == "resolved":
            finding.resolved_at = datetime.utcnow()
            finding.resolved_by = current_user.id
        elif new_status == "closed":
            finding.closed_at = datetime.utcnow()
            finding.closed_by = current_user.id
            finding.closure_notes = status_data.get("closure_notes")
        
        # Create workflow entry
        workflow_entry = AuditFindingWorkflow(
            finding_id=finding.id,
            from_status=old_status,
            to_status=new_status,
            changed_by=current_user.id,
            change_reason=change_reason,
            workflow_data=status_data.get("workflow_data", {})
        )
        
        db.add(workflow_entry)
        db.commit()
        
        return {
            "message": f"Finding status updated to {new_status}",
            "finding_id": finding.id,
            "old_status": old_status,
            "new_status": new_status,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update status: {str(e)}")

@findings_router.put("/{finding_id}")
async def update_finding(
    finding_id: int,
    update_data: FindingUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update finding details"""
    
    try:
        finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        
        # Track what fields are being updated
        updated_fields = []
        
        # Update fields if provided
        if update_data.title is not None:
            finding.title = update_data.title
            updated_fields.append("title")
        
        if update_data.description is not None:
            finding.description = update_data.description
            updated_fields.append("description")
        
        if update_data.assigned_to is not None:
            finding.assigned_to = update_data.assigned_to
            updated_fields.append("assigned_to")
        
        if update_data.due_date is not None:
            finding.due_date = datetime.fromisoformat(update_data.due_date) if update_data.due_date else None
            updated_fields.append("due_date")
        
        if update_data.remediation_plan is not None:
            finding.remediation_plan = update_data.remediation_plan
            updated_fields.append("remediation_plan")
        
        if update_data.management_response is not None:
            finding.management_response = update_data.management_response
            updated_fields.append("management_response")
        
        if update_data.target_completion_date is not None:
            finding.target_completion_date = datetime.fromisoformat(update_data.target_completion_date).date() if update_data.target_completion_date else None
            updated_fields.append("target_completion_date")
        
        if update_data.impact_assessment is not None:
            finding.impact_assessment = update_data.impact_assessment
            updated_fields.append("impact_assessment")
        
        if update_data.root_cause_analysis is not None:
            finding.root_cause_analysis = update_data.root_cause_analysis
            updated_fields.append("root_cause_analysis")
        
        finding.updated_at = datetime.utcnow()
        
        # Create workflow entry for the update
        workflow_entry = AuditFindingWorkflow(
            finding_id=finding.id,
            from_status=finding.status.value,
            to_status=finding.status.value,
            changed_by=current_user.id,
            change_reason=f"Finding updated: {', '.join(updated_fields)}",
            workflow_data={"updated_fields": updated_fields}
        )
        
        db.add(workflow_entry)
        db.commit()
        
        return {
            "message": "Finding updated successfully",
            "finding_id": finding.id,
            "updated_fields": updated_fields,
            "updated_at": finding.updated_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update finding: {str(e)}")

@findings_router.post("/{finding_id}/comments")
async def add_finding_comment(
    finding_id: int,
    comment_data: FindingCommentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add comment to finding with enhanced categorization"""
    
    try:
        finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        
        # Create comment
        comment = FindingComment(
            finding_id=finding_id,
            comment=comment_data.comment,
            comment_type=comment_data.comment_type,
            comment_category=comment_data.comment_category,
            is_internal=comment_data.is_internal,
            attachment_data=comment_data.attachment_data,
            created_by=f"{current_user.f_name} {current_user.l_name}",
            created_at=datetime.utcnow()
        )
        
        db.add(comment)
        
        # Create workflow entry for comment
        workflow_entry = AuditFindingWorkflow(
            finding_id=finding_id,
            from_status=finding.status.value,
            to_status=finding.status.value,
            changed_by=current_user.id,
            change_reason=f"Comment added: {comment_data.comment_category}",
            workflow_data={
                "action": "comment_added",
                "comment_category": comment_data.comment_category,
                "is_internal": comment_data.is_internal
            }
        )
        
        db.add(workflow_entry)
        db.commit()
        db.refresh(comment)
        
        return {
            "message": "Comment added successfully",
            "comment_id": comment.id,
            "created_at": comment.created_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add comment: {str(e)}")

@findings_router.get("/{finding_id}/workflow-history")
async def get_finding_workflow_history(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete workflow history for a finding"""
    
    try:
        # Fix the relationship reference
        workflow_history = db.query(AuditFindingWorkflow).filter(
            AuditFindingWorkflow.finding_id == finding_id
        ).order_by(AuditFindingWorkflow.changed_at.desc()).all()
        
        history = []
        for entry in workflow_history:
            # Get user info manually if relationship doesn't work
            user = db.query(User).filter(User.id == entry.changed_by).first()
            user_name = f"{user.f_name} {user.l_name}" if user else "System"
            
            history.append({
                "id": entry.id,
                "from_status": entry.from_status,
                "to_status": entry.to_status,
                "changed_by": user_name,
                "change_reason": entry.change_reason,
                "changed_at": entry.changed_at.isoformat(),
                "workflow_data": entry.workflow_data
            })
        
        return {"workflow_history": history}
        
    except Exception as e:
        print(f"Error in workflow history: {str(e)}")  # Debug logging
        raise HTTPException(status_code=500, detail=f"Failed to get workflow history: {str(e)}")

@findings_router.get("/")
async def get_findings_enhanced(
    audit_id: Optional[int] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    finding_type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    finding_source: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get findings with enhanced filtering and workflow information"""
    
    try:
        query = db.query(AuditFinding).options(
            joinedload(AuditFinding.audit),
            joinedload(AuditFinding.creator),
            joinedload(AuditFinding.resolver),
            joinedload(AuditFinding.related_document),
            joinedload(AuditFinding.related_meeting),
            joinedload(AuditFinding.comments)
        ).join(Audit).filter(Audit.company_id == current_user.company_id)
        
        # Apply filters
        if audit_id:
            query = query.filter(AuditFinding.audit_id == audit_id)
        if status:
            query = query.filter(AuditFinding.status == FindingStatus(status))
        if severity:
            query = query.filter(AuditFinding.severity == FindingSeverity(severity))
        if finding_type:
            query = query.filter(AuditFinding.finding_type == finding_type)
        if assigned_to:
            query = query.filter(AuditFinding.assigned_to.ilike(f"%{assigned_to}%"))
        if finding_source:
            query = query.filter(AuditFinding.finding_source == finding_source)
        
        # Pagination
        total = query.count()
        findings = query.offset((page - 1) * per_page).limit(per_page).all()
        
        findings_list = []
        for finding in findings:
            # Get document submission details if referenced
            doc_submission = None
            if finding.document_submission_id:
                doc_submission = db.query(DocumentSubmission).options(
                    joinedload(DocumentSubmission.document),
                    joinedload(DocumentSubmission.requirement)
                ).filter(DocumentSubmission.id == finding.document_submission_id).first()
            
            finding_data = {
                "id": finding.id,
                "finding_id": finding.finding_id,
                "title": finding.title,
                "description": finding.description,
                "finding_type": finding.finding_type,
                "severity": finding.severity.value,
                "status": finding.status.value,
                "priority_level": finding.priority_level,
                "finding_source": finding.finding_source,
                "assigned_to": finding.assigned_to,
                "due_date": finding.due_date.isoformat() if finding.due_date else None,
                "target_completion_date": finding.target_completion_date.isoformat() if finding.target_completion_date else None,
                "created_at": finding.created_at.isoformat(),
                "resolved_at": finding.resolved_at.isoformat() if finding.resolved_at else None,
                "closed_at": finding.closed_at.isoformat() if finding.closed_at else None,
                "audit": {
                    "id": finding.audit.id,
                    "name": finding.audit.name
                } if finding.audit else None,
                "creator": f"{finding.creator.f_name} {finding.creator.l_name}" if finding.creator else "System",
                "resolver": f"{finding.resolver.f_name} {finding.resolver.l_name}" if finding.resolver else None,
                "reference": {
                    "type": "document" if finding.document_submission_id else "meeting" if finding.meeting_id else None,
                    "id": finding.document_submission_id or finding.meeting_id,
                    "title": doc_submission.document.title if doc_submission else finding.related_meeting.title if finding.related_meeting else None,
                    "document_type": doc_submission.requirement.document_type if doc_submission else None,
                    "meeting_type": finding.related_meeting.meeting_type.value if finding.related_meeting else None
                },
                "comments_count": len(finding.comments) if finding.comments else 0,
                "impact_assessment": finding.impact_assessment,
                "root_cause_analysis": finding.root_cause_analysis,
                "management_response": finding.management_response,
                "remediation_plan": finding.remediation_plan
            }
            
            findings_list.append(finding_data)
        
        return {
            "findings": findings_list,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": (total + per_page - 1) // per_page
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get findings: {str(e)}")

@findings_router.get("/{finding_id}/details")
async def get_finding_details_enhanced(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive finding details with all related information"""
    
    try:
        finding = db.query(AuditFinding).options(
            joinedload(AuditFinding.audit),
            joinedload(AuditFinding.creator),
            joinedload(AuditFinding.resolver),
            joinedload(AuditFinding.related_document),
            joinedload(AuditFinding.related_meeting),
            joinedload(AuditFinding.comments)
        ).filter(AuditFinding.id == finding_id).first()
        
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        
        # Get document submission details if referenced
        doc_submission = None
        if finding.document_submission_id:
            doc_submission = db.query(DocumentSubmission).options(
                joinedload(DocumentSubmission.document),
                joinedload(DocumentSubmission.requirement)
            ).filter(DocumentSubmission.id == finding.document_submission_id).first()
        
        # Get workflow history
        workflow_history = db.query(AuditFindingWorkflow).options(
            joinedload(AuditFindingWorkflow.changed_by_user)
        ).filter(AuditFindingWorkflow.finding_id == finding_id).order_by(
            AuditFindingWorkflow.changed_at.desc()
        ).all()
        
        # Format response
        finding_details = {
            "id": finding.id,
            "finding_id": finding.finding_id,
            "title": finding.title,
            "description": finding.description,
            "finding_type": finding.finding_type,
            "severity": finding.severity.value,
            "status": finding.status.value,
            "priority_level": finding.priority_level,
            "finding_source": finding.finding_source,
            "assigned_to": finding.assigned_to,
            "due_date": finding.due_date.isoformat() if finding.due_date else None,
            "target_completion_date": finding.target_completion_date.isoformat() if finding.target_completion_date else None,
            "actual_completion_date": finding.actual_completion_date.isoformat() if finding.actual_completion_date else None,
            "created_at": finding.created_at.isoformat(),
            "resolved_at": finding.resolved_at.isoformat() if finding.resolved_at else None,
            "closed_at": finding.closed_at.isoformat() if finding.closed_at else None,
            "impact_assessment": finding.impact_assessment,
            "root_cause_analysis": finding.root_cause_analysis,
            "remediation_plan": finding.remediation_plan,
            "management_response": finding.management_response,
            "verification_evidence": finding.verification_evidence,
            "closure_notes": finding.closure_notes,
            "business_impact": finding.business_impact,
            "regulatory_impact": finding.regulatory_impact,
            "audit": {
                "id": finding.audit.id,
                "name": finding.audit.name
            },
            "creator": f"{finding.creator.f_name} {finding.creator.l_name}" if finding.creator else "System",
            "resolver": f"{finding.resolver.f_name} {finding.resolver.l_name}" if finding.resolver else None,
            "reference": {
                "type": "document" if finding.document_submission_id else "meeting" if finding.meeting_id else None,
                "id": finding.document_submission_id or finding.meeting_id,
                "title": doc_submission.document.title if doc_submission else finding.related_meeting.title if finding.related_meeting else None,
                "details": {
                    "document_type": doc_submission.requirement.document_type if doc_submission else None,
                    "requirement_id": doc_submission.requirement_id if doc_submission else None,
                    "meeting_type": finding.related_meeting.meeting_type.value if finding.related_meeting else None,
                    "scheduled_time": finding.related_meeting.scheduled_time.isoformat() if finding.related_meeting else None
                }
            },
            "workflow_history": [
                {
                    "id": entry.id,
                    "from_status": entry.from_status,
                    "to_status": entry.to_status,
                    "changed_by": f"{entry.changed_by_user.f_name} {entry.changed_by_user.l_name}" if entry.changed_by_user else "System",
                    "change_reason": entry.change_reason,
                    "changed_at": entry.changed_at.isoformat(),
                    "workflow_data": entry.workflow_data
                }
                for entry in workflow_history
            ],
            "comments": [
                {
                    "id": comment.id,
                    "comment": comment.comment,
                    "comment_type": comment.comment_type,
                    "comment_category": getattr(comment, 'comment_category', 'general'),
                    "is_internal": getattr(comment, 'is_internal', False),
                    "attachment_data": getattr(comment, 'attachment_data', None),
                    "created_by": comment.created_by,
                    "created_at": comment.created_at.isoformat()
                }
                for comment in finding.comments
            ]
        }
        
        return {"finding": finding_details}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get finding details: {str(e)}")

@findings_router.get("/{finding_id}/comments")
async def get_finding_comments(
    finding_id: int,
    category: Optional[str] = None,
    internal_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get finding comments with filtering"""
    
    try:
        query = db.query(FindingComment).filter(FindingComment.finding_id == finding_id)
        
        if category:
            query = query.filter(FindingComment.comment_category == category)
        
        if internal_only:
            query = query.filter(FindingComment.is_internal == True)
        
        comments = query.order_by(desc(FindingComment.created_at)).all()
        
        comments_list = []
        for comment in comments:
            comments_list.append({
                "id": comment.id,
                "comment": comment.comment,
                "comment_type": comment.comment_type,
                "comment_category": getattr(comment, 'comment_category', 'general'),
                "is_internal": getattr(comment, 'is_internal', False),
                "attachment_data": getattr(comment, 'attachment_data', None),
                "created_by": comment.created_by,
                "created_at": comment.created_at.isoformat()
            })
        
        return {"comments": comments_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get comments: {str(e)}")

# Dashboard and statistics endpoints
@findings_router.get("/dashboard/stats")
async def get_dashboard_stats(
    audit_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for audit findings"""
    
    try:
        # Base query for user's company
        base_query = db.query(AuditFinding).join(Audit).filter(
            Audit.company_id == current_user.company_id
        )
        
        if audit_id:
            base_query = base_query.filter(AuditFinding.audit_id == audit_id)
        
        # Get counts by status
        total_findings = base_query.count()
        open_findings = base_query.filter(AuditFinding.status == FindingStatus.open).count()
        in_progress_findings = base_query.filter(AuditFinding.status == FindingStatus.in_progress).count()
        resolved_findings = base_query.filter(AuditFinding.status == FindingStatus.resolved).count()
        closed_findings = base_query.filter(AuditFinding.status == FindingStatus.closed).count()
        
        # Get counts by severity
        critical_findings = base_query.filter(AuditFinding.severity == FindingSeverity.critical).count()
        major_findings = base_query.filter(AuditFinding.severity == FindingSeverity.major).count()
        minor_findings = base_query.filter(AuditFinding.severity == FindingSeverity.minor).count()
        
        # Get counts by source
        manual_findings = base_query.filter(AuditFinding.finding_source == 'manual').count()
        ai_findings = base_query.filter(AuditFinding.finding_source == 'ai_detected').count()
        
        # Get overdue findings
        overdue_findings = base_query.filter(
            AuditFinding.due_date < datetime.utcnow(),
            AuditFinding.status.in_([FindingStatus.open, FindingStatus.in_progress])
        ).count()
        
        return {
            "stats": {
                "total_findings": total_findings,
                "open_findings": open_findings,
                "in_progress_findings": in_progress_findings,
                "resolved_findings": resolved_findings,
                "closed_findings": closed_findings,
                "critical_findings": critical_findings,
                "major_findings": major_findings,
                "minor_findings": minor_findings,
                "manual_findings": manual_findings,
                "ai_detected_findings": ai_findings,
                "overdue_findings": overdue_findings,
                "completion_rate": round((resolved_findings + closed_findings) / total_findings * 100, 1) if total_findings > 0 else 0
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

# Add missing routes for document submissions and meetings
@findings_router.get("/audit/{audit_id}/document-submissions")
async def get_audit_document_submissions(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document submissions for an audit (for finding reference)"""
    
    try:
        submissions = db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.document),
            joinedload(DocumentSubmission.requirement)
        ).join(DocumentRequirement).filter(
            DocumentRequirement.audit_id == audit_id
        ).order_by(DocumentSubmission.submitted_at.desc()).all()
        
        submissions_list = []
        for submission in submissions:
            submissions_list.append({
                "id": submission.id,
                "document": {
                    "id": submission.document.id,
                    "title": submission.document.title,
                    "file_type": submission.document.file_type
                },
                "requirement": {
                    "id": submission.requirement.id,
                    "document_type": submission.requirement.document_type
                },
                "submitted_at": submission.submitted_at.isoformat(),
                "status": submission.status.value if hasattr(submission, 'status') else 'submitted'
            })
        
        return {"submissions": submissions_list}
        
    except Exception as e:
        print(f"Error getting document submissions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get document submissions: {str(e)}")

@findings_router.get("/audit/{audit_id}/meetings")
async def get_audit_meetings(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meetings for an audit (for finding reference)"""
    
    try:
        meetings = db.query(AuditMeeting).filter(
            AuditMeeting.audit_id == audit_id
        ).order_by(AuditMeeting.scheduled_time.desc()).all()
        
        meetings_list = []
        for meeting in meetings:
            meetings_list.append({
                "id": meeting.id,
                "title": meeting.title,
                "meeting_type": meeting.meeting_type.value if hasattr(meeting.meeting_type, 'value') else str(meeting.meeting_type),
                "scheduled_time": meeting.scheduled_time.isoformat(),
                "status": meeting.status.value if hasattr(meeting, 'status') else 'scheduled',
                "description": getattr(meeting, 'description', '')
            })
        
        return {"meetings": meetings_list}
        
    except Exception as e:
        print(f"Error getting meetings: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get meetings: {str(e)}")

# Add route to mark notifications as read (referenced in AuditNotifications component)
@findings_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark notification as read"""
    
    try:
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
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to mark notification as read: {str(e)}")

# Add route to get finding by ID (for workflow tracker)
@findings_router.get("/{finding_id}")
async def get_finding_by_id(
    finding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get finding by ID"""
    
    try:
        finding = db.query(AuditFinding).options(
            joinedload(AuditFinding.audit),
            joinedload(AuditFinding.creator)
        ).filter(AuditFinding.id == finding_id).first()
        
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found")
        
        # Check access
        if finding.audit.company_id != current_user.company_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "finding": {
                "id": finding.id,
                "finding_id": finding.finding_id,
                "title": finding.title,
                "status": finding.status.value,
                "severity": finding.severity.value,
                "audit_id": finding.audit_id
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get finding: {str(e)}")

@findings_router.get("/{audit_id}/document-submissions")
async def get_audit_document_submissions(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get document submissions for an audit"""
    
    try:
        # Verify audit access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found or access denied")
        
        submissions = db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.document),
            joinedload(DocumentSubmission.requirement)
        ).join(DocumentRequirement).filter(
            DocumentRequirement.audit_id == audit_id
        ).order_by(DocumentSubmission.submitted_at.desc()).all()
        
        submissions_list = []
        for submission in submissions:
            submissions_list.append({
                "id": submission.id,
                "document": {
                    "id": submission.document.id,
                    "title": submission.document.title,
                    "file_type": submission.document.file_type
                },
                "requirement": {
                    "id": submission.requirement.id,
                    "document_type": submission.requirement.document_type
                },
                "submitted_at": submission.submitted_at.isoformat(),
                "status": getattr(submission, 'status', 'submitted')
            })
        
        return {"submissions": submissions_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get document submissions: {str(e)}")

@findings_router.get("/{audit_id}/meetings")
async def get_audit_meetings(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meetings for an audit"""
    
    try:
        # Verify audit access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found or access denied")
        
        meetings = db.query(AuditMeeting).filter(
            AuditMeeting.audit_id == audit_id
        ).order_by(AuditMeeting.scheduled_time.desc()).all()
        
        meetings_list = []
        for meeting in meetings:
            meetings_list.append({
                "id": meeting.id,
                "title": meeting.title,
                "meeting_type": str(meeting.meeting_type),
                "scheduled_time": meeting.scheduled_time.isoformat(),
                "status": getattr(meeting, 'status', 'scheduled'),
                "description": getattr(meeting, 'description', '')
            })
        
        return {"meetings": meetings_list}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meetings: {str(e)}")
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.database import get_db
from app.models import (
    Document, DocumentWorkflow, DocumentVersion, 
    WorkflowExecutionHistory, User, Activity,WorkflowStep
)
from app.routers.auth import get_current_user
from sqlalchemy import func, and_, or_
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/dashboard/stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all dashboard statistics"""
    try:
        # Document statistics
        total_documents = db.query(Document).filter(
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).count()
        
        recent_documents = db.query(Document).filter(
            Document.company_id == current_user.company_id,
            Document.is_deleted == False,
            Document.created_at >= datetime.utcnow() - timedelta(days=7)
        ).count()
        
        document_types = db.query(
            Document.file_type,
            func.count(Document.id).label("count")
        ).filter(
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).group_by(Document.file_type).all()
        
        # Workflow statistics
        workflow_status = db.query(
            DocumentWorkflow.status,
            func.count(DocumentWorkflow.id).label("count")
        ).join(Document).filter(
            Document.company_id == current_user.company_id
        ).group_by(DocumentWorkflow.status).all()
        
        # Version statistics
        version_stats = db.query(
            func.date_trunc('day', DocumentVersion.created_at).label("date"),
            func.count(DocumentVersion.id).label("count")
        ).join(Document).filter(
            Document.company_id == current_user.company_id,
            DocumentVersion.created_at >= datetime.utcnow() - timedelta(days=30)
        ).group_by("date").order_by("date").all()
        
        # User activity
        user_activity = db.query(
            func.date_trunc('day', Activity.created_at).label("date"),
            func.count(Activity.id).label("count")
        ).filter(
            Activity.created_at >= datetime.utcnow() - timedelta(days=30)
        ).group_by("date").order_by("date").all()
        
        # Workflow step performance
        step_performance = db.query(
            WorkflowExecutionHistory.step_number,
            func.avg(
                func.extract('epoch', WorkflowExecutionHistory.performed_at - DocumentWorkflow.started_at)
            ).label("avg_time")
        ).join(DocumentWorkflow).join(Document).filter(
            Document.company_id == current_user.company_id,
            WorkflowExecutionHistory.status == "completed"
        ).group_by(WorkflowExecutionHistory.step_number).order_by(WorkflowExecutionHistory.step_number).all()
        
        return {
            "document_stats": {
                "total": total_documents,
                "recent": recent_documents,
                "types": [{"type": t[0], "count": t[1]} for t in document_types],
            },
            "workflow_stats": {
                "statuses": [{"status": s[0], "count": s[1]} for s in workflow_status],
                "step_performance": [{"step": s[0], "avg_time": s[1]} for s in step_performance],
            },
            "version_stats": {
                "timeline": [{"date": v[0].isoformat(), "count": v[1]} for v in version_stats],
            },
            "activity_stats": {
                "timeline": [{"date": a[0].isoformat(), "count": a[1]} for a in user_activity],
            }
        }
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")

@router.get("/dashboard/recent-activity", response_model=List[Dict[str, Any]])
async def get_recent_activity(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = 10
):
    """Get recent system activity"""
    try:
        activities = db.query(Activity).join(User).filter(
            User.company_id == current_user.company_id
        ).order_by(Activity.created_at.desc()).limit(limit).all()
        
        return [
            {
                "id": a.id,
                "action": a.action,
                "user": f"{a.user.f_name} {a.user.l_name}",
                "document_id": a.document_id,
                "created_at": a.created_at.isoformat(),
                "details": a.details
            }
            for a in activities
        ]
    except Exception as e:
        logger.error(f"Error getting recent activity: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recent activity: {str(e)}")

@router.get("/dashboard/pending-approvals", response_model=List[Dict[str, Any]])
async def get_pending_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get pending workflow approvals for current user"""
    try:
        pending_workflows = db.query(DocumentWorkflow).join(
            WorkflowStep, and_(
                WorkflowStep.workflow_id == DocumentWorkflow.workflow_id,
                WorkflowStep.step_number == DocumentWorkflow.current_step
            )
        ).join(Document).filter(
            Document.company_id == current_user.company_id,
            DocumentWorkflow.status == "in_progress",
            or_(
                WorkflowStep.role_required == None,
                WorkflowStep.role_required == current_user.role.value
            )
        ).order_by(DocumentWorkflow.timeout_at.asc()).limit(5).all()
        
        return [
            {
                "id": w.id,
                "document_id": w.document_id,
                "document_title": w.document.title,
                "current_step": w.current_step,
                "timeout_at": w.timeout_at.isoformat() if w.timeout_at else None,
                "started_at": w.started_at.isoformat() if w.started_at else None
            }
            for w in pending_workflows
        ]
    except Exception as e:
        logger.error(f"Error getting pending approvals: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get pending approvals: {str(e)}")
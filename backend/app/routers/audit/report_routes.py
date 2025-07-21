"""
Audit report generation and management routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from .models import ReportCreate, ReportUpdate

report_router = APIRouter(prefix="/api/audits", tags=["audit-reports"])

@report_router.get("/{audit_id}/report")
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

@report_router.post("/{audit_id}/report")
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

@report_router.put("/{audit_id}/report/{report_id}")
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

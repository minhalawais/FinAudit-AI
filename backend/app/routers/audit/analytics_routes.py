"""
Analytics and performance tracking routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from typing import Optional

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *

analytics_router = APIRouter(prefix="/api/audits", tags=["audit-analytics"])

@analytics_router.get("/analytics/performance")
async def get_auditor_performance(
    timeframe: str = Query("6months"),
    sort: str = Query("rating"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor performance analytics"""
    
    # Calculate date range
    end_date = datetime.now()
    if timeframe == "3months":
        start_date = end_date - timedelta(days=90)
    elif timeframe == "12months":
        start_date = end_date - timedelta(days=365)
    else:  # 6months default
        start_date = end_date - timedelta(days=180)
    
    # Get auditors with performance data
    auditors = db.query(User).filter(
        User.role == UserRole.auditor,
        User.is_active == True
    ).all()
    
    performance_data = []
    
    for auditor in auditors:
        # Get audit assignments in timeframe
        assignments = db.execute(
            text("""
                SELECT COUNT(*) as total_audits
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND aaa.assigned_at >= :start_date 
                AND aaa.assigned_at <= :end_date
            """),
            {"auditor_id": auditor.id, "start_date": start_date, "end_date": end_date}
        ).fetchone()
        
        total_audits = assignments.total_audits if assignments else 0
        
        if total_audits == 0:
            continue
        
        # Mock performance metrics (replace with actual calculations)
        performance_data.append({
            "id": auditor.id,
            "name": f"{auditor.f_name} {auditor.l_name}",
            "email": auditor.email,
            "total_audits": total_audits,
            "completed_audits": total_audits,  # Mock data
            "average_rating": 4.2,  # Calculate from actual ratings
            "on_time_delivery": 85,  # Calculate from actual delivery dates
            "quality_score": 8.5,   # Calculate from quality assessments
            "cost_efficiency": 7.8,  # Calculate from cost data
            "client_satisfaction": 4.1,  # Calculate from client feedback
            "specializations": auditor.specializations or [],
            "recent_audits": [],  # Add recent audit data
            "performance_trends": []  # Add trend data
        })
    
    # Sort results
    if sort == "rating":
        performance_data.sort(key=lambda x: x["average_rating"], reverse=True)
    elif sort == "efficiency":
        performance_data.sort(key=lambda x: x["cost_efficiency"], reverse=True)
    elif sort == "audits":
        performance_data.sort(key=lambda x: x["total_audits"], reverse=True)
    
    return {"auditors": performance_data}

@analytics_router.get("/analytics/compliance")
async def get_compliance_status(
    timeframe: str = Query("6months"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get company compliance status"""
    
    company_id = current_user.company_id
    if not company_id:
        raise HTTPException(status_code=400, detail="User not associated with company")
    
    # Calculate compliance metrics
    total_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id
    ).count()
    
    completed_requirements = db.query(DocumentRequirement).join(
        DocumentSubmission
    ).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentSubmission.verification_status == EvidenceStatus.approved
    ).count()
    
    pending_requirements = total_requirements - completed_requirements
    
    # Get overdue requirements
    overdue_requirements = db.query(DocumentRequirement).join(Audit).filter(
        Audit.company_id == company_id,
        DocumentRequirement.deadline < datetime.now()
    ).count()
    
    # Get findings data
    critical_findings = db.query(AuditFinding).join(Audit).filter(
        Audit.company_id == company_id,
        AuditFinding.severity == FindingSeverity.critical,
        AuditFinding.status != FindingStatus.resolved
    ).count()
    
    resolved_findings = db.query(AuditFinding).join(Audit).filter(
        Audit.company_id == company_id,
        AuditFinding.status == FindingStatus.resolved
    ).count()
    
    # Calculate overall compliance score
    overall_score = (completed_requirements / total_requirements * 100) if total_requirements > 0 else 0
    
    return {
        "overall_score": round(overall_score, 1),
        "total_requirements": total_requirements,
        "completed_requirements": completed_requirements,
        "pending_requirements": pending_requirements,
        "overdue_requirements": overdue_requirements,
        "critical_findings": critical_findings,
        "resolved_findings": resolved_findings,
        "action_items": {
            "total": 25,  # Calculate from actual data
            "completed": 18,
            "overdue": 3
        },
        "compliance_trends": [
            {"month": "Jan", "score": 75},
            {"month": "Feb", "score": 78},
            {"month": "Mar", "score": 82},
            {"month": "Apr", "score": 85},
            {"month": "May", "score": 88},
            {"month": "Jun", "score": round(overall_score, 1)}
        ],
        "gap_analysis": [
            {
                "category": "Document Management",
                "current_score": 85,
                "target_score": 95,
                "gap": 10,
                "priority": "medium"
            },
            {
                "category": "Risk Assessment",
                "current_score": 70,
                "target_score": 90,
                "gap": 20,
                "priority": "high"
            },
            {
                "category": "Compliance Monitoring",
                "current_score": 90,
                "target_score": 95,
                "gap": 5,
                "priority": "low"
            }
        ],
        "upcoming_deadlines": [
            {
                "id": 1,
                "title": "Financial Statements Review",
                "deadline": (datetime.now() + timedelta(days=5)).isoformat(),
                "days_remaining": 5,
                "type": "document_submission"
            },
            {
                "id": 2,
                "title": "Compliance Report",
                "deadline": (datetime.now() + timedelta(days=12)).isoformat(),
                "days_remaining": 12,
                "type": "audit_deliverable"
            }
        ]
    }

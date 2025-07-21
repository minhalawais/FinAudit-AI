"""
Compliance tracking and monitoring routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, text, func, and_
from typing import Optional, List
from datetime import datetime, timedelta
import calendar

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *

compliance_router = APIRouter(prefix="/api/compliance", tags=["compliance"])

@compliance_router.get("/company-status")
async def get_company_compliance_status(
    timeframe: str = Query("6months", regex="^(3months|6months|12months)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive compliance status for the company"""
    
    # Calculate date range based on timeframe
    end_date = datetime.utcnow()
    if timeframe == "3months":
        start_date = end_date - timedelta(days=90)
        months_back = 3
    elif timeframe == "6months":
        start_date = end_date - timedelta(days=180)
        months_back = 6
    else:  # 12months
        start_date = end_date - timedelta(days=365)
        months_back = 12
    
    # Get all audits for the company within timeframe
    company_audits = db.query(Audit).filter(
        Audit.company_id == current_user.company_id,
        Audit.created_at >= start_date
    ).all()
    
    audit_ids = [audit.id for audit in company_audits]
    
    if not audit_ids:
        # Return empty data structure if no audits
        return {
            "overall_score": 0,
            "total_requirements": 0,
            "completed_requirements": 0,
            "pending_requirements": 0,
            "overdue_requirements": 0,
            "critical_findings": 0,
            "resolved_findings": 0,
            "action_items": {
                "total": 0,
                "completed": 0,
                "overdue": 0
            },
            "compliance_trends": [],
            "gap_analysis": [],
            "upcoming_deadlines": []
        }
    
    # Get compliance checkpoints
    checkpoints = db.query(ComplianceCheckpoint).filter(
        ComplianceCheckpoint.audit_id.in_(audit_ids)
    ).all()
    
    # Calculate overall compliance score
    total_checkpoints = len(checkpoints)
    passed_checkpoints = len([cp for cp in checkpoints if cp.status == ComplianceStatus.passed])
    overall_score = (passed_checkpoints / total_checkpoints * 100) if total_checkpoints > 0 else 0
    
    # Get document requirements statistics
    requirements_stats = db.execute(
        text("""
            SELECT 
                COUNT(*) as total_requirements,
                COUNT(CASE WHEN ds.verification_status = 'approved' THEN 1 END) as completed_requirements,
                COUNT(CASE WHEN ds.verification_status = 'pending' THEN 1 END) as pending_requirements,
                COUNT(CASE WHEN dr.deadline < :current_date AND (ds.verification_status IS NULL OR ds.verification_status != 'approved') THEN 1 END) as overdue_requirements
            FROM document_requirements dr
            LEFT JOIN document_submissions ds ON dr.id = ds.requirement_id
            WHERE dr.audit_id = ANY(:audit_ids)
        """),
        {
            "audit_ids": audit_ids,
            "current_date": datetime.utcnow()
        }
    ).fetchone()
    
    # Get findings statistics
    findings_stats = db.execute(
        text("""
            SELECT 
                COUNT(CASE WHEN severity = 'critical' AND status != 'resolved' THEN 1 END) as critical_findings,
                COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_findings
            FROM audit_findings
            WHERE audit_id = ANY(:audit_ids)
        """),
        {"audit_ids": audit_ids}
    ).fetchone()
    
    # Get action items statistics
    action_items_stats = db.execute(
        text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN ai.status = 'completed' THEN 1 END) as completed,
                COUNT(CASE WHEN ai.status = 'overdue' OR (ai.due_date < :current_date AND ai.status != 'completed') THEN 1 END) as overdue
            FROM action_items ai
            JOIN audit_findings af ON ai.finding_id = af.id
            WHERE af.audit_id = ANY(:audit_ids)
        """),
        {
            "audit_ids": audit_ids,
            "current_date": datetime.utcnow()
        }
    ).fetchone()
    
    # Generate compliance trends (monthly data)
    compliance_trends = []
    for i in range(months_back):
        month_start = end_date - timedelta(days=30 * (i + 1))
        month_end = end_date - timedelta(days=30 * i)
        
        month_checkpoints = db.query(ComplianceCheckpoint).join(Audit).filter(
            Audit.company_id == current_user.company_id,
            ComplianceCheckpoint.checked_at.between(month_start, month_end)
        ).all()
        
        if month_checkpoints:
            month_passed = len([cp for cp in month_checkpoints if cp.status == ComplianceStatus.passed])
            month_score = (month_passed / len(month_checkpoints) * 100)
        else:
            month_score = overall_score  # Use overall score as fallback
        
        compliance_trends.insert(0, {
            "month": month_start.strftime("%b %Y"),
            "score": round(month_score, 1)
        })
    
    # Generate gap analysis by compliance framework
    gap_analysis = []
    frameworks = ["SOX", "GDPR", "HIPAA", "ISO27001", "PCI-DSS"]
    
    for framework in frameworks:
        framework_checkpoints = [cp for cp in checkpoints if cp.checkpoint_type.upper() == framework]
        
        if framework_checkpoints:
            current_passed = len([cp for cp in framework_checkpoints if cp.status == ComplianceStatus.passed])
            current_score = (current_passed / len(framework_checkpoints) * 100)
            target_score = 95  # Target 95% compliance
            gap = max(0, target_score - current_score)
            
            # Determine priority based on gap
            if gap >= 20:
                priority = "high"
            elif gap >= 10:
                priority = "medium"
            else:
                priority = "low"
            
            gap_analysis.append({
                "category": framework,
                "current_score": round(current_score, 1),
                "target_score": target_score,
                "gap": round(gap, 1),
                "priority": priority
            })
    
    # Get upcoming deadlines
    upcoming_deadlines = db.execute(
        text("""
            SELECT 
                dr.id,
                dr.document_type as title,
                dr.deadline,
                EXTRACT(DAY FROM (dr.deadline - :current_date)) as days_remaining,
                'Document Requirement' as type
            FROM document_requirements dr
            WHERE dr.audit_id = ANY(:audit_ids)
            AND dr.deadline > :current_date
            AND dr.deadline <= :future_date
            AND NOT EXISTS (
                SELECT 1 FROM document_submissions ds 
                WHERE ds.requirement_id = dr.id 
                AND ds.verification_status = 'approved'
            )
            ORDER BY dr.deadline ASC
            LIMIT 10
        """),
        {
            "audit_ids": audit_ids,
            "current_date": datetime.utcnow(),
            "future_date": datetime.utcnow() + timedelta(days=30)
        }
    ).fetchall()
    
    upcoming_deadlines_list = []
    for deadline in upcoming_deadlines:
        upcoming_deadlines_list.append({
            "id": deadline.id,
            "title": deadline.title,
            "deadline": deadline.deadline.isoformat(),
            "days_remaining": int(deadline.days_remaining) if deadline.days_remaining else 0,
            "type": deadline.type
        })
    
    return {
        "overall_score": round(overall_score, 1),
        "total_requirements": requirements_stats.total_requirements or 0,
        "completed_requirements": requirements_stats.completed_requirements or 0,
        "pending_requirements": requirements_stats.pending_requirements or 0,
        "overdue_requirements": requirements_stats.overdue_requirements or 0,
        "critical_findings": findings_stats.critical_findings or 0,
        "resolved_findings": findings_stats.resolved_findings or 0,
        "action_items": {
            "total": action_items_stats.total or 0,
            "completed": action_items_stats.completed or 0,
            "overdue": action_items_stats.overdue or 0
        },
        "compliance_trends": compliance_trends,
        "gap_analysis": gap_analysis,
        "upcoming_deadlines": upcoming_deadlines_list
    }

@compliance_router.get("/audit/{audit_id}/checkpoints")
async def get_audit_compliance_checkpoints(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get compliance checkpoints for a specific audit"""
    
    # Verify audit access
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    checkpoints = db.query(ComplianceCheckpoint).filter(
        ComplianceCheckpoint.audit_id == audit_id
    ).options(
        joinedload(ComplianceCheckpoint.requirement)
    ).all()
    
    checkpoints_list = []
    for cp in checkpoints:
        checkpoints_list.append({
            "id": cp.id,
            "checkpoint_type": cp.checkpoint_type,
            "status": cp.status.value,
            "score": cp.score,
            "details": cp.details,
            "checked_at": cp.checked_at.isoformat(),
            "next_check_at": cp.next_check_at.isoformat() if cp.next_check_at else None,
            "requirement": {
                "id": cp.requirement.id,
                "document_type": cp.requirement.document_type,
                "is_mandatory": cp.requirement.is_mandatory
            } if cp.requirement else None
        })
    
    return {"checkpoints": checkpoints_list}

@compliance_router.post("/audit/{audit_id}/checkpoints")
async def create_compliance_checkpoint(
    audit_id: int,
    checkpoint_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new compliance checkpoint"""
    
    # Verify audit access
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create checkpoint
    checkpoint = ComplianceCheckpoint(
        audit_id=audit_id,
        requirement_id=checkpoint_data.get("requirement_id"),
        checkpoint_type=checkpoint_data.get("checkpoint_type"),
        status=ComplianceStatus(checkpoint_data.get("status", "pending_review")),
        score=checkpoint_data.get("score", 0.0),
        details=checkpoint_data.get("details", {}),
        checked_at=datetime.utcnow(),
        next_check_at=datetime.fromisoformat(checkpoint_data["next_check_at"]) if checkpoint_data.get("next_check_at") else None
    )
    
    db.add(checkpoint)
    db.commit()
    db.refresh(checkpoint)
    
    return {
        "message": "Compliance checkpoint created successfully",
        "checkpoint_id": checkpoint.id,
        "created_at": checkpoint.checked_at.isoformat()
    }

@compliance_router.put("/checkpoints/{checkpoint_id}")
async def update_compliance_checkpoint(
    checkpoint_id: int,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a compliance checkpoint"""
    
    checkpoint = db.query(ComplianceCheckpoint).join(Audit).filter(
        ComplianceCheckpoint.id == checkpoint_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Compliance checkpoint not found")
    
    # Update fields
    if "status" in update_data:
        checkpoint.status = ComplianceStatus(update_data["status"])
    if "score" in update_data:
        checkpoint.score = update_data["score"]
    if "details" in update_data:
        checkpoint.details = update_data["details"]
    if "next_check_at" in update_data:
        checkpoint.next_check_at = datetime.fromisoformat(update_data["next_check_at"]) if update_data["next_check_at"] else None
    
    checkpoint.checked_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "message": "Compliance checkpoint updated successfully",
        "checkpoint_id": checkpoint.id,
        "updated_at": checkpoint.checked_at.isoformat()
    }

@compliance_router.get("/frameworks")
async def get_compliance_frameworks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available compliance frameworks"""
    
    frameworks = [
        {
            "code": "SOX",
            "name": "Sarbanes-Oxley Act",
            "description": "Financial reporting and corporate governance",
            "industry": "Financial Services"
        },
        {
            "code": "GDPR",
            "name": "General Data Protection Regulation",
            "description": "Data protection and privacy",
            "industry": "All Industries"
        },
        {
            "code": "HIPAA",
            "name": "Health Insurance Portability and Accountability Act",
            "description": "Healthcare data protection",
            "industry": "Healthcare"
        },
        {
            "code": "ISO27001",
            "name": "ISO/IEC 27001",
            "description": "Information security management",
            "industry": "Technology"
        },
        {
            "code": "PCI-DSS",
            "name": "Payment Card Industry Data Security Standard",
            "description": "Payment card data protection",
            "industry": "Retail/E-commerce"
        }
    ]
    
    return {"frameworks": frameworks}

@compliance_router.get("/audit/{audit_id}/compliance-report")
async def generate_compliance_report(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate a comprehensive compliance report for an audit"""
    
    # Verify audit access
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get compliance checkpoints
    checkpoints = db.query(ComplianceCheckpoint).filter(
        ComplianceCheckpoint.audit_id == audit_id
    ).all()
    
    # Get requirements and their status
    requirements = db.execute(
        text("""
            SELECT 
                dr.*,
                ds.verification_status,
                ds.submitted_at,
                ds.reviewed_at
            FROM document_requirements dr
            LEFT JOIN document_submissions ds ON dr.id = ds.requirement_id
            WHERE dr.audit_id = :audit_id
            ORDER BY dr.created_at
        """),
        {"audit_id": audit_id}
    ).fetchall()
    
    # Get findings
    findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).all()
    
    # Calculate compliance metrics
    total_checkpoints = len(checkpoints)
    passed_checkpoints = len([cp for cp in checkpoints if cp.status == ComplianceStatus.passed])
    failed_checkpoints = len([cp for cp in checkpoints if cp.status == ComplianceStatus.failed])
    warning_checkpoints = len([cp for cp in checkpoints if cp.status == ComplianceStatus.warning])
    
    compliance_score = (passed_checkpoints / total_checkpoints * 100) if total_checkpoints > 0 else 0
    
    # Categorize findings by severity
    critical_findings = [f for f in findings if f.severity == FindingSeverity.critical]
    major_findings = [f for f in findings if f.severity == FindingSeverity.major]
    minor_findings = [f for f in findings if f.severity == FindingSeverity.minor]
    
    # Requirements status
    total_requirements = len(requirements)
    completed_requirements = len([r for r in requirements if r.verification_status == "approved"])
    pending_requirements = len([r for r in requirements if r.verification_status == "pending"])
    overdue_requirements = len([r for r in requirements if r.deadline and r.deadline < datetime.utcnow() and r.verification_status != "approved"])
    
    report = {
        "audit_info": {
            "id": audit.id,
            "name": audit.name,
            "status": audit.status.value,
            "start_date": audit.start_date.isoformat() if audit.start_date else None,
            "end_date": audit.end_date.isoformat() if audit.end_date else None,
            "compliance_frameworks": audit.compliance_frameworks or []
        },
        "compliance_summary": {
            "overall_score": round(compliance_score, 1),
            "total_checkpoints": total_checkpoints,
            "passed_checkpoints": passed_checkpoints,
            "failed_checkpoints": failed_checkpoints,
            "warning_checkpoints": warning_checkpoints,
            "pending_checkpoints": total_checkpoints - passed_checkpoints - failed_checkpoints - warning_checkpoints
        },
        "requirements_summary": {
            "total_requirements": total_requirements,
            "completed_requirements": completed_requirements,
            "pending_requirements": pending_requirements,
            "overdue_requirements": overdue_requirements,
            "completion_rate": round((completed_requirements / total_requirements * 100), 1) if total_requirements > 0 else 0
        },
        "findings_summary": {
            "total_findings": len(findings),
            "critical_findings": len(critical_findings),
            "major_findings": len(major_findings),
            "minor_findings": len(minor_findings),
            "resolved_findings": len([f for f in findings if f.status == FindingStatus.resolved])
        },
        "detailed_checkpoints": [
            {
                "id": cp.id,
                "checkpoint_type": cp.checkpoint_type,
                "status": cp.status.value,
                "score": cp.score,
                "details": cp.details,
                "checked_at": cp.checked_at.isoformat()
            } for cp in checkpoints
        ],
        "critical_issues": [
            {
                "id": f.id,
                "title": f.title,
                "description": f.description,
                "severity": f.severity.value,
                "status": f.status.value,
                "created_at": f.created_at.isoformat()
            } for f in critical_findings
        ],
        "recommendations": [
            "Address all critical findings immediately",
            "Implement regular compliance monitoring",
            "Establish clear documentation procedures",
            "Conduct regular training on compliance requirements"
        ],
        "generated_at": datetime.utcnow().isoformat()
    }
    
    return report

@compliance_router.get("/dashboard-metrics")
async def get_compliance_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get key compliance metrics for dashboard"""
    
    # Get recent audits (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    recent_audits = db.query(Audit).filter(
        Audit.company_id == current_user.company_id,
        Audit.created_at >= six_months_ago
    ).all()
    
    audit_ids = [audit.id for audit in recent_audits]
    
    if not audit_ids:
        return {
            "total_audits": 0,
            "average_compliance_score": 0,
            "active_findings": 0,
            "overdue_requirements": 0,
            "compliance_trend": "stable"
        }
    
    # Get compliance checkpoints
    checkpoints = db.query(ComplianceCheckpoint).filter(
        ComplianceCheckpoint.audit_id.in_(audit_ids)
    ).all()
    
    # Calculate average compliance score
    if checkpoints:
        passed_checkpoints = len([cp for cp in checkpoints if cp.status == ComplianceStatus.passed])
        average_compliance_score = (passed_checkpoints / len(checkpoints) * 100)
    else:
        average_compliance_score = 0
    
    # Get active findings
    active_findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id.in_(audit_ids),
        AuditFinding.status.in_([FindingStatus.open, FindingStatus.in_progress])
    ).count()
    
    # Get overdue requirements
    overdue_requirements = db.execute(
        text("""
            SELECT COUNT(*)
            FROM document_requirements dr
            LEFT JOIN document_submissions ds ON dr.id = ds.requirement_id
            WHERE dr.audit_id = ANY(:audit_ids)
            AND dr.deadline < :current_date
            AND (ds.verification_status IS NULL OR ds.verification_status != 'approved')
        """),
        {
            "audit_ids": audit_ids,
            "current_date": datetime.utcnow()
        }
    ).scalar()
    
    # Calculate compliance trend (compare last 3 months vs previous 3 months)
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    
    recent_checkpoints = [cp for cp in checkpoints if cp.checked_at >= three_months_ago]
    older_checkpoints = [cp for cp in checkpoints if cp.checked_at < three_months_ago]
    
    if recent_checkpoints and older_checkpoints:
        recent_score = len([cp for cp in recent_checkpoints if cp.status == ComplianceStatus.passed]) / len(recent_checkpoints) * 100
        older_score = len([cp for cp in older_checkpoints if cp.status == ComplianceStatus.passed]) / len(older_checkpoints) * 100
        
        if recent_score > older_score + 5:
            compliance_trend = "improving"
        elif recent_score < older_score - 5:
            compliance_trend = "declining"
        else:
            compliance_trend = "stable"
    else:
        compliance_trend = "stable"
    
    return {
        "total_audits": len(recent_audits),
        "average_compliance_score": round(average_compliance_score, 1),
        "active_findings": active_findings,
        "overdue_requirements": overdue_requirements or 0,
        "compliance_trend": compliance_trend
    }

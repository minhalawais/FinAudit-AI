"""
Auditor directory and invitation management routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, or_, text
from typing import Optional
from datetime import datetime, timedelta
import uuid

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from .models import AuditorInviteRequest
from .services import invite_auditor_with_credentials,send_auditor_invitation_email
auditors_router = APIRouter(prefix="/api/auditors", tags=["auditors"])

@auditors_router.get("")
async def get_auditors(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query("all"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get auditor directory with search and filters"""
    
    query = db.query(User).filter(
        User.role == UserRole.auditor,
        User.is_active == True
    )
    
    # Apply search filter
    if search:
        query = query.filter(
            or_(
                User.f_name.ilike(f"%{search}%"),
                User.l_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%")
            )
        )
    print('Query after search:', query)
    # Apply status filter
    if status != "all":
        if status == "active":
            query = query.filter(User.availability_status == "available")
        elif status == "inactive":
            query = query.filter(User.availability_status != "available")
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    offset = (page - 1) * limit
    auditors = query.offset(offset).limit(limit).all()
    print('Auditors fetched:', auditors)
    # Build auditor list with additional data
    auditor_list = []
    for auditor in auditors:
        # Get audit statistics
        total_audits = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        completed_audits = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND a.status = 'completed'
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        current_assignments = db.execute(
            text("""
                SELECT COUNT(*) as count
                FROM audit_auditor_assignments aaa
                JOIN audits a ON aaa.audit_id = a.id
                WHERE aaa.auditor_id = :auditor_id 
                AND aaa.is_active = true
                AND a.status = 'in_progress'
            """),
            {"auditor_id": auditor.id}
        ).fetchone()
        
        auditor_list.append({
            "id": auditor.id,
            "name": f"{auditor.f_name} {auditor.l_name}",
            "email": auditor.email,
            "specializations": auditor.specializations or [],
            "rating": 4.2,  # Mock rating - implement actual rating system
            "completed_audits": completed_audits.count if completed_audits else 0,
            "current_assignments": current_assignments.count if current_assignments else 0,
            "last_active": auditor.last_login.isoformat() if auditor.last_login else None,
            "status": "active" if auditor.availability_status == "available" else "inactive",
            "hourly_rate": auditor.hourly_rate,
            "certifications": auditor.certifications or []
        })
    
    return {
        "auditors": auditor_list,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }

@auditors_router.post("/invite")
async def invite_auditor(
    invite_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Invite an auditor to join the platform"""
    email = invite_data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    try:
        invitation = await invite_auditor_with_credentials(
            audit_id=None,  # General invitation
            email=email,
            invited_by=current_user.id,
            db=db
        )
        
        return {
            "message": "Invitation sent successfully",
            "invitation_id": invitation.id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auditors_router.get("/auditor-invitations")
async def get_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all auditor invitations for current user's company"""
    invitations = db.query(AuditorInvitation).filter(
        AuditorInvitation.company_id == current_user.company_id
    ).options(
        joinedload(AuditorInvitation.inviter)
    ).all()
    
    invitation_list = []
    for invite in invitations:
        invitation_list.append({
            "id": invite.id,
            "email": invite.email,
            "status": invite.status.value,
            "invited_at": invite.invited_at.isoformat(),
            "responded_at": invite.responded_at.isoformat() if invite.responded_at else None,
            "inviter": {
                "id": invite.inviter.id,
                "name": f"{invite.inviter.f_name} {invite.inviter.l_name}"
            },
            "token": invite.token,
            "expires_at": invite.expires_at.isoformat()
        })
    
    return {"invitations": invitation_list}

@auditors_router.post("/auditor-invitations/{invitation_id}/resend")
async def resend_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Resend an auditor invitation"""
    invitation = db.query(AuditorInvitation).filter(
        AuditorInvitation.id == invitation_id,
        AuditorInvitation.company_id == current_user.company_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.status != InvitationStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending invitations can be resent")
    
    try:
        await send_auditor_invitation_email(
            email=invitation.email,
            temp_password=invitation.temp_password,
            token=invitation.token,
            audit_id=None,
            inviting_user=current_user
        )
        
        invitation.expires_at = datetime.utcnow() + timedelta(days=7)
        db.commit()
        
        return {"message": "Invitation resent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@auditors_router.delete("/auditor-invitations/{invitation_id}")
async def cancel_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cancel an auditor invitation"""
    invitation = db.query(AuditorInvitation).filter(
        AuditorInvitation.id == invitation_id,
        AuditorInvitation.company_id == current_user.company_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    db.delete(invitation)
    db.commit()
    
    return {"message": "Invitation cancelled successfully"}
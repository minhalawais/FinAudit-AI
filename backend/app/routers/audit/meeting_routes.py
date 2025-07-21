"""
Enhanced meeting scheduling and management routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta
from typing import List, Optional
import json

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import *
from app.routers.audit.models import MeetingCreate, MeetingUpdate, MeetingCompletionData # Import the new model
from .services import send_meeting_invites, generate_meeting_minutes_template

meeting_router = APIRouter(prefix="/api/audits", tags=["audit-meetings"])

@meeting_router.post("/{audit_id}/meetings")
async def schedule_meeting(
    audit_id: int,
    meeting_data: MeetingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Schedule audit meeting with enhanced functionality"""
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check if user has permission to schedule meetings
    if current_user.role not in [UserRole.admin, UserRole.auditor]:
        raise HTTPException(status_code=403, detail="Only admins and auditors can schedule meetings")
    
    meeting = AuditMeeting(
        audit_id=audit_id,
        title=meeting_data.title,
        meeting_type=MeetingType(meeting_data.meeting_type),
        scheduled_time=meeting_data.scheduled_time,
        duration_minutes=meeting_data.duration_minutes,
        location=meeting_data.location,
        meeting_url=meeting_data.meeting_url,
        notes=meeting_data.notes,
        created_by=current_user.id,
        meeting_objectives=meeting_data.meeting_objectives,
        is_recurring=meeting_data.is_recurring,
        recurrence_pattern=meeting_data.recurrence_pattern,
        recurrence_end_date=meeting_data.recurrence_end_date,
        preparation_checklist=meeting_data.preparation_checklist
    )
    
    db.add(meeting)
    db.flush()
    
    # Add attendees
    for email in meeting_data.attendee_emails:
        user = db.query(User).filter(User.email == email).first()
        if user:
            attendee = MeetingAttendee(
                meeting_id=meeting.id,
                user_id=user.id,
                is_required=True
            )
            db.add(attendee)
    
    # Add agenda items
    for item_data in meeting_data.agenda_items:
        agenda_item = MeetingAgendaItem(
            meeting_id=meeting.id,
            title=item_data["title"],
            description=item_data.get("description", ""),
            time_allocation=item_data.get("time_allocation", 10),
            order_index=item_data.get("order_index", 0)
        )
        db.add(agenda_item)
    
    # Create initial meeting minutes template
    minutes = MeetingMinutes(
        meeting_id=meeting.id,
        content=generate_meeting_minutes_template(meeting_data.meeting_type),
        created_by=current_user.id
    )
    db.add(minutes)
    
    db.commit()
    db.refresh(meeting)
    
    # Send meeting invites asynchronously
    await send_meeting_invites(meeting.id, db)
    
    return {"meeting": meeting}

@meeting_router.get("/{audit_id}/meetings")
async def get_audit_meetings(
    audit_id: int,
    status: Optional[str] = None,
    meeting_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get audit meetings with enhanced filtering and permissions"""
    
    query = db.query(AuditMeeting).options(
        joinedload(AuditMeeting.attendees).joinedload(MeetingAttendee.user),
        joinedload(AuditMeeting.agenda_items),
        joinedload(AuditMeeting.minutes)
    ).filter(AuditMeeting.audit_id == audit_id)
    
    # Apply filters
    if status:
        query = query.filter(AuditMeeting.status == MeetingStatus(status))
    
    if meeting_type:
        query = query.filter(AuditMeeting.meeting_type == MeetingType(meeting_type))
    
    meetings = query.order_by(AuditMeeting.scheduled_time.desc()).limit(limit).all()
    
    # Check if user is part of any meeting attendees
    user_meetings = []
    for meeting in meetings:
        if current_user.role in [UserRole.admin, UserRole.auditor]:
            user_meetings.append(meeting)
        else:
            if any(attendee.user_id == current_user.id for attendee in meeting.attendees):
                user_meetings.append(meeting)
    
    return {
        "meetings": [
            {
                "id": meeting.id,
                "title": meeting.title,
                "meeting_type": meeting.meeting_type.value,
                "scheduled_time": meeting.scheduled_time.isoformat(),
                "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
                "duration_minutes": meeting.duration_minutes,
                "location": meeting.location,
                "meeting_url": meeting.meeting_url,
                "notes": meeting.notes,
                "status": meeting.status.value,
                "meeting_objectives": meeting.meeting_objectives,
                "is_recurring": meeting.is_recurring,
                "has_minutes": bool(meeting.minutes),
                "attendees": [
                    {
                        "id": attendee.id,
                        "user": {
                            "id": attendee.user.id,
                            "name": f"{attendee.user.f_name} {attendee.user.l_name}",
                            "email": attendee.user.email,
                            "role": attendee.user.role.value
                        },
                        "is_required": attendee.is_required,
                        "has_confirmed": attendee.has_confirmed,
                        "attended": attendee.attended
                    }
                    for attendee in meeting.attendees
                ],
                "agenda_items": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "description": item.description,
                        "time_allocation": item.time_allocation,
                        "is_completed": item.is_completed
                    }
                    for item in meeting.agenda_items
                ]
            }
            for meeting in user_meetings
        ]
    }

@meeting_router.get("/meetings/{meeting_id}")
async def get_meeting_details(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed meeting information"""
    
    meeting = db.query(AuditMeeting).options(
        joinedload(AuditMeeting.attendees).joinedload(MeetingAttendee.user),
        joinedload(AuditMeeting.agenda_items),
        joinedload(AuditMeeting.minutes),
        joinedload(AuditMeeting.feedback)
    ).filter(AuditMeeting.id == meeting_id).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions
    is_attendee = any(attendee.user_id == current_user.id for attendee in meeting.attendees)
    if current_user.role not in [UserRole.admin, UserRole.auditor] and not is_attendee:
        raise HTTPException(status_code=403, detail="You don't have permission to view this meeting")
    
    # Get action items for this meeting
    action_items = db.query(ActionItem).filter(
        ActionItem.meeting_id == meeting_id
    ).all()
    
    return {
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "meeting_type": meeting.meeting_type.value,
            "scheduled_time": meeting.scheduled_time.isoformat(),
            "end_time": meeting.end_time.isoformat() if meeting.end_time else None,
            "duration_minutes": meeting.duration_minutes,
            "location": meeting.location,
            "meeting_url": meeting.meeting_url,
            "recording_url": meeting.recording_url,
            "notes": meeting.notes,
            "status": meeting.status.value,
            "meeting_objectives": meeting.meeting_objectives,
            "meeting_outcomes": meeting.meeting_outcomes,
            "is_recurring": meeting.is_recurring,
            "preparation_checklist": meeting.preparation_checklist,
            "created_by": {
                "id": meeting.creator.id,
                "name": f"{meeting.creator.f_name} {meeting.creator.l_name}"
            },
            "created_at": meeting.created_at.isoformat(),
            "attendees": [
                {
                    "id": attendee.id,
                    "user": {
                        "id": attendee.user.id,
                        "name": f"{attendee.user.f_name} {attendee.user.l_name}",
                        "email": attendee.user.email,
                        "role": attendee.user.role.value
                    },
                    "is_required": attendee.is_required,
                    "has_confirmed": attendee.has_confirmed,
                    "attended": attendee.attended
                }
                for attendee in meeting.attendees
            ],
            "agenda_items": [
                {
                    "id": item.id,
                    "title": item.title,
                    "description": item.description,
                    "time_allocation": item.time_allocation,
                    "is_completed": item.is_completed
                }
                for item in meeting.agenda_items
            ],
            "minutes": [
                {
                    "id": minute.id,
                    "version": minute.version,
                    "created_at": minute.created_at.isoformat(),
                    "created_by": {
                        "id": minute.creator.id,
                        "name": f"{minute.creator.f_name} {minute.creator.l_name}"
                    }
                }
                for minute in meeting.minutes
            ],
            "feedback": [
                {
                    "id": fb.id,
                    "user_id": fb.user_id,
                    "rating": fb.rating,
                    "comments": fb.comments,
                    "submitted_at": fb.submitted_at.isoformat()
                }
                for fb in meeting.feedback
            ],
            "action_items": [
                {
                    "id": item.id,
                    "description": item.description,
                    "status": item.status.value,
                    "due_date": item.due_date.isoformat() if item.due_date else None,
                    "assigned_to": {
                        "id": item.assignee.id,
                        "name": f"{item.assignee.f_name} {item.assignee.l_name}"
                    } if item.assignee else None
                }
                for item in action_items
            ]
        }
    }

@meeting_router.put("/meetings/{meeting_id}")
async def update_meeting(
    meeting_id: int,
    meeting_data: MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update meeting details"""
    
    meeting = db.query(AuditMeeting).filter(AuditMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions - only creator or admin can update
    if current_user.id != meeting.created_by and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only meeting creator or admin can update")
    
    # Update fields
    if meeting_data.title:
        meeting.title = meeting_data.title
    if meeting_data.meeting_type:
        meeting.meeting_type = MeetingType(meeting_data.meeting_type)
    if meeting_data.scheduled_time:
        meeting.scheduled_time = meeting_data.scheduled_time
    if meeting_data.duration_minutes:
        meeting.duration_minutes = meeting_data.duration_minutes
    if meeting_data.location:
        meeting.location = meeting_data.location
    if meeting_data.meeting_url:
        meeting.meeting_url = meeting_data.meeting_url
    if meeting_data.notes:
        meeting.notes = meeting_data.notes
    if meeting_data.meeting_objectives:
        meeting.meeting_objectives = meeting_data.meeting_objectives
    if meeting_data.meeting_outcomes:
        meeting.meeting_outcomes = meeting_data.meeting_outcomes
    if meeting_data.status:
        meeting.status = MeetingStatus(meeting_data.status)
    
    meeting.updated_at = datetime.utcnow()
    
    # Handle attendees
    if meeting_data.attendee_emails:
        # Clear existing attendees
        db.query(MeetingAttendee).filter(MeetingAttendee.meeting_id == meeting_id).delete()
        
        # Add new attendees
        for email in meeting_data.attendee_emails:
            user = db.query(User).filter(User.email == email).first()
            if user:
                attendee = MeetingAttendee(
                    meeting_id=meeting.id,
                    user_id=user.id,
                    is_required=True
                )
                db.add(attendee)
    
    # Handle agenda items
    if meeting_data.agenda_items:
        # Clear existing agenda items
        db.query(MeetingAgendaItem).filter(MeetingAgendaItem.meeting_id == meeting_id).delete()
        
        # Add new agenda items
        for item_data in meeting_data.agenda_items:
            agenda_item = MeetingAgendaItem(
                meeting_id=meeting.id,
                title=item_data["title"],
                description=item_data.get("description", ""),
                time_allocation=item_data.get("time_allocation", 10),
                order_index=item_data.get("order_index", 0)
            )
            db.add(agenda_item)
    
    db.commit()
    
    # If meeting was rescheduled, send updates
    if any(field in meeting_data.dict(exclude_unset=True) for field in ['scheduled_time', 'duration_minutes']):
        await send_meeting_invites(meeting.id, db, is_update=True)
    
    return {"message": "Meeting updated successfully"}

@meeting_router.post("/meetings/{meeting_id}/minutes")
async def create_meeting_minutes(
    meeting_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create or update meeting minutes"""
    
    meeting = db.query(AuditMeeting).filter(AuditMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions - only attendees can create minutes
    is_attendee = any(attendee.user_id == current_user.id for attendee in meeting.attendees)
    if current_user.role not in [UserRole.admin, UserRole.auditor] and not is_attendee:
        raise HTTPException(status_code=403, detail="Only meeting attendees can create minutes")
    
    # Get latest minutes version
    latest_minutes = db.query(MeetingMinutes).filter(
        MeetingMinutes.meeting_id == meeting_id
    ).order_by(MeetingMinutes.version.desc()).first()
    
    new_version = latest_minutes.version + 1 if latest_minutes else 1
    
    minutes = MeetingMinutes(
        meeting_id=meeting_id,
        content=content,
        created_by=current_user.id,
        version=new_version
    )
    
    db.add(minutes)
    db.commit()
    
    return {"message": "Meeting minutes created successfully", "minutes_id": minutes.id}

@meeting_router.post("/meetings/{meeting_id}/feedback")
async def submit_meeting_feedback(
    meeting_id: int,
    rating: int,
    comments: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Submit feedback for a meeting"""
    
    meeting = db.query(AuditMeeting).filter(AuditMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user was an attendee
    is_attendee = any(attendee.user_id == current_user.id for attendee in meeting.attendees)
    if not is_attendee:
        raise HTTPException(status_code=403, detail="Only meeting attendees can submit feedback")
    
    # Check if feedback already submitted
    existing_feedback = db.query(MeetingFeedback).filter(
        MeetingFeedback.meeting_id == meeting_id,
        MeetingFeedback.user_id == current_user.id
    ).first()
    
    if existing_feedback:
        raise HTTPException(status_code=400, detail="Feedback already submitted for this meeting")
    
    feedback = MeetingFeedback(
        meeting_id=meeting_id,
        user_id=current_user.id,
        rating=rating,
        comments=comments
    )
    
    db.add(feedback)
    db.commit()
    
    return {"message": "Feedback submitted successfully"}

@meeting_router.post("/meetings/{meeting_id}/complete")
async def complete_meeting(
    meeting_id: int,
    completion_data: MeetingCompletionData, # Changed to accept a Pydantic model
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark meeting as completed and capture outcomes/notes"""
    
    meeting = db.query(AuditMeeting).filter(AuditMeeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check permissions - only creator or admin can complete
    if current_user.id != meeting.created_by and current_user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Only meeting creator or admin can complete")
    
    meeting.status = MeetingStatus.completed
    meeting.end_time = datetime.utcnow()
    
    # Update fields from completion_data
    if completion_data.meeting_outcomes is not None:
        meeting.meeting_outcomes = completion_data.meeting_outcomes
    if completion_data.notes is not None:
        meeting.notes = completion_data.notes
    if completion_data.recording_url is not None:
        meeting.recording_url = completion_data.recording_url
    
    db.commit()
    db.refresh(meeting) # Refresh to get updated fields
    
    return {"message": "Meeting marked as completed", "meeting": meeting} # Return updated meeting object

@meeting_router.get("/meetings/templates")
async def get_meeting_templates(
    meeting_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get meeting templates"""
    
    query = db.query(MeetingTemplate)
    
    if meeting_type:
        query = query.filter(MeetingTemplate.meeting_type == meeting_type)
    
    templates = query.filter(MeetingTemplate.is_active == True).all()
    
    return {
        "templates": [
            {
                "id": template.id,
                "name": template.name,
                "description": template.description,
                "meeting_type": template.meeting_type,
                "default_duration": template.default_duration,
                "default_agenda": template.default_agenda
            }
            for template in templates
        ]
    }

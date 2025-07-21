from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
from app.database import get_db
from app.models import (
    User, Audit, AuditMeeting, MeetingAttendee, 
    MeetingAgendaItem, UserRole
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

# F. Meeting Integration
@router.post("/meetings/auto-schedule")
async def auto_schedule_meeting(
    meeting_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rules-based scheduling of meetings
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    required_fields = ["audit_id", "meeting_type"]
    for field in required_fields:
        if field not in meeting_data:
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    audit_id = meeting_data["audit_id"]
    meeting_type = meeting_data["meeting_type"]
    
    # Get the audit
    audit = db.query(Audit).filter(
        Audit.id == audit_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Validate meeting type
    valid_meeting_types = ["kickoff", "progress", "urgent", "exit", "ad_hoc"]
    if meeting_type not in valid_meeting_types:
        raise HTTPException(status_code=400, detail=f"Invalid meeting type. Must be one of: {', '.join(valid_meeting_types)}")
    
    # Auto-generate meeting details based on type
    now = datetime.utcnow()
    meeting_details = {}
    
    if meeting_type == "kickoff":
        meeting_details = {
            "title": f"Kickoff Meeting - {audit.name}",
            "scheduled_time": now + timedelta(days=3),  # Schedule 3 days from now
            "duration_minutes": 60,
            "location": meeting_data.get("location", "Virtual Meeting"),
            "notes": "Initial kickoff meeting to discuss audit scope and requirements"
        }
    elif meeting_type == "progress":
        meeting_details = {
            "title": f"Progress Review - {audit.name}",
            "scheduled_time": now + timedelta(days=7),  # Schedule 1 week from now
            "duration_minutes": 45,
            "location": meeting_data.get("location", "Virtual Meeting"),
            "notes": "Review current progress and address any blockers"
        }
    elif meeting_type == "urgent":
        meeting_details = {
            "title": f"Urgent Meeting - {audit.name}",
            "scheduled_time": now + timedelta(hours=24),  # Schedule next day
            "duration_minutes": 30,
            "location": meeting_data.get("location", "Virtual Meeting"),
            "notes": "Urgent meeting to address critical issues"
        }
    elif meeting_type == "exit":
        meeting_details = {
            "title": f"Exit Meeting - {audit.name}",
            "scheduled_time": now + timedelta(days=14),  # Schedule 2 weeks from now
            "duration_minutes": 90,
            "location": meeting_data.get("location", "Virtual Meeting"),
            "notes": "Final meeting to review audit findings and next steps"
        }
    else:  # ad_hoc
        meeting_details = {
            "title": meeting_data.get("title", f"Ad Hoc Meeting - {audit.name}"),
            "scheduled_time": now + timedelta(days=2),  # Schedule 2 days from now
            "duration_minutes": 30,
            "location": meeting_data.get("location", "Virtual Meeting"),
            "notes": meeting_data.get("notes", "Ad hoc meeting")
        }
    
    # Override with provided values if any
    for key in meeting_details:
        if key in meeting_data:
            meeting_details[key] = meeting_data[key]
    
    # Parse scheduled_time if it's a string
    if isinstance(meeting_details["scheduled_time"], str):
        try:
            meeting_details["scheduled_time"] = datetime.fromisoformat(meeting_details["scheduled_time"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid scheduled_time format. Use ISO format (YYYY-MM-DDTHH:MM:SS)")
    
    # Calculate end time
    end_time = meeting_details["scheduled_time"] + timedelta(minutes=meeting_details["duration_minutes"])
    
    # Create meeting
    meeting = AuditMeeting(
        audit_id=audit_id,
        meeting_type=meeting_type,
        title=meeting_details["title"],
        scheduled_time=meeting_details["scheduled_time"],
        end_time=end_time,
        duration_minutes=meeting_details["duration_minutes"],
        location=meeting_details["location"],
        notes=meeting_details["notes"],
        status="scheduled",
        auto_scheduled=True
    )
    
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Add the current user as an attendee
    attendee = MeetingAttendee(
        meeting_id=meeting.id,
        user_id=current_user.id,
        is_required=True,
        has_confirmed=True
    )
    
    db.add(attendee)
    
    # Add other attendees if provided
    if "attendees" in meeting_data and isinstance(meeting_data["attendees"], list):
        for attendee_data in meeting_data["attendees"]:
            if isinstance(attendee_data, dict) and "user_id" in attendee_data:
                attendee = MeetingAttendee(
                    meeting_id=meeting.id,
                    user_id=attendee_data["user_id"],
                    is_required=attendee_data.get("is_required", True),
                    has_confirmed=attendee_data.get("has_confirmed", False)
                )
                db.add(attendee)
    
    # Add agenda items if provided
    if "agenda_items" in meeting_data and isinstance(meeting_data["agenda_items"], list):
        for i, item_data in enumerate(meeting_data["agenda_items"]):
            if isinstance(item_data, dict) and "title" in item_data:
                agenda_item = MeetingAgendaItem(
                    meeting_id=meeting.id,
                    position=i + 1,
                    title=item_data["title"],
                    description=item_data.get("description", ""),
                    related_document_id=item_data.get("related_document_id"),
                    related_finding_id=item_data.get("related_finding_id"),
                    time_allocation=item_data.get("time_allocation", 10),
                    is_completed=False
                )
                db.add(agenda_item)
    
    db.commit()
    
    return {
        "message": "Meeting auto-scheduled successfully",
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "meeting_type": meeting.meeting_type,
            "scheduled_time": meeting.scheduled_time.isoformat(),
            "end_time": meeting.end_time.isoformat(),
            "duration_minutes": meeting.duration_minutes,
            "location": meeting.location,
            "status": meeting.status
        }
    }

@router.post("/meetings/{mtg_id}/sync-calendar")
async def sync_meeting_to_calendar(
    mtg_id: int,
    sync_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Sync meeting to Outlook/Google calendar
    """
    # This endpoint is accessible to both auditors and auditees
    if current_user.role not in [UserRole.auditor, UserRole.admin, UserRole.auditee]:
        raise HTTPException(
            status_code=403,
            detail="Only auditors and auditees can sync meetings"
        )
    
    # Get the meeting
    meeting = db.query(AuditMeeting).join(Audit).filter(
        AuditMeeting.id == mtg_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # Check if user is an attendee
    is_attendee = db.query(MeetingAttendee).filter(
        MeetingAttendee.meeting_id == mtg_id,
        MeetingAttendee.user_id == current_user.id
    ).first() is not None
    
    if not is_attendee and current_user.role == UserRole.auditee:
        raise HTTPException(status_code=403, detail="You are not an attendee of this meeting")
    
    # Validate calendar type
    calendar_type = sync_data.get("calendar_type", "outlook")
    if calendar_type not in ["outlook", "google"]:
        raise HTTPException(status_code=400, detail="Calendar type must be 'outlook' or 'google'")
    
    # In a real system, this would integrate with the calendar API
    # For now, we'll just return a mock response
    
    # Get attendees
    attendees = db.query(MeetingAttendee).filter(
        MeetingAttendee.meeting_id == mtg_id
    ).all()
    
    attendee_emails = []
    for attendee in attendees:
        attendee_emails.append(attendee.user.email)
    
    # Get agenda items
    agenda_items = db.query(MeetingAgendaItem).filter(
        MeetingAgendaItem.meeting_id == mtg_id
    ).order_by(MeetingAgendaItem.position).all()
    
    agenda_text = ""
    for item in agenda_items:
        agenda_text += f"{item.position}. {item.title} ({item.time_allocation} min)\n"
        if item.description:
            agenda_text += f"   {item.description}\n"
    
    # Create calendar event data
    calendar_event = {
        "title": meeting.title,
        "start_time": meeting.scheduled_time.isoformat(),
        "end_time": meeting.end_time.isoformat(),
        "location": meeting.location,
        "description": f"{meeting.notes}\n\nAgenda:\n{agenda_text}",
        "attendees": attendee_emails
    }
    
    return {
        "message": f"Meeting synced to {calendar_type} calendar",
        "calendar_event": calendar_event,
        "calendar_type": calendar_type
    }

@router.post("/meetings/{mtg_id}/minutes")
async def process_meeting_minutes(
    mtg_id: int,
    minutes_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    NLP processing of meeting minutes
    """
    check_auditor_role(current_user)
    
    # Validate required fields
    if "minutes_text" not in minutes_data:
        raise HTTPException(status_code=400, detail="minutes_text is required")
    
    minutes_text = minutes_data["minutes_text"]
    
    # Get the meeting
    meeting = db.query(AuditMeeting).join(Audit).filter(
        AuditMeeting.id == mtg_id,
        Audit.company_id == current_user.company_id
    ).first()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    # In a real system, this would use NLP to process the minutes
    # For now, we'll just update the meeting notes and return a mock response
    
    # Update meeting notes
    meeting.notes = f"{meeting.notes}\n\n--- MINUTES ---\n{minutes_text}"
    meeting.status = "completed"
    
    # Mark all agenda items as completed
    agenda_items = db.query(MeetingAgendaItem).filter(
        MeetingAgendaItem.meeting_id == mtg_id
    ).all()
    
    for item in agenda_items:
        item.is_completed = True
    
    db.commit()
    
    # Mock NLP analysis
    action_items_detected = []
    decisions_made = []
    
    # Simple keyword detection for action items
    for line in minutes_text.split("\n"):
        if "action" in line.lower() or "task" in line.lower() or "todo" in line.lower():
            action_items_detected.append(line)
        elif "decided" in line.lower() or "agreed" in line.lower() or "conclusion" in line.lower():
            decisions_made.append(line)
    
    return {
        "message": "Meeting minutes processed successfully",
        "meeting": {
            "id": meeting.id,
            "title": meeting.title,
            "status": meeting.status
        },
        "nlp_analysis": {
            "action_items_detected": action_items_detected,
            "decisions_made": decisions_made,
            "key_topics": ["audit scope", "document requirements", "findings", "next steps"]
        }
    }

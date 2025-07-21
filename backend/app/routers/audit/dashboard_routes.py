from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, case, text, extract, distinct
from datetime import date, timedelta, datetime
from typing import List, Dict, Any
from app.database import get_db
from app.models import *
from app.routers.auth import get_current_user
from sqlalchemy.dialects.postgresql import JSONB # Import JSONB

router = APIRouter()

@router.get("/auditee/dashboard", response_model=Dict[str, Any])
async def get_auditee_dashboard_data(
  current_user: User = Depends(get_current_user),
  db: Session = Depends(get_db)
):
  if current_user.role != "auditee" and current_user.company_id is None:
      raise HTTPException(
          status_code=status.HTTP_403_FORBIDDEN,
          detail="Not authorized to access auditee dashboard or no company associated."
      )

  company_id = current_user.company_id
  if not company_id:
      raise HTTPException(
          status_code=status.HTTP_400_BAD_REQUEST,
          detail="User is not associated with a company."
      )

  twelve_months_ago = datetime.utcnow() - timedelta(days=365)

  # I. Dashboard Overview & Key Performance Indicators (KPIs)
  total_audits = db.query(Audit).filter(Audit.company_id == company_id).count()
  active_audits = db.query(Audit).filter(
      Audit.company_id == company_id,
      Audit.status.in_([AuditStatus.planned, AuditStatus.in_progress])
  ).count()

  pending_submissions_count = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.verification_status.in_([EvidenceStatus.pending, EvidenceStatus.needs_revision])
  ).count()

  overdue_action_items_count = db.query(ActionItem).join(AuditFinding).join(Audit).filter(
      Audit.company_id == company_id,
      ActionItem.due_date < date.today(),
      ActionItem.status != ActionItemStatus.completed
  ).count()

  total_mandatory_requirements = db.query(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentRequirement.is_mandatory == True
  ).count()
  approved_submissions_count = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.verification_status == EvidenceStatus.approved
  ).count()
  compliance_score = (approved_submissions_count / total_mandatory_requirements * 100) if total_mandatory_requirements > 0 else 0

  total_submissions_attempted = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id
  ).count()
  first_pass_approved_submissions = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.revision_round == 1,
      DocumentSubmission.verification_status == EvidenceStatus.approved
  ).count()
  avg_document_approval_rate_first_pass = (first_pass_approved_submissions / total_submissions_attempted * 100) if total_submissions_attempted > 0 else 0

  avg_audit_duration_days_result = db.query(
      func.avg(func.extract('day', Audit.end_date - Audit.start_date))
  ).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed,
      Audit.start_date.isnot(None),
      Audit.end_date.isnot(None)
  ).scalar()
  avg_audit_duration = round(avg_audit_duration_days_result, 2) if avg_audit_duration_days_result else 0

  total_completed_audits = db.query(Audit).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed
  ).count()
  on_time_completed_audits = db.query(Audit).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed,
      Audit.end_date <= Audit.deadline
  ).count()
  avg_audit_completion_rate = (on_time_completed_audits / total_completed_audits * 100) if total_completed_audits > 0 else 0


  kpis = {
      "total_audits": total_audits,
      "active_audits": active_audits,
      "pending_submissions": pending_submissions_count,
      "overdue_actions": overdue_action_items_count,
      "compliance_score": round(compliance_score, 2),
      "avg_document_approval_rate_first_pass": round(avg_document_approval_rate_first_pass, 2),
      "avg_audit_duration": avg_audit_duration,
      "avg_audit_completion_rate": round(avg_audit_completion_rate, 2)
  }

  # II. Audit Portfolio & Progress
  audit_status_distribution = db.query(Audit.status, func.count(Audit.id)).filter(
      Audit.company_id == company_id
  ).group_by(Audit.status).all()
  status_distribution_data = [{"status": s.value, "count": c} for s, c in audit_status_distribution]

  audit_type_distribution = db.query(Audit.audit_type, func.count(Audit.id)).filter(
      Audit.company_id == company_id
  ).group_by(Audit.audit_type).all()
  type_distribution_data = [{"type": t.value, "count": c} for t, c in audit_type_distribution]

  compliance_frameworks_raw = db.query(Audit.compliance_frameworks).filter(
      Audit.company_id == company_id,
      Audit.compliance_frameworks.isnot(None)
  ).all()
  framework_counts = {}
  for frameworks_json in compliance_frameworks_raw:
      frameworks = frameworks_json[0]
      if isinstance(frameworks, list):
          for framework in frameworks:
              framework_counts[framework] = framework_counts.get(framework, 0) + 1
  compliance_frameworks_data = [{"framework": f, "count": c} for f, c in framework_counts.items()]

  audit_progress_over_time = db.query(
      func.to_char(Audit.updated_at, 'YYYY-MM'),
      func.count(Audit.id)
  ).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed,
      Audit.updated_at >= twelve_months_ago
  ).group_by(func.to_char(Audit.updated_at, 'YYYY-MM')).order_by(func.to_char(Audit.updated_at, 'YYYY-MM')).all()
  progress_over_time_data = [{"month": m, "completed_count": c} for m, c in audit_progress_over_time]

  audit_approval_status_distribution = db.query(Audit.approval_status, func.count(Audit.id)).filter(
      Audit.company_id == company_id,
      Audit.requires_approval == True
  ).group_by(Audit.approval_status).all()
  approval_status_data = [{"status": s.value, "count": c} for s, c in audit_approval_status_distribution]

  audit_portfolio_analysis = {
      "status_distribution": status_distribution_data,
      "type_distribution": type_distribution_data,
      "compliance_frameworks": compliance_frameworks_data,
      "progress_over_time": progress_over_time_data,
      "approval_status_distribution": approval_status_data,
  }

  # III. Document Compliance Hub
  doc_submission_status_breakdown = db.query(DocumentSubmission.verification_status, func.count(DocumentSubmission.id)).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(DocumentSubmission.verification_status).all()
  submission_status_breakdown_data = [{"status": s.value, "count": c} for s, c in doc_submission_status_breakdown]

  doc_workflow_stages = db.query(DocumentSubmission.workflow_stage, func.count(DocumentSubmission.id)).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(DocumentSubmission.workflow_stage).all()
  workflow_stages_data = [{"stage": s.value, "count": c} for s, c in doc_workflow_stages]

  overdue_requirements = db.query(
      DocumentRequirement.document_type,
      DocumentRequirement.deadline,
      Audit.name.label("audit_name"),
      Audit.id.label("audit_id")
  ).join(Audit).outerjoin(DocumentSubmission, (DocumentSubmission.requirement_id == DocumentRequirement.id) & (DocumentSubmission.verification_status == EvidenceStatus.approved)).filter(
      Audit.company_id == company_id,
      DocumentRequirement.deadline < date.today(),
      DocumentSubmission.id.is_(None)
  ).limit(5).all()
  overdue_requirements_data = [{"document_type": r.document_type, "deadline": r.deadline.isoformat(), "audit_name": r.audit_name, "audit_id": r.audit_id} for r in overdue_requirements]

  documents_by_type = db.query(Document.file_type, func.count(Document.id)).filter(
      Document.company_id == company_id
  ).group_by(Document.file_type).all()
  documents_by_type_data = [{"type": t, "count": c} for t, c in documents_by_type]

  avg_revision_rounds_result = db.query(func.avg(DocumentSubmission.revision_round)).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.revision_round.isnot(None)
  ).scalar()
  avg_revision_rounds = round(avg_revision_rounds_result, 2) if avg_revision_rounds_result else 0

  total_doc_requirements = db.query(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id
  ).count()
  on_time_submissions = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.submitted_at <= DocumentRequirement.deadline,
      DocumentSubmission.submitted_at.isnot(None)
  ).count()
  late_submissions = db.query(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmission.submitted_at > DocumentRequirement.deadline,
      DocumentSubmission.submitted_at.isnot(None)
  ).count()
  
  submission_timeliness_data = [
      {"label": "On-Time", "value": on_time_submissions, "color": "#059669"},
      {"label": "Late", "value": late_submissions, "color": "#DC2626"},
      {"label": "Pending", "value": total_doc_requirements - on_time_submissions - late_submissions, "color": "#F59E0B"}
  ]


  document_management = {
      "submission_status_breakdown": submission_status_breakdown_data,
      "workflow_stages": workflow_stages_data,
      "overdue_requirements": overdue_requirements_data,
      "documents_by_type": documents_by_type_data,
      "avg_revision_rounds": avg_revision_rounds,
      "submission_timeliness": submission_timeliness_data,
  }

  # IV. Findings & Remediation Tracking
  findings_by_severity = db.query(AuditFinding.severity, func.count(AuditFinding.id)).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(AuditFinding.severity).all()
  findings_by_severity_data = [{"severity": s.value, "count": c} for s, c in findings_by_severity]

  findings_by_status = db.query(AuditFinding.status, func.count(AuditFinding.id)).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(AuditFinding.status).all()
  findings_by_status_data = [{"status": s.value, "count": c} for s, c in findings_by_status]

  action_item_status_breakdown = db.query(ActionItem.status, func.count(ActionItem.id)).join(AuditFinding).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(ActionItem.status).all()
  action_item_status_breakdown_data = [{"status": s.value, "count": c} for s, c in action_item_status_breakdown]

  findings_trend_new = db.query(
      func.to_char(AuditFinding.created_at, 'YYYY-MM'),
      func.count(AuditFinding.id)
  ).filter(
      AuditFinding.created_at >= twelve_months_ago,
      AuditFinding.audit_id.in_(db.query(Audit.id).filter(Audit.company_id == company_id))
  ).group_by(func.to_char(AuditFinding.created_at, 'YYYY-MM')).order_by(func.to_char(AuditFinding.created_at, 'YYYY-MM')).all()
  findings_trend_new_data = [{"month": m, "count": c} for m, c in findings_trend_new]

  findings_trend_resolved = db.query(
      func.to_char(AuditFinding.resolved_at, 'YYYY-MM'),
      func.count(AuditFinding.id)
  ).filter(
      AuditFinding.resolved_at.isnot(None),
      AuditFinding.resolved_at >= twelve_months_ago,
      AuditFinding.audit_id.in_(db.query(Audit.id).filter(Audit.company_id == company_id))
  ).group_by(func.to_char(AuditFinding.resolved_at, 'YYYY-MM')).order_by(func.to_char(AuditFinding.resolved_at, 'YYYY-MM')).all()
  findings_trend_resolved_data = [{"month": m, "count": c} for m, c in findings_trend_resolved]

  top_overdue_action_items = db.query(
      ActionItem.description,
      ActionItem.due_date,
      Audit.name.label("audit_name"),
      Audit.id.label("audit_id")
  ).select_from(ActionItem) \
  .join(AuditFinding, ActionItem.finding_id == AuditFinding.id) \
  .join(Audit) \
  .filter(
      Audit.company_id == company_id,
      ActionItem.due_date < date.today(),
          ActionItem.status != ActionItemStatus.completed
  ).order_by(ActionItem.due_date).limit(5).all()

  top_overdue_action_items_data = [{
      "description": a.description, 
      "due_date": a.due_date.isoformat(), 
      "audit_name": a.audit_name, 
      "audit_id": a.audit_id
  } for a in top_overdue_action_items]

  findings_by_type = db.query(AuditFinding.finding_type, func.count(AuditFinding.id)).join(Audit).filter(
      Audit.company_id == company_id,
      AuditFinding.finding_type.isnot(None)
  ).group_by(AuditFinding.finding_type).all()
  findings_by_type_data = [{"type": t, "count": c} for t, c in findings_by_type]

  ai_detected_findings_count = db.query(AuditFinding).join(Audit).filter(
      Audit.company_id == company_id,
      AuditFinding.ai_detected == True
  ).count()
  manual_findings_count = db.query(AuditFinding).join(Audit).filter(
      Audit.company_id == company_id,
      AuditFinding.ai_detected == False
  ).count()
  ai_vs_manual_findings_data = [
      {"label": "AI Detected", "value": ai_detected_findings_count, "color": "#003366"},
      {"label": "Manual", "value": manual_findings_count, "color": "#F59E0B"}
  ]

  avg_time_to_resolve_findings_result = db.query(
      func.avg(func.extract('day', AuditFinding.resolved_at - AuditFinding.created_at))
  ).filter(
      AuditFinding.audit_id.in_(db.query(Audit.id).filter(Audit.company_id == company_id)),
      AuditFinding.resolved_at.isnot(None),
      AuditFinding.created_at.isnot(None)
  ).scalar()
  avg_time_to_resolve_findings = round(avg_time_to_resolve_findings_result, 2) if avg_time_to_resolve_findings_result else 0

  top_assignees_open_actions = db.query(
      User.f_name, User.l_name, func.count(ActionItem.id).label("open_actions_count")
  ).join(ActionItem, User.id == ActionItem.assigned_to).join(AuditFinding).join(Audit).filter(
      Audit.company_id == company_id,
      ActionItem.status != ActionItemStatus.completed
  ).group_by(User.f_name, User.l_name).order_by(func.count(ActionItem.id).desc()).limit(5).all()
  top_assignees_open_actions_data = [{"assignee": f"{u.f_name} {u.l_name}", "count": c} for u, c in top_assignees_open_actions]


  findings_remediation = {
      "findings_by_severity": findings_by_severity_data,
      "findings_by_status": findings_by_status_data,
      "action_item_status_breakdown": action_item_status_breakdown_data,
      "findings_trend_new": findings_trend_new_data,
      "findings_trend_resolved": findings_trend_resolved_data,
      "top_overdue_action_items": top_overdue_action_items_data,
      "findings_by_type": findings_by_type_data,
      "ai_vs_manual_findings": ai_vs_manual_findings_data,
      "avg_time_to_resolve_findings": avg_time_to_resolve_findings,
      "top_assignees_open_actions": top_assignees_open_actions_data
  }

  # V. Meetings & Communication
  upcoming_meetings = db.query(
      AuditMeeting.title,
      AuditMeeting.meeting_type,
      AuditMeeting.scheduled_time,
      AuditMeeting.id.label("meeting_id"),
      Audit.name.label("audit_name"),
      Audit.id.label("audit_id")
  ).join(
      Audit, AuditMeeting.audit_id == Audit.id
  ).filter(
      Audit.company_id == company_id,
      AuditMeeting.scheduled_time > datetime.utcnow(),
      AuditMeeting.status == MeetingStatus.scheduled
  ).order_by(AuditMeeting.scheduled_time).limit(5).all()

  upcoming_meetings_data = [{
      "title": m.title, 
      "meeting_type": m.meeting_type.value, 
      "scheduled_time": m.scheduled_time.isoformat(), 
      "meeting_id": m.meeting_id, 
      "audit_name": m.audit_name, 
      "audit_id": m.audit_id
  } for m in upcoming_meetings]

  meeting_status_distribution = db.query(
      AuditMeeting.status, 
      func.count(AuditMeeting.id)
  ).join(Audit, AuditMeeting.audit_id == Audit.id).filter(
      Audit.company_id == company_id
  ).group_by(AuditMeeting.status).all()
  meeting_status_distribution_data = [{"status": s.value, "count": c} for s, c in meeting_status_distribution]

  avg_meeting_duration_result = db.query(func.avg(AuditMeeting.duration_minutes)) \
      .join(Audit, AuditMeeting.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AuditMeeting.status == MeetingStatus.completed,
          AuditMeeting.duration_minutes.isnot(None)
      ).scalar()
  avg_meeting_duration = round(avg_meeting_duration_result, 2) if avg_meeting_duration_result else 0

  meetings_with_action_items_count = db.query(AuditMeeting) \
      .join(Audit, AuditMeeting.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AuditMeeting.action_items_count > 0,
          AuditMeeting.status == MeetingStatus.completed
      ).count()
  total_completed_meetings = db.query(AuditMeeting) \
      .join(Audit, AuditMeeting.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AuditMeeting.status == MeetingStatus.completed
      ).count()
  meetings_with_action_items_percentage = (
      meetings_with_action_items_count / total_completed_meetings * 100
  ) if total_completed_meetings > 0 else 0

  total_attendees_expected = db.query(func.count(MeetingAttendee.id)) \
      .join(AuditMeeting, MeetingAttendee.meeting_id == AuditMeeting.id) \
      .join(Audit, AuditMeeting.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AuditMeeting.status == MeetingStatus.completed,
          MeetingAttendee.is_required == True
      ).scalar()
  total_attendees_attended = db.query(func.count(MeetingAttendee.id)) \
      .join(AuditMeeting, MeetingAttendee.meeting_id == AuditMeeting.id) \
      .join(Audit, AuditMeeting.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AuditMeeting.status == MeetingStatus.completed,
          MeetingAttendee.attended == True
      ).scalar()
  meeting_attendance_rate = (
      total_attendees_attended / total_attendees_expected * 100
  ) if total_attendees_expected and total_attendees_expected > 0 else 0

  unread_messages_count = db.query(Message).join(Conversation).join(Audit).filter(
      Audit.company_id == company_id,
      Message.sender_id != current_user.id,
      Message.is_read == False,
      Message.conversation_id.in_(
          db.query(conversation_participants.c.conversation_id).filter(conversation_participants.c.user_id == current_user.id)
      )
  ).count()

  meetings_communication = {
      "upcoming_meetings": upcoming_meetings_data,
      "meeting_status_distribution": meeting_status_distribution_data,
      "avg_meeting_duration": avg_meeting_duration,
      "meetings_with_action_items_percentage": round(meetings_with_action_items_percentage, 2),
      "meeting_attendance_rate": round(meeting_attendance_rate, 2),
      "unread_messages_count": unread_messages_count
  }

  # VI. Compliance & Risk Radar
  compliance_checkpoints_status = db.query(ComplianceCheckpoint.status, func.count(ComplianceCheckpoint.id)).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(ComplianceCheckpoint.status).all()
  compliance_checkpoints_status_data = [{"status": s.value, "count": c} for s, c in compliance_checkpoints_status]

  avg_ai_risk_score_audits_result = db.query(func.avg(Audit.ai_risk_score)).filter(
      Audit.company_id == company_id,
      Audit.ai_risk_score.isnot(None)
  ).scalar()
  avg_ai_risk_score_audits = round(avg_ai_risk_score_audits_result, 2) if avg_ai_risk_score_audits_result else 0

  escalated_requirements_count = db.query(RequirementEscalation).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      RequirementEscalation.resolved == False
  ).count()

  risk_assessment_overview = db.query(RiskAssessment.risk_level, func.count(RiskAssessment.id)).join(Audit).filter(
      Audit.company_id == company_id,
      Audit.status.in_([AuditStatus.planned, AuditStatus.in_progress])
  ).group_by(RiskAssessment.risk_level).all()
  risk_assessment_overview_data = [{"risk_level": r, "count": c} for r, c in risk_assessment_overview]

  compliance_checkpoint_score_distribution = db.query(
      case(
          (ComplianceCheckpoint.score >= 90, '90-100'),
          (ComplianceCheckpoint.score >= 70, '70-89'),
          (ComplianceCheckpoint.score >= 50, '50-69'),
          else_='<50'
      ).label('score_range'),
      func.count(ComplianceCheckpoint.id)
  ).join(Audit).filter(
      Audit.company_id == company_id,
      ComplianceCheckpoint.score.isnot(None)
  ).group_by('score_range').order_by('score_range').all()
  checkpoint_score_distribution_data = [{"range": r, "count": c} for r, c in compliance_checkpoint_score_distribution]

  escalation_type_distribution = db.query(RequirementEscalation.escalation_type, func.count(RequirementEscalation.id)).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      RequirementEscalation.escalation_type.isnot(None)
  ).group_by(RequirementEscalation.escalation_type).all()
  escalation_type_distribution_data = [{"type": t.value, "count": c} for t, c in escalation_type_distribution]

  ai_risk_level_distribution = db.query(AIRiskAssessment.risk_level, func.count(AIRiskAssessment.id)).join(Audit).filter(
      Audit.company_id == company_id,
      AIRiskAssessment.risk_level.isnot(None)
  ).group_by(AIRiskAssessment.risk_level).all()
  ai_risk_level_distribution_data = [{"risk_level": r.value, "count": c} for r, c in ai_risk_level_distribution]

  compliance_risk_insights = {
      "compliance_checkpoints_status": compliance_checkpoints_status_data,
      "avg_ai_risk_score_audits": avg_ai_risk_score_audits,
      "escalated_requirements_count": escalated_requirements_count,
      "risk_assessment_overview": risk_assessment_overview_data,
      "compliance_checkpoint_score_distribution": checkpoint_score_distribution_data,
      "escalation_type_distribution": escalation_type_distribution_data,
      "ai_risk_level_distribution": ai_risk_level_distribution_data
  }

  # VII. AI & Automation Insights
  avg_ai_score_result = db.query(func.avg(AIDocumentValidation.validation_score)) \
      .join(DocumentSubmission, AIDocumentValidation.submission_id == DocumentSubmission.id) \
      .join(DocumentRequirement, DocumentSubmission.requirement_id == DocumentRequirement.id) \
      .join(Audit, DocumentRequirement.audit_id == Audit.id) \
      .filter(Audit.company_id == company_id) \
      .scalar()
  avg_ai_score = round(avg_ai_score_result, 2) if avg_ai_score_result else 0

  issues_flagged_count = db.query(func.count(AIDocumentValidation.id)) \
      .join(DocumentSubmission, AIDocumentValidation.submission_id == DocumentSubmission.id) \
      .join(DocumentRequirement, DocumentSubmission.requirement_id == DocumentRequirement.id) \
      .join(Audit, DocumentRequirement.audit_id == Audit.id) \
      .filter(
          Audit.company_id == company_id,
          AIDocumentValidation.issues_found.isnot(None),
          func.jsonb_array_length(AIDocumentValidation.issues_found) > 0
      ) \
      .scalar()
  ai_validation_overview = {
      "avg_score": avg_ai_score,
      "issues_flagged_count": issues_flagged_count or 0
  }

  total_workflow_steps = db.query(DocumentSubmissionWorkflow).join(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmissionWorkflow.automated == True
  ).count()
  completed_automated_steps = db.query(DocumentSubmissionWorkflow).join(DocumentSubmission).join(DocumentRequirement).join(Audit).filter(
      Audit.company_id == company_id,
      DocumentSubmissionWorkflow.automated == True,
      DocumentSubmissionWorkflow.status == "completed"
  ).count()
  automated_workflow_completion_rate = (completed_automated_steps / total_workflow_steps * 100) if total_workflow_steps > 0 else 0

  ai_risk_focus_areas_raw = db.query(AIRiskAssessment.suggested_focus_areas).join(Audit).filter(
      Audit.company_id == company_id,
      AIRiskAssessment.suggested_focus_areas.isnot(None)
  ).all()
  focus_area_counts = {}
  for areas_json in ai_risk_focus_areas_raw:
      areas = areas_json[0]
      if isinstance(areas, list):
          for area in areas:
              focus_area_counts[area] = focus_area_counts.get(area, 0) + 1
  ai_risk_focus_areas_data = [{"area": a, "count": c} for a, c in focus_area_counts.items()]

  ai_automation_insights = {
      "ai_validation_overview": ai_validation_overview,
      "ai_vs_manual_findings": ai_vs_manual_findings_data,
      "automated_workflow_completion_rate": round(automated_workflow_completion_rate, 2),
      "ai_risk_focus_areas": ai_risk_focus_areas_data
  }

  # VIII. Historical Performance & Reporting
  audit_report_status_distribution = db.query(AuditReport.status, func.count(AuditReport.id)).join(Audit).filter(
      Audit.company_id == company_id
  ).group_by(AuditReport.status).all()
  report_status_distribution_data = [{"status": s.value, "count": c} for s, c in audit_report_status_distribution]

  peer_reviewed_audits_count = db.query(Audit).filter(
      Audit.company_id == company_id,
      Audit.peer_reviewed == True
  ).count()
  total_completed_audits_for_peer_review = db.query(Audit).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed,
      Audit.peer_reviewed.isnot(None)
  ).count()
  peer_review_rate = (peer_reviewed_audits_count / total_completed_audits_for_peer_review * 100) if total_completed_audits_for_peer_review > 0 else 0

  avg_findings_per_audit_trend = db.query(
      func.to_char(Audit.end_date, 'YYYY-MM').label('month'),
      func.count(AuditFinding.id).label('total_findings'),
      func.count(distinct(Audit.id)).label('total_audits')
  ).join(AuditFinding, Audit.id == AuditFinding.audit_id).filter(
      Audit.company_id == company_id,
      Audit.status == AuditStatus.completed,
      Audit.end_date >= twelve_months_ago
  ).group_by(func.to_char(Audit.end_date, 'YYYY-MM')).order_by(func.to_char(Audit.end_date, 'YYYY-MM')).all()

  audit_performance_trends_data = []
  for month, total_findings, total_audits in avg_findings_per_audit_trend:
      avg_findings = (total_findings / total_audits) if total_audits > 0 else 0
      audit_performance_trends_data.append({"month": month, "avg_findings": round(avg_findings, 2)})

  lessons_learned_count = db.query(AuditHistoricalData).join(Audit).filter(
      Audit.company_id == company_id,
      AuditHistoricalData.lessons_learned.isnot(None)
  ).count()


  historical_reporting = {
      "report_status_distribution": report_status_distribution_data,
      "peer_review_rate": round(peer_review_rate, 2),
      "audit_performance_trends": audit_performance_trends_data,
      "lessons_learned_count": lessons_learned_count
  }


  return {
      "kpis": kpis,
      "audit_portfolio_analysis": audit_portfolio_analysis,
      "document_management": document_management,
      "findings_remediation": findings_remediation,
      "meetings_communication": meetings_communication,
      "compliance_risk_insights": compliance_risk_insights,
      "ai_automation_insights": ai_automation_insights,
      "historical_reporting": historical_reporting
  }

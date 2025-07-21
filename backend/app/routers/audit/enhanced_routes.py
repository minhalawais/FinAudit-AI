"""
Enhanced audit features with AI and advanced workflows - FIXED
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import json # Import json for handling AI outputs

from app.database import get_db
from app.routers.auth import get_current_user
from app.models import * # Import all models
from .models import FinancialAuditCreate
from .services import AuditValidationService, AIEnhancementService, calculate_complexity_score, estimate_audit_hours, generate_ai_risk_assessment, invite_auditor_with_credentials, schedule_kickoff_meeting

enhanced_router = APIRouter(prefix="/api/audits", tags=["audit-enhanced"])

@enhanced_router.get("/notifications")
async def get_audit_notifications(
  unread_only: bool = Query(False),
  limit: int = Query(50),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Get audit notifications for current user"""
  
  # Mock notifications since AuditNotification table might not exist
  notifications = [
      {
          "id": 1,
          "title": "Document Submitted",
          "message": "New document has been submitted for review",
          "notification_type": "document_submission",
          "priority": "medium",
          "data": {},
          "read": False,
          "created_at": datetime.utcnow().isoformat(),
          "expires_at": None
      },
      {
          "id": 2,
          "title": "Audit Deadline Approaching",
          "message": "Audit deadline is in 3 days",
          "notification_type": "deadline_warning",
          "priority": "high",
          "data": {},
          "read": False,
          "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat(),
          "expires_at": None
      }
  ]
  
  if unread_only:
      notifications = [n for n in notifications if not n["read"]]
  
  return {
      "notifications": notifications[:limit]
  }

@enhanced_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
  notification_id: int,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Mark notification as read"""
  
  # Mock response since we don't have the notification table
  return {"message": "Notification marked as read"}

@enhanced_router.post("/validate")
async def validate_audit_data(
  audit_data: FinancialAuditCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Validate audit creation data with business rules"""
  
  validator = AuditValidationService(db)
  validation_result = validator.validate_audit_creation(audit_data)
  
  # Check auditor availability
  availability_checks = validator.check_auditor_availability(
      audit_data.auditor_emails,
      audit_data.start_date,
      audit_data.end_date
  )
  
  return {
      "validation": validation_result,
      "auditor_availability": availability_checks
  }

@enhanced_router.get("/templates/all")
async def get_audit_templates(
  industry_type: Optional[str] = Query(None),
  compliance_framework: Optional[str] = Query(None),
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Get available audit templates"""
  
  # Mock templates since AuditTemplate table might not exist
  templates = [
      {
          "id": 1,
          "name": "SOX Compliance Audit",
          "description": "Standard SOX compliance audit template",
          "industry_type": "financial_services",
          "compliance_frameworks": ["SOX"],
          "audit_methodology": "risk_based",
          "template_data": {"default_scope": "Review of internal controls over financial reporting as per SOX requirements."}
      },
      {
          "id": 2,
          "name": "GAAP Financial Audit",
          "description": "GAAP compliance financial audit template",
          "industry_type": "manufacturing",
          "compliance_frameworks": ["GAAP"],
          "audit_methodology": "substantive",
          "template_data": {"default_scope": "Comprehensive audit of financial statements in accordance with GAAP."}
      }
  ]
  
  # Filter templates based on query parameters
  if industry_type:
      templates = [t for t in templates if t["industry_type"] == industry_type]
  if compliance_framework:
      templates = [t for t in templates if compliance_framework in t["compliance_frameworks"]]

  return {"templates": templates}

@enhanced_router.post("/recommendations/auditors/enhanced")
async def get_auditor_recommendations(
  audit_data: FinancialAuditCreate,  # Changed to use request body
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Get intelligent auditor recommendations"""
  
  # Get available auditors
  available_auditors = db.query(User).filter(
      User.role == UserRole.auditor,
      User.is_active == True,
      User.availability_status == "available"
  ).all()
  
  ai_service = AIEnhancementService(db)
  recommendations = await ai_service.match_auditors_intelligently(audit_data, available_auditors)
  
  return {"recommendations": recommendations}

@enhanced_router.post("/create-enhanced")
async def create_enhanced_financial_audit(
  audit_data: FinancialAuditCreate,
  db: Session = Depends(get_db),
  current_user: User = Depends(get_current_user)
):
  """Create enhanced financial audit with all improvements and AI features"""
  
  # Step 1: Validate audit data
  validator = AuditValidationService(db)
  validation_result = validator.validate_audit_creation(audit_data)
  
  if isinstance(validation_result, dict):
      if not validation_result.get('is_valid', False):
          raise HTTPException(status_code=400, detail={
              "message": "Validation failed",
              "errors": validation_result.get('errors', []),
              "warnings": validation_result.get('warnings', [])
          })
  else:
      if not validation_result.is_valid:
          raise HTTPException(status_code=400, detail={
              "message": "Validation failed",
              "errors": validation_result.errors,
              "warnings": validation_result.warnings
          })
  requires_approval = (
      audit_data.materiality_threshold > 100000 or
      (audit_data.estimated_budget and audit_data.estimated_budget > 500000)
  )
  # Initialize AI service
  ai_service = AIEnhancementService(db)
  
  try:
      # Step 3: Generate AI-powered audit summary (Grok AI)
      ai_audit_summary = await ai_service.generate_audit_summary(audit_data)
  except Exception as e:
      print(f"Error generating audit summary: {e}")
      ai_audit_summary = f"Audit of {audit_data.name} focusing on {audit_data.financial_audit_type} within the scope of {audit_data.scope}."

  try:
      # Step 4: Get historical insights (existing)
      historical_insights = await ai_service.get_historical_insights(audit_data)
  except Exception as e:
      print(f"Error getting historical insights: {e}")
      historical_insights = {"message": "No historical insights available"}
  
  try:
      # Step 5: Generate AI risk assessment (Gemini AI)
      ai_assessment = await generate_ai_risk_assessment(
          audit_data.financial_audit_type,
          audit_data.scope,
          audit_data.materiality_threshold,
          db
      )
  except Exception as e:
      print(f"Error generating AI risk assessment: {e}")
      ai_assessment = {
          "risk_categories": [
              {
                  "category": "General Risk",
                  "level": "medium",
                  "confidence": 0.7,
                  "description": "General audit risk",
                  "reasoning": "Standard risk profile",
                  "focus_areas": ["General controls"]
              }
          ],
          "overall_risk_score": 5.0,
          "confidence": 0.7,
          "key_recommendations": ["Conduct standard audit procedures"],
          "historical_insights": "Standard audit approach recommended"
      }
  
  # Step 6: Calculate complexity and budget estimation (existing)
  complexity_score = calculate_complexity_score(audit_data, ai_assessment)
  estimated_hours = estimate_audit_hours(complexity_score, audit_data)
  
  if not audit_data.estimated_budget:
      audit_data.estimated_budget = estimated_hours * 150  # $150/hour average
  
  # Step 7: Create the audit record
  audit = Audit(
      name=audit_data.name,
      description=audit_data.description, # Keep original description, AI summary will be in suggestions
      audit_type=AuditType.financial,
      financial_audit_type=FinancialAuditType(audit_data.financial_audit_type),
      scope=audit_data.scope,
      start_date=audit_data.start_date,
      end_date=audit_data.end_date,
      deadline=audit_data.deadline,
      materiality_threshold=audit_data.materiality_threshold,
      estimated_budget=audit_data.estimated_budget,
      budget_lower_bound=audit_data.estimated_budget * 0.8,
      budget_upper_bound=audit_data.estimated_budget * 1.2,
      audit_methodology=AuditMethodology(audit_data.audit_methodology),
      compliance_frameworks=audit_data.compliance_frameworks,
      industry_type=IndustryType(audit_data.industry_type) if audit_data.industry_type else None,
      template_id=audit_data.template_id,
      estimated_hours=estimated_hours,
      complexity_score=complexity_score,
      requires_approval=requires_approval,
      approval_status=AuditApprovalStatus.pending if requires_approval else AuditApprovalStatus.approved,
      company_id=current_user.company_id,
      created_by=current_user.id,
      status=AuditStatus.planned,
      ai_risk_score=ai_assessment["overall_risk_score"],
      ai_suggestions={
          "generated_summary": ai_audit_summary, # Store Grok summary here
          "risk_assessment_details": ai_assessment, # Store full Gemini risk assessment
          "key_recommendations": ai_assessment.get("key_recommendations", []),
          "priority_areas": [rc["category"] for rc in ai_assessment.get("risk_categories", []) if rc["level"] in ["high", "critical"]]
      },
      ai_confidence_score=ai_assessment.get("confidence", 0.8),
      ai_model_version="gemini-1.5-flash_grok-1", # Indicate both models used
      historical_data_used=historical_insights
  )
  
  db.add(audit)
  db.flush() # Flush to get audit.id for related records

  # Store detailed AI Risk Assessment in AIRiskAssessment table
  for risk_cat in ai_assessment.get("risk_categories", []):
      ai_risk_entry = AIRiskAssessment(
          audit_id=audit.id,
          risk_category=risk_cat.get("category"),
          risk_level=AIRiskLevel(risk_cat.get("level")),
          confidence_score=risk_cat.get("confidence"),
          description=risk_cat.get("description"),
          ai_reasoning=risk_cat.get("reasoning"),
          suggested_focus_areas=risk_cat.get("focus_areas")
      )
      db.add(ai_risk_entry)
  
  # Step 8: Generate intelligent document requirements (Gemini AI)
  intelligent_requirements = await ai_service.generate_intelligent_requirements(audit_data, ai_assessment)
  for req_data in intelligent_requirements:
      requirement = DocumentRequirement(
          audit_id=audit.id,
          document_type=req_data["document_type"],
          required_fields=req_data.get("validation_rules", {}).get("required_fields", {}), # Map to required_fields
          validation_rules=req_data.get("validation_rules", {}),
          deadline=audit_data.start_date + timedelta(days=req_data.get("deadline_offset_days", 14)),
          is_mandatory=req_data.get("priority") == "high",
          auto_escalate=True,
          created_by=current_user.id,
          ai_priority_score=req_data.get("ai_priority_score", 5.0),
          risk_level=req_data.get("risk_level", "medium"),
          compliance_framework=req_data.get("compliance_framework", "SOX") # Use AI framework or default
      )
      db.add(requirement)

  # Step 9: Generate initial audit findings (Grok AI)
  initial_findings = await ai_service.suggest_initial_findings(audit_data, ai_assessment)
  for finding_data in initial_findings:
    try:
        severity = FindingSeverity(finding_data.get("severity", "minor").lower().replace(" ", "_"))

    except ValueError:
        severity = FindingSeverity.minor  # default value if invalid
    print('Finding Severity:', severity)
    finding = AuditFinding(
        audit_id=audit.id,
        title=finding_data["title"],
        description=finding_data["description"],
        severity=severity,
        recommendation=finding_data["recommendation"],
        estimated_impact=finding_data.get("estimated_impact"),
        likelihood=finding_data.get("likelihood"),
        risk_score=finding_data.get("risk_score"),
        created_by=current_user.id, # Or a system user ID
        ai_detected=True,
        ai_confidence_score=finding_data.get("ai_confidence_score"),
        ai_risk_score=finding_data.get("ai_risk_score"),
        ai_recommendations=finding_data.get("ai_recommendations"),
        finding_type=finding_data.get("finding_type", "compliance") # Changed from FindingType(...) to direct string
        # Other fields like document_id, meeting_id, assigned_to etc. are not generated by AI here
    )
    db.add(finding)

  # Step 10: Generate initial compliance checkpoints (Grok AI)
  initial_checkpoints = await ai_service.suggest_compliance_checkpoints(audit_data, ai_assessment)
  for cp_data in initial_checkpoints:
      checkpoint = ComplianceCheckpoint(
          audit_id=audit.id,
          # requirement_id is optional, can be linked later if specific document requirements are generated for it
          checkpoint_type=cp_data["checkpoint_type"],
          status=ComplianceStatus(cp_data["status"]), # Ensure enum conversion
          score=cp_data["score"],
          details=cp_data["details"],
          checked_at=datetime.utcnow(),
          next_check_at=datetime.utcnow() + timedelta(days=cp_data.get("next_check_at_offset_days", 30))
      )
      db.add(checkpoint)

  # Step 11: Handle auditor assignments with availability check (existing)
  # This part uses auditor_emails from audit_data, which are manually provided.
  # The AI recommendations are generated in step 4 (Smart Auditor Matching) in the frontend,
  # but the backend assignment logic remains based on provided emails.
  availability_checks = validator.check_auditor_availability(
      audit_data.auditor_emails,
      audit_data.start_date,
      audit_data.end_date
  )
  
  assigned_auditors = []
  for email in audit_data.auditor_emails:
      auditor = db.query(User).filter(User.email == email).first()
      if not auditor:
          # If user doesn't exist, create invitation and user record
          try:
              invitation = await invite_auditor_with_credentials(
                  audit_id=audit.id,
                  email=email,
                  invited_by=current_user.id,
                  db=db
              )
              assigned_auditors.append({
                  "email": email,
                  "status": "invited",
                  "invitation_id": invitation.id
              })
              continue
          except Exception as e:
              print(f"Error inviting auditor {email}: {e}")
              continue
      
      # Check if auditor is available
      availability = next((a for a in availability_checks if a.get("auditor_id") == auditor.id), None)
      if availability and availability.get("is_available"):
          stmt = audit_auditor_assignment.insert().values(
              audit_id=audit.id,
              auditor_id=auditor.id,
              assigned_by=current_user.id,
              role="auditor",
              assigned_at=datetime.utcnow()
          )
          db.execute(stmt)
          assigned_auditors.append({
              "email": email,
              "status": "assigned",
              "auditor_id": auditor.id
          })
      else:
          # Auditor exists but not available - send notification
          try:
              invitation = await invite_auditor_with_credentials(
                  audit_id=audit.id,
                  email=email,
                  invited_by=current_user.id,
                  db=db
              )
              assigned_auditors.append({
                  "email": email,
                  "status": "conflict_invited",
                  "invitation_id": invitation.id,
                  "conflicts": availability.get("conflicts", []) if availability else []
              })
          except Exception as e:
              print(f"Error inviting auditor {email} due to conflict: {e}")
              continue
  
  # Step 12: Auto-schedule kickoff meeting (only if approved or doesn't require approval) (existing)
  if not requires_approval:
      kickoff_meeting = await schedule_kickoff_meeting(audit.id, current_user.id, db)
      audit.kickoff_meeting_id = kickoff_meeting.id
      audit.auto_scheduled_kickoff = True
  
  db.commit()
  
  return {
      "audit_id": audit.id,
      "validation_result": validation_result,
      "ai_assessment": ai_assessment,
      "historical_insights": historical_insights,
      "requires_approval": requires_approval,
      "assigned_auditors": assigned_auditors,
      "complexity_score": complexity_score,
      "estimated_hours": estimated_hours,
      "kickoff_meeting_scheduled": not requires_approval,
      "message": "Enhanced financial audit created successfully" + 
                (" - pending approval" if requires_approval else "")
  }

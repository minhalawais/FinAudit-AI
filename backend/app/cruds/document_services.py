from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import hashlib
import json
import asyncio
from app.models import *
from app.database import get_db
import google.generativeai as genai

class EnhancedDocumentService:
    def __init__(self, db: Session):
        self.db = db
        genai.configure(api_key="AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE")
    
    async def generate_intelligent_requirements(
        self, 
        audit_id: int, 
        financial_audit_type: str, 
        industry_type: str,
        compliance_frameworks: List[str],
        materiality_threshold: float
    ) -> List[Dict]:
        """Generate AI-powered document requirements"""
        
        # Get templates for this audit type
        templates = self.db.query(DocumentRequirementTemplate).filter(
            DocumentRequirementTemplate.financial_audit_type == financial_audit_type
        ).all()
        
        # AI Enhancement
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Generate intelligent document requirements for:
        - Audit Type: {financial_audit_type}
        - Industry: {industry_type}
        - Compliance: {compliance_frameworks}
        - Materiality: ${materiality_threshold:,.2f}
        
        For each requirement, provide:
        - document_type: specific name
        - ai_priority_score: 1-10 based on risk
        - risk_level: low/medium/high/critical
        - deadline_days: days from audit start
        - validation_rules: specific criteria
        - required_fields: mandatory data points
        - compliance_impact: regulatory importance
        
        Format as JSON array.
        """
        
        try:
            response = model.generate_content(prompt)
            ai_requirements = json.loads(response.text)
        except:
            ai_requirements = []
        
        # Combine templates with AI suggestions
        requirements = []
        
        for template in templates:
            req_data = {
                "document_type": template.document_type,
                "ai_priority_score": template.ai_priority_score,
                "risk_level": "medium",
                "deadline_days": 14,
                "validation_rules": template.validation_rules or {},
                "required_fields": template.required_fields or {},
                "is_mandatory": template.is_mandatory,
                "auto_escalate": template.auto_escalate,
                "escalation_threshold_hours": template.escalation_threshold_hours
            }
            requirements.append(req_data)
        
        # Add AI-generated requirements
        for ai_req in ai_requirements:
            if not any(r["document_type"] == ai_req.get("document_type") for r in requirements):
                requirements.append(ai_req)
        
        return requirements
    
    async def create_enhanced_requirements(
        self, 
        audit_id: int, 
        requirements_data: List[Dict],
        created_by: int
    ):
        """Create document requirements with enhanced features"""
        
        audit = self.db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise ValueError("Audit not found")
        
        for req_data in requirements_data:
            # Calculate deadline
            deadline = audit.start_date + timedelta(days=req_data.get("deadline_days", 14))
            
            requirement = DocumentRequirement(
                audit_id=audit_id,
                document_type=req_data["document_type"],
                required_fields=req_data.get("required_fields", {}),
                validation_rules=req_data.get("validation_rules", {}),
                deadline=deadline,
                is_mandatory=req_data.get("is_mandatory", True),
                auto_escalate=req_data.get("auto_escalate", True),
                ai_priority_score=req_data.get("ai_priority_score", 5.0),
                risk_level=req_data.get("risk_level", "medium"),
                compliance_framework=req_data.get("compliance_framework"),
                created_by=created_by
            )
            
            self.db.add(requirement)
        
        self.db.commit()
    
    async def submit_document_enhanced(
        self,
        requirement_id: int,
        document_id: int,
        submitted_by: int,
        ip_address: str = None,
        user_agent: str = None
    ) -> Dict:
        """Enhanced document submission with workflow tracking"""
        
        requirement = self.db.query(DocumentRequirement).filter(
            DocumentRequirement.id == requirement_id
        ).first()
        
        if not requirement:
            raise ValueError("Requirement not found")
        
        document = self.db.query(Document).filter(Document.id == document_id).first()
        if not document:
            raise ValueError("Document not found")
        
        # Create submission
        submission = DocumentSubmission(
            requirement_id=requirement_id,
            document_id=document_id,
            submitted_by=submitted_by,
            verification_status=EvidenceStatus.pending,
            workflow_stage=WorkflowStage.submitted,
            priority_level="high" if requirement.ai_priority_score >= 8 else "normal"
        )
        
        self.db.add(submission)
        self.db.flush()
        
        # Create audit trail entry
        await self.create_audit_trail_entry(
            submission.id,
            "document_submitted",
            submitted_by,
            ActorType.user,
            {
                "document_type": requirement.document_type,
                "file_name": document.title,
                "file_size": document.file_size
            },
            ip_address,
            user_agent
        )
        
        # Create workflow entry
        workflow_entry = DocumentSubmissionWorkflow(
            submission_id=submission.id,
            stage=WorkflowStage.submitted,
            status="completed",
            performer_id=submitted_by,
            performer_type=ActorType.user,
            notes="Document submitted successfully",
            automated=False
        )
        
        self.db.add(workflow_entry)
        
        # Trigger AI validation
        await self.trigger_ai_validation(submission.id)
        
        # Send notifications
        await self.send_submission_notifications(submission.id)
        
        self.db.commit()
        
        return {
            "submission_id": submission.id,
            "status": "submitted",
            "next_stage": "ai_validation",
            "estimated_review_time": "2-4 hours"
        }
    
    async def trigger_ai_validation(self, submission_id: int):
        """Trigger AI validation for submitted document"""
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.document),
            joinedload(DocumentSubmission.requirement)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission:
            return
        
        # Update workflow stage
        submission.workflow_stage = WorkflowStage.ai_validating
        
        # Create workflow entry
        workflow_entry = DocumentSubmissionWorkflow(
            submission_id=submission_id,
            stage=WorkflowStage.ai_validating,
            status="in_progress",
            performer_type=ActorType.ai,
            notes="AI validation in progress",
            automated=True
        )
        
        self.db.add(workflow_entry)
        self.db.commit()
        
        # Perform AI validation (async)
        asyncio.create_task(self.perform_ai_validation(submission_id))
    
    async def perform_ai_validation(self, submission_id: int):
        """Perform AI validation on submitted document"""
        
        start_time = datetime.utcnow()
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.document),
            joinedload(DocumentSubmission.requirement)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission:
            return
        
        try:
            # AI validation logic
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            validation_prompt = f"""
            Validate this document submission:
            - Document Type: {submission.requirement.document_type}
            - Required Fields: {submission.requirement.required_fields}
            - Validation Rules: {submission.requirement.validation_rules}
            - File Type: {submission.document.file_type}
            - File Size: {submission.document.file_size}
            
            Provide validation results as JSON:
            {{
                "validation_score": 0-10,
                "confidence_score": 0-1,
                "issues_found": ["issue1", "issue2"],
                "recommendations": ["rec1", "rec2"],
                "compliance_score": 0-10,
                "overall_status": "pass|fail|warning"
            }}
            """
            
            response = model.generate_content(validation_prompt)
            validation_results = json.loads(response.text)
            
            # Calculate processing time
            processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
            
            # Store AI validation results
            ai_validation = AIDocumentValidation(
                submission_id=submission_id,
                ai_model_version="gemini-1.5-flash",
                validation_type="comprehensive",
                validation_score=validation_results.get("validation_score", 5.0),
                confidence_score=validation_results.get("confidence_score", 0.8),
                validation_results=validation_results,
                issues_found=validation_results.get("issues_found", []),
                recommendations=validation_results.get("recommendations", []),
                processing_time_ms=int(processing_time)
            )
            
            self.db.add(ai_validation)
            
            # Update submission
            submission.ai_validation_score = validation_results.get("validation_score", 5.0)
            submission.ai_validation_notes = f"AI Validation completed. Score: {validation_results.get('validation_score', 5.0)}/10"
            submission.compliance_score = validation_results.get("compliance_score", 5.0)
            
            # Determine next stage
            if validation_results.get("overall_status") == "pass" and validation_results.get("validation_score", 0) >= 7:
                submission.workflow_stage = WorkflowStage.ai_validated
                next_status = "passed"
            else:
                submission.workflow_stage = WorkflowStage.under_review
                next_status = "needs_human_review"
            
            # Create workflow entry
            workflow_entry = DocumentSubmissionWorkflow(
                submission_id=submission_id,
                stage=submission.workflow_stage,
                status=next_status,
                performer_type=ActorType.ai,
                notes=f"AI validation completed. Score: {validation_results.get('validation_score', 5.0)}/10",
                validation_score=validation_results.get("validation_score", 5.0),
                confidence_score=validation_results.get("confidence_score", 0.8),
                stage_duration_minutes=int(processing_time / 60000),
                automated=True
            )
            
            self.db.add(workflow_entry)
            
            # Create audit trail
            await self.create_audit_trail_entry(
                submission_id,
                "ai_validation_completed",
                None,
                ActorType.ai,
                validation_results
            )
            
            # Send notifications if issues found
            if validation_results.get("issues_found"):
                await self.send_validation_notifications(submission_id, validation_results)
            
            self.db.commit()
            
        except Exception as e:
            # Handle validation error
            submission.workflow_stage = WorkflowStage.under_review
            submission.ai_validation_notes = f"AI validation failed: {str(e)}"
            
            workflow_entry = DocumentSubmissionWorkflow(
                submission_id=submission_id,
                stage=WorkflowStage.under_review,
                status="ai_validation_failed",
                performer_type=ActorType.ai,
                notes=f"AI validation failed: {str(e)}",
                automated=True
            )
            
            self.db.add(workflow_entry)
            self.db.commit()
    
    async def verify_document_enhanced(
        self,
        submission_id: int,
        verified_by: int,
        status: EvidenceStatus,
        notes: str,
        quality_score: float = None
    ) -> Dict:
        """Enhanced document verification with immutable records"""
        
        submission = self.db.query(DocumentSubmission).filter(
            DocumentSubmission.id == submission_id
        ).first()
        
        if not submission:
            raise ValueError("Submission not found")
        
        # Create verification record
        verification = DocumentVerification(
            submission_id=submission_id,
            verified_by=verified_by,
            status=status,
            notes=notes,
            is_immutable=True
        )
        
        self.db.add(verification)
        self.db.flush()
        
        # Create immutable verification chain entry
        verification_data = {
            "submission_id": submission_id,
            "verified_by": verified_by,
            "status": status.value,
            "notes": notes,
            "quality_score": quality_score,
            "timestamp": datetime.utcnow().isoformat(),
            "ai_validation_score": submission.ai_validation_score
        }
        
        # Get previous hash for chain
        previous_chain = self.db.query(DocumentVerificationChain).filter(
            DocumentVerificationChain.submission_id == submission_id
        ).order_by(DocumentVerificationChain.block_number.desc()).first()
        
        previous_hash = previous_chain.current_hash if previous_chain else "genesis"
        
        # Calculate current hash
        data_string = json.dumps(verification_data, sort_keys=True)
        current_hash = hashlib.sha256(f"{previous_hash}{data_string}".encode()).hexdigest()
        
        # Create chain entry
        chain_entry = DocumentVerificationChain(
            submission_id=submission_id,
            verification_id=verification.id,
            previous_hash=previous_hash,
            current_hash=current_hash,
            verification_data=verification_data,
            block_number=(previous_chain.block_number + 1) if previous_chain else 1,
            is_immutable=True
        )
        
        self.db.add(chain_entry)
        
        # Update submission
        submission.verification_status = status
        submission.reviewed_at = datetime.utcnow()
        submission.reviewed_by = verified_by
        
        if status == EvidenceStatus.approved:
            submission.workflow_stage = WorkflowStage.approved
        elif status == EvidenceStatus.rejected:
            submission.workflow_stage = WorkflowStage.rejected
        else:
            submission.workflow_stage = WorkflowStage.needs_revision
        
        # Create workflow entry
        workflow_entry = DocumentSubmissionWorkflow(
            submission_id=submission_id,
            stage=submission.workflow_stage,
            status=status.value,
            performer_id=verified_by,
            performer_type=ActorType.user,
            notes=notes,
            validation_score=quality_score,
            automated=False
        )
        
        self.db.add(workflow_entry)
        
        # Create audit trail
        await self.create_audit_trail_entry(
            submission_id,
            f"document_{status.value}",
            verified_by,
            ActorType.user,
            {
                "status": status.value,
                "notes": notes,
                "quality_score": quality_score,
                "verification_hash": current_hash
            }
        )
        
        # Send notifications
        await self.send_verification_notifications(submission_id, status)
        
        self.db.commit()
        
        return {
            "verification_id": verification.id,
            "status": status.value,
            "hash": current_hash,
            "block_number": chain_entry.block_number,
            "immutable": True
        }
    
    async def create_audit_trail_entry(
        self,
        submission_id: int,
        action: str,
        actor_id: int = None,
        actor_type: ActorType = ActorType.system,
        details: Dict = None,
        ip_address: str = None,
        user_agent: str = None,
        session_id: str = None
    ):
        """Create comprehensive audit trail entry"""
        
        # Generate hash chain
        previous_trail = self.db.query(DocumentAuditTrail).filter(
            DocumentAuditTrail.submission_id == submission_id
        ).order_by(DocumentAuditTrail.timestamp.desc()).first()
        
        trail_data = {
            "submission_id": submission_id,
            "action": action,
            "actor_id": actor_id,
            "actor_type": actor_type.value,
            "details": details or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        previous_hash = previous_trail.hash_chain if previous_trail else "genesis"
        current_hash = hashlib.sha256(f"{previous_hash}{json.dumps(trail_data, sort_keys=True)}".encode()).hexdigest()
        
        trail_entry = DocumentAuditTrail(
            submission_id=submission_id,
            action=action,
            actor_id=actor_id,
            actor_type=actor_type,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            hash_chain=current_hash
        )
        
        self.db.add(trail_entry)
    
    async def check_escalations(self):
        """Check for requirements that need escalation"""
        
        # Find overdue requirements
        overdue_requirements = self.db.query(DocumentRequirement).filter(
            DocumentRequirement.deadline < datetime.utcnow(),
            DocumentRequirement.auto_escalate == True,
            DocumentRequirement.escalation_level < 3  # Max 3 escalation levels
        ).all()
        
        for requirement in overdue_requirements:
            await self.escalate_requirement(requirement.id, EscalationType.overdue)
        
        # Find high-priority pending submissions
        high_priority_submissions = self.db.query(DocumentSubmission).join(
            DocumentRequirement
        ).filter(
            DocumentRequirement.ai_priority_score >= 8,
            DocumentSubmission.workflow_stage == WorkflowStage.under_review,
            DocumentSubmission.submitted_at < datetime.utcnow() - timedelta(hours=24)
        ).all()
        
        for submission in high_priority_submissions:
            await self.escalate_requirement(submission.requirement_id, EscalationType.high_priority)
    
    async def escalate_requirement(self, requirement_id: int, escalation_type: EscalationType):
        """Escalate a requirement to higher authority"""
        
        requirement = self.db.query(DocumentRequirement).filter(
            DocumentRequirement.id == requirement_id
        ).first()
        
        if not requirement:
            return
        
        # Find escalation target (manager or admin)
        audit = self.db.query(Audit).filter(Audit.id == requirement.audit_id).first()
        escalation_targets = self.db.query(User).filter(
            User.company_id == audit.company_id,
            User.role.in_([UserRole.admin, UserRole.manager])
        ).all()
        
        for target in escalation_targets:
            escalation = RequirementEscalation(
                requirement_id=requirement_id,
                escalation_level=requirement.escalation_level + 1,
                escalated_to_id=target.id,
                escalated_by_id=None,  # System escalation
                escalation_reason=f"Automatic escalation: {escalation_type.value}",
                escalation_type=escalation_type
            )
            
            self.db.add(escalation)
            
            # Send notification
            notification = AuditNotification(
                user_id=target.id,
                audit_id=audit.id,
                notification_type="escalation",
                title=f"Requirement Escalated: {requirement.document_type}",
                message=f"Document requirement has been escalated due to: {escalation_type.value}",
                priority=NotificationPriority.high,
                data={
                    "requirement_id": requirement_id,
                    "escalation_type": escalation_type.value,
                    "escalation_level": requirement.escalation_level + 1
                }
            )
            
            self.db.add(notification)
        
        # Update requirement
        requirement.escalation_level += 1
        requirement.last_escalated_at = datetime.utcnow()
        
        self.db.commit()
    
    async def send_submission_notifications(self, submission_id: int):
        """Send notifications for new document submission"""
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.requirement),
            joinedload(DocumentSubmission.submitter)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission:
            return
        
        # Find auditors assigned to this audit
        audit_id = submission.requirement.audit_id
        auditors = self.db.execute(
            text("""
                SELECT u.id, u.email, u.f_name, u.l_name
                FROM users u
                JOIN audit_auditor_assignments aaa ON u.id = aaa.auditor_id
                WHERE aaa.audit_id = :audit_id AND aaa.is_active = true
            """),
            {"audit_id": audit_id}
        ).fetchall()
        
        for auditor in auditors:
            notification = AuditNotification(
                user_id=auditor.id,
                audit_id=audit_id,
                notification_type="document_submitted",
                title=f"New Document Submitted: {submission.requirement.document_type}",
                message=f"Document submitted by {submission.submitter.f_name} {submission.submitter.l_name}",
                priority=NotificationPriority.high if submission.priority_level == "high" else NotificationPriority.normal,
                data={
                    "submission_id": submission_id,
                    "document_type": submission.requirement.document_type,
                    "submitter": f"{submission.submitter.f_name} {submission.submitter.l_name}"
                }
            )
            
            self.db.add(notification)
        
        self.db.commit()
    
    async def send_validation_notifications(self, submission_id: int, validation_results: Dict):
        """Send notifications for AI validation results"""
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.submitter)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission or not validation_results.get("issues_found"):
            return
        
        notification = AuditNotification(
            user_id=submission.submitted_by,
            audit_id=submission.requirement.audit_id,
            notification_type="validation_issues",
            title="Document Validation Issues Found",
            message=f"AI validation found {len(validation_results['issues_found'])} issues with your submission",
            priority=NotificationPriority.normal,
            data={
                "submission_id": submission_id,
                "issues": validation_results["issues_found"],
                "recommendations": validation_results.get("recommendations", [])
            }
        )
        
        self.db.add(notification)
        self.db.commit()
    
    async def send_verification_notifications(self, submission_id: int, status: EvidenceStatus):
        """Send notifications for document verification"""
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.submitter)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission:
            return
        
        priority = NotificationPriority.high if status == EvidenceStatus.rejected else NotificationPriority.normal
        
        notification = AuditNotification(
            user_id=submission.submitted_by,
            audit_id=submission.requirement.audit_id,
            notification_type="document_verified",
            title=f"Document {status.value.title()}",
            message=f"Your document submission has been {status.value}",
            priority=priority,
            data={
                "submission_id": submission_id,
                "status": status.value
            }
        )
        
        self.db.add(notification)
        self.db.commit()
    
    def get_submission_history(self, submission_id: int) -> Dict:
        """Get complete submission history with audit trail"""
        
        submission = self.db.query(DocumentSubmission).options(
            joinedload(DocumentSubmission.document),
            joinedload(DocumentSubmission.requirement),
            joinedload(DocumentSubmission.submitter)
        ).filter(DocumentSubmission.id == submission_id).first()
        
        if not submission:
            return {}
        
        # Get workflow history
        workflow_history = self.db.query(DocumentSubmissionWorkflow).options(
            joinedload(DocumentSubmissionWorkflow.performer)
        ).filter(
            DocumentSubmissionWorkflow.submission_id == submission_id
        ).order_by(DocumentSubmissionWorkflow.created_at.asc()).all()
        
        # Get audit trail
        audit_trail = self.db.query(DocumentAuditTrail).options(
            joinedload(DocumentAuditTrail.actor)
        ).filter(
            DocumentAuditTrail.submission_id == submission_id
        ).order_by(DocumentAuditTrail.timestamp.asc()).all()
        
        # Get verification chain
        verification_chain = self.db.query(DocumentVerificationChain).filter(
            DocumentVerificationChain.submission_id == submission_id
        ).order_by(DocumentVerificationChain.block_number.asc()).all()
        
        # Get AI validations
        ai_validations = self.db.query(AIDocumentValidation).filter(
            AIDocumentValidation.submission_id == submission_id
        ).order_by(AIDocumentValidation.created_at.asc()).all()
        
        return {
            "submission": {
                "id": submission.id,
                "document_type": submission.requirement.document_type,
                "status": submission.verification_status.value,
                "workflow_stage": submission.workflow_stage.value,
                "submitted_at": submission.submitted_at.isoformat(),
                "submitter": f"{submission.submitter.f_name} {submission.submitter.l_name}",
                "ai_validation_score": submission.ai_validation_score,
                "compliance_score": submission.compliance_score
            },
            "workflow_history": [
                {
                    "stage": wf.stage.value,
                    "status": wf.status,
                    "performer": f"{wf.performer.f_name} {wf.performer.l_name}" if wf.performer else "System",
                    "performer_type": wf.performer_type.value,
                    "notes": wf.notes,
                    "validation_score": wf.validation_score,
                    "duration_minutes": wf.stage_duration_minutes,
                    "automated": wf.automated,
                    "created_at": wf.created_at.isoformat()
                }
                for wf in workflow_history
            ],
            "audit_trail": [
                {
                    "action": trail.action,
                    "actor": f"{trail.actor.f_name} {trail.actor.l_name}" if trail.actor else "System",
                    "actor_type": trail.actor_type.value,
                    "details": trail.details,
                    "timestamp": trail.timestamp.isoformat(),
                    "hash": trail.hash_chain
                }
                for trail in audit_trail
            ],
            "verification_chain": [
                {
                    "block_number": vc.block_number,
                    "current_hash": vc.current_hash,
                    "previous_hash": vc.previous_hash,
                    "verification_data": vc.verification_data,
                    "timestamp": vc.timestamp.isoformat(),
                    "immutable": vc.is_immutable
                }
                for vc in verification_chain
            ],
            "ai_validations": [
                {
                    "validation_type": ai.validation_type,
                    "validation_score": ai.validation_score,
                    "confidence_score": ai.confidence_score,
                    "issues_found": ai.issues_found,
                    "recommendations": ai.recommendations,
                    "processing_time_ms": ai.processing_time_ms,
                    "created_at": ai.created_at.isoformat()
                }
                for ai in ai_validations
            ]
        }

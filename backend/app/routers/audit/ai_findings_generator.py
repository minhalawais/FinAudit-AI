"""
AI-powered audit finding generation service using Groq API
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from groq import Groq
from sqlalchemy.orm import Session

from app.models import *
from app.tasks import parse_content_with_genai

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

class AIFindingGenerator:
    def __init__(self, db: Session):
        self.db = db
        logger.info("AIFindingGenerator initialized with database session")
        
    async def generate_findings_from_document(
        self, 
        document_id: int, 
        audit_id: int, 
        document_submission_id: int,
        current_user: User
    ) -> List[Dict[str, Any]]:
        """
        Generate audit findings from a document using AI analysis
        """
        logger.info(f"Starting finding generation for document {document_id}, audit {audit_id}, submission {document_submission_id}")
        
        if not groq_client:
            logger.error("Groq API key not configured")
            return []
            
        try:
            # Get document and its content
            document = self.db.query(Document).filter(Document.id == document_id).first()
            if not document:
                logger.warning(f"Document {document_id} not found")
                return []
            
            logger.info(f"Retrieved document: {document.title} (ID: {document.id})")
            
            # Get audit context
            audit = self.db.query(Audit).filter(Audit.id == audit_id).first()
            if not audit:
                logger.warning(f"Audit {audit_id} not found")
                return []
            
            logger.info(f"Retrieved audit: {audit.name} (ID: {audit.id})")
            
            # Get document requirement context
            doc_submission = self.db.query(DocumentSubmission).filter(
                DocumentSubmission.id == document_submission_id
            ).first()
            
            requirement_context = ""
            if doc_submission and doc_submission.requirement:
                requirement_context = f"Document Type: {doc_submission.requirement.document_type}\n"
                requirement_context += f"Compliance Framework: {doc_submission.requirement.compliance_framework}\n"
                logger.info(f"Retrieved requirement context: {requirement_context.strip()}")
            
            # Parse document content if not already parsed
            document_content = ""
            if document.content:
                logger.info("Document has existing content, attempting to parse")
                try:
                    content_data = json.loads(document.content) if isinstance(document.content, str) else document.content
                    document_content = str(content_data)
                    logger.info("Successfully parsed document content")
                except Exception as e:
                    document_content = str(document.content)
                    logger.warning(f"Failed to parse document content as JSON, using string representation: {str(e)}")
            elif document.raw_content:
                logger.info("Using raw document content")
                document_content = document.raw_content
            else:
                logger.info("No parsed content found, attempting to parse document")
                try:
                    from app.tasks import process_pdf, process_excel, process_csv, process_image
                    
                    if document.file_type.lower() == 'pdf':
                        logger.info(f"Processing PDF document: {document.file_path}")
                        process_pdf(document.file_path, document.id)
                    elif document.file_type.lower() in ['xlsx', 'xls']:
                        logger.info(f"Processing Excel document: {document.file_path}")
                        process_excel(document.file_path, document.id)
                    elif document.file_type.lower() == 'csv':
                        logger.info(f"Processing CSV document: {document.file_path}")
                        process_csv(document.file_path, document.id)
                    elif document.file_type.lower() in ['png', 'jpg', 'jpeg']:
                        logger.info(f"Processing image document: {document.file_path}")
                        process_image(document.file_path, document.id)
                    else:
                        logger.warning(f"Unsupported file type: {document.file_type}")
                    
                    # Refresh document to get parsed content
                    self.db.refresh(document)
                    document_content = document.raw_content or str(document.content) if document.content else ""
                    logger.info(f"Document processed, content length: {len(document_content)} characters")
                except Exception as e:
                    logger.error(f"Error parsing document: {str(e)}")
                    document_content = f"Document: {document.title} (Content parsing failed)"
            
            if not document_content or len(document_content.strip()) < 50:
                logger.warning(f"Insufficient content for finding generation: {len(document_content)} chars")
                return []
            
            logger.info(f"Document content prepared, length: {len(document_content)} characters")
            
            # Generate findings using Groq
            findings = await self._generate_findings_with_groq(
                document_content=document_content,
                audit_context=audit,
                requirement_context=requirement_context,
                document_title=document.title,
                document_type=document.file_type
            )
            
            logger.info(f"Received {len(findings)} potential findings from Groq API")
            
            # Create findings in database
            created_findings = []
            for finding_data in findings:
                try:
                    created_finding = await self._create_ai_finding(
                        finding_data=finding_data,
                        audit_id=audit_id,
                        document_submission_id=document_submission_id,
                        current_user=current_user
                    )
                    if created_finding:
                        created_findings.append(created_finding)
                        logger.info(f"Created finding: {created_finding['title']} (ID: {created_finding['id']})")
                except Exception as e:
                    logger.error(f"Error creating finding: {str(e)}")
                    continue
            
            logger.info(f"Successfully created {len(created_findings)} findings in database")
            return created_findings
            
        except Exception as e:
            logger.error(f"Error in generate_findings_from_document: {str(e)}", exc_info=True)
            return []
    
    async def _generate_findings_with_groq(
        self,
        document_content: str,
        audit_context: Audit,
        requirement_context: str,
        document_title: str,
        document_type: str
    ) -> List[Dict[str, Any]]:
        """
        Use Groq API to generate audit findings from document content
        """
        logger.info("Starting Groq API finding generation")
        
        try:
            # Format materiality threshold safely
            materiality_threshold = "$0"
            if audit_context.materiality_threshold is not None:
                try:
                    materiality_threshold = f"${audit_context.materiality_threshold:,.2f}"
                except (TypeError, ValueError) as e:
                    logger.warning(f"Error formatting materiality threshold: {str(e)}")
                    materiality_threshold = "$0"
            
            logger.info(f"Formatted materiality threshold: {materiality_threshold}")

            # Create a focused prompt for audit finding generation
            prompt = f"""
            You are a senior financial auditor analyzing a document for potential audit findings. 
            
            AUDIT CONTEXT:
            - Audit Name: {audit_context.name}
            - Audit Type: {audit_context.financial_audit_type.value if audit_context.financial_audit_type else 'general'}
            - Industry: {audit_context.industry_type.value if audit_context.industry_type else 'general'}
            - Materiality Threshold: {materiality_threshold}
            - Compliance Frameworks: {', '.join(audit_context.compliance_frameworks) if audit_context.compliance_frameworks else 'General'}
            
            DOCUMENT CONTEXT:
            {requirement_context}
            - Document Title: {document_title}
            - Document Type: {document_type}
            
            DOCUMENT CONTENT:
            {document_content[:4000]}  # Limit content to avoid token limits
            
            INSTRUCTIONS:
            Analyze this document and identify 1-3 potential audit findings. Focus ONLY on:
            1. Compliance violations or gaps
            2. Control deficiencies 
            3. Financial misstatements or irregularities
            4. Documentation issues that could impact audit conclusions
            5. Process inefficiencies that create audit risk
            
            Be STRICT and CONSERVATIVE - only identify findings that are:
            - Clearly evident in the document
            - Relevant to the audit type and compliance frameworks
            - Material or significant enough to warrant attention
            - Specific and actionable
            
            Return a JSON array with 1-3 findings maximum. Each finding must have:
            {{
                "title": "Specific, clear title (max 100 chars)",
                "description": "Detailed description of what was found and why it's concerning (max 500 chars)",
                "finding_type": "compliance|control_deficiency|documentation_issue|process_inefficiency|risk_exposure|financial_misstatement",
                "severity": "critical|major|minor|informational",
                "confidence_score": 0.0-1.0,
                "evidence_reference": "Specific reference to document section/page/line",
                "impact_assessment": "Brief impact description (max 200 chars)",
                "recommendation": "Specific actionable recommendation (max 300 chars)"
            }}
            
            If no significant findings are identified, return an empty array [].
            
            IMPORTANT: Return ONLY the JSON array, no other text or formatting.
            """
            
            logger.info("Constructed prompt for Groq API")
            
            messages = [
                {
                    "role": "system",
                    "content": "You are a senior financial auditor with expertise in identifying audit findings. You are conservative and only identify material, well-supported findings."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
            
            logger.info("Sending request to Groq API")
            response = groq_client.chat.completions.create(
                messages=messages,
                model="llama-3.3-70b-versatile",
                temperature=0.1,  # Low temperature for consistency
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            response_content = response.choices[0].message.content
            logger.info(f"Received response from Groq API: {response_content}")
            
            # Parse the response
            try:
                findings_data = json.loads(response_content)
                logger.info("Successfully parsed Groq response as JSON")
                
                # Handle different response formats
                if isinstance(findings_data, dict):
                    if "findings" in findings_data:
                        findings_list = findings_data["findings"]
                        logger.info("Found findings in 'findings' key")
                    elif "audit_findings" in findings_data:
                        findings_list = findings_data["audit_findings"]
                        logger.info("Found findings in 'audit_findings' key")
                    else:
                        # Assume the dict itself is a single finding
                        findings_list = [findings_data]
                        logger.info("Assuming entire response is a single finding")
                else:
                    findings_list = findings_data
                    logger.info("Response is already a list of findings")
                
                # Validate and clean findings
                validated_findings = []
                for finding in findings_list[:3]:  # Max 3 findings
                    if self._validate_finding(finding):
                        validated_findings.append(finding)
                        logger.info(f"Validated finding: {finding.get('title', 'Untitled')}")
                    else:
                        logger.warning(f"Invalid finding discarded: {finding}")
                
                logger.info(f"Generated {len(validated_findings)} validated findings")
                return validated_findings
                
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse Groq response as JSON: {str(e)}")
                return []
                
        except Exception as e:
            logger.error(f"Error calling Groq API: {str(e)}", exc_info=True)
            return []
    
    def _validate_finding(self, finding: Dict[str, Any]) -> bool:
        """
        Validate that a finding has all required fields and reasonable values
        """
        logger.debug(f"Validating finding: {finding.get('title', 'Untitled')}")
        
        required_fields = ["title", "description", "finding_type", "severity"]
        
        # Check required fields
        for field in required_fields:
            if field not in finding or not finding[field]:
                logger.warning(f"Missing required field: {field}")
                return False
        
        # Validate severity
        valid_severities = ["critical", "major", "minor", "informational"]
        if finding["severity"] not in valid_severities:
            logger.warning(f"Invalid severity: {finding['severity']}")
            return False
        
        # Validate finding_type
        valid_types = [
            "compliance", "control_deficiency", "documentation_issue", 
            "process_inefficiency", "risk_exposure", "financial_misstatement"
        ]
        if finding["finding_type"] not in valid_types:
            logger.warning(f"Invalid finding_type: {finding['finding_type']}")
            return False
        
        # Check content length
        if len(finding["title"]) > 200 or len(finding["description"]) > 1000:
            logger.warning("Finding content too long")
            return False
        
        # Set defaults for optional fields
        finding.setdefault("confidence_score", 0.7)
        finding.setdefault("evidence_reference", "Document analysis")
        finding.setdefault("impact_assessment", "Requires review and assessment")
        finding.setdefault("recommendation", "Review and address identified issue")
        
        logger.debug("Finding validation passed")
        return True
    
    async def _create_ai_finding(
        self,
        finding_data: Dict[str, Any],
        audit_id: int,
        document_submission_id: int,
        current_user: User
    ) -> Optional[Dict[str, Any]]:
        """
        Create an AI-generated finding in the database
        """
        logger.info(f"Creating AI finding in database: {finding_data.get('title')}")
        
        try:
            # Generate unique finding ID
            finding_count = self.db.query(AuditFinding).filter(AuditFinding.audit_id == audit_id).count()
            finding_id = f"AI-{audit_id}-{finding_count + 1:03d}"
            logger.debug(f"Generated finding ID: {finding_id}")
            
            # Map severity to enum
            severity_mapping = {
                "critical": FindingSeverity.critical,
                "major": FindingSeverity.major,
                "minor": FindingSeverity.minor,
                "informational": FindingSeverity.informational
            }
            
            # Create the finding
            new_finding = AuditFinding(
                audit_id=audit_id,
                finding_id=finding_id,
                title=finding_data["title"],
                description=finding_data["description"],
                finding_type=finding_data["finding_type"],
                severity=severity_mapping[finding_data["severity"]],
                status=FindingStatus.open,
                document_submission_id=document_submission_id,
                finding_source="ai_detected",
                ai_detected=True,
                ai_confidence_score=finding_data.get("confidence_score", 0.7),
                ai_risk_score=self._calculate_risk_score(finding_data),
                ai_recommendations=[finding_data.get("recommendation", "Review and address")],
                priority_level=self._map_severity_to_priority(finding_data["severity"]),
                impact_assessment=finding_data.get("impact_assessment", ""),
                evidence={"evidence_reference": finding_data.get("evidence_reference", "")},
                created_by=current_user.id,
                created_at=datetime.utcnow()
            )
            
            self.db.add(new_finding)
            self.db.flush()
            logger.debug("Finding added to database session")
            
            # Create workflow entry
            workflow_entry = AuditFindingWorkflow(
                finding_id=new_finding.id,
                from_status=None,
                to_status="open",
                changed_by=current_user.id,
                change_reason="AI-generated finding from document analysis",
                workflow_data={
                    "source": "ai_detected",
                    "confidence_score": finding_data.get("confidence_score", 0.7),
                    "document_submission_id": document_submission_id,
                    "ai_model": "groq-llama-3.3-70b"
                }
            )
            
            self.db.add(workflow_entry)
            self.db.commit()
            self.db.refresh(new_finding)
            logger.info(f"Successfully committed finding ID {new_finding.id} to database")
            
            return {
                "id": new_finding.id,
                "finding_id": new_finding.finding_id,
                "title": new_finding.title,
                "severity": new_finding.severity.value,
                "confidence_score": new_finding.ai_confidence_score,
                "created_at": new_finding.created_at.isoformat()
            }
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating AI finding: {str(e)}", exc_info=True)
            return None
    
    def _calculate_risk_score(self, finding_data: Dict[str, Any]) -> float:
        """
        Calculate risk score based on severity and confidence
        """
        severity_scores = {
            "critical": 10.0,
            "major": 7.5,
            "minor": 5.0,
            "informational": 2.5
        }
        
        base_score = severity_scores.get(finding_data["severity"], 5.0)
        confidence = finding_data.get("confidence_score", 0.7)
        risk_score = round(base_score * confidence, 1)
        
        logger.debug(f"Calculated risk score: {risk_score} (severity: {finding_data['severity']}, confidence: {confidence})")
        return risk_score
    
    def _map_severity_to_priority(self, severity: str) -> str:
        """
        Map severity to priority level
        """
        mapping = {
            "critical": "high",
            "major": "high", 
            "minor": "medium",
            "informational": "low"
        }
        priority = mapping.get(severity, "medium")
        logger.debug(f"Mapped severity {severity} to priority {priority}")
        return priority
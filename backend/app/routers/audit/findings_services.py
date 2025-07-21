from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, and_, or_, func
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import json
import uuid
import os
from io import BytesIO
import PyPDF2
import requests

from app.models import AuditFinding, AuditMeeting, FindingComment, Document, User, Audit, FindingStatus, FindingSeverity, MeetingStatus, MeetingType, ActionItem

class AIAnalyzer:
    def __init__(self):
        # It's better to get API keys from environment variables for security
        self.gemini_api_key = "AIzaSyC9kRGz-cMVvEIXPpfsySl_eZt3OzgVpgE"
        self.deepseek_api_key = os.getenv('DEEPSEEK_API_KEY')
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        
        # Basic validation for Gemini API key, as it's used in the methods
        if not self.gemini_api_key:
            print("Warning: GEMINI_API_KEY environment variable not set. AI analysis may fail.")

    def _call_gemini_api(self, prompt: str, temperature: float = 0.1, max_output_tokens: int = 2048) -> str:
        """Internal helper to call the Gemini API and extract text content."""
        if not self.gemini_api_key:
            raise ValueError("Gemini API key is not configured.")

        headers = {
            'Authorization': f'Bearer {self.gemini_api_key}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'contents': [{
                'parts': [{'text': prompt}]
            }],
            'generationConfig': {
                'temperature': temperature,
                'topK': 1, # Keeping these as per previous implementation
                'topP': 1, # Keeping these as per previous implementation
                'maxOutputTokens': max_output_tokens,
            }
        }
        
        try:
            response = requests.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
                headers=headers,
                json=payload
            )
            response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
            result = response.json()
            
            if 'candidates' in result and result['candidates']:
                content_parts = result['candidates'][0]['content']['parts']
                if content_parts and 'text' in content_parts[0]:
                    return content_parts[0]['text']
            return "" # Return empty string if no text content found
        except requests.exceptions.RequestException as e:
            print(f"Gemini API request failed in _call_gemini_api: {e}")
            raise ConnectionError(f"Failed to connect to Gemini API: {e}")
        except KeyError as e:
            print(f"Unexpected Gemini API response structure in _call_gemini_api: {e}, Response: {result}")
            raise ValueError(f"Invalid response from Gemini API: {e}")

    def analyze_document_with_gemini(self, content: str, document_type: str = "audit") -> List[Dict[str, Any]]:
        """Analyze document content using Gemini API to detect audit findings."""
        
        prompt = f"""
        You are an expert audit analyst. Analyze the following {document_type} document and identify potential audit findings.
        
        For each finding you identify, provide a JSON object with the following structure:
        {{
            "title": "Brief title of the finding",
            "description": "Detailed description of the issue",
            "type": "compliance|operational|financial|technical|governance",
            "severity": "critical|high|medium|low|info",
            "confidence": 0.0-1.0,
            "risk_score": 0.0-1.0,
            "recommendations": ["recommendation1", "recommendation2"],
            "page": page_number_if_available,
            "section": "section_name_if_available",
            "evidence": "specific text or data that supports this finding"
        }}
        
        Focus on:
        1. Compliance violations or gaps
        2. Internal control weaknesses
        3. Risk management issues
        4. Process inefficiencies
        5. Data quality problems
        6. Governance concerns
        7. Financial irregularities
        
        Document content:
        {content[:8000]} # Limit content to avoid token limits, adjust as needed for model
        
        Return only a JSON array of findings. If no findings are detected, return an empty array.
        """
        
        try:
            raw_content = self._call_gemini_api(prompt, temperature=0.1, max_output_tokens=2048)
            
            # Extract JSON from the response, handling markdown formatting
            if '\`\`\`json' in raw_content:
                json_str = raw_content.split('\`\`\`json')[1].split('\`\`\`')[0]
            elif '\`\`\`' in raw_content: # Fallback for non-json code blocks
                json_str = raw_content.split('\`\`\`')[1].split('\`\`\`')[0]
            else:
                json_str = raw_content # Assume it's just JSON if no markdown
            
            findings = json.loads(json_str.strip())
            return findings if isinstance(findings, list) else []
        except (ValueError, json.JSONDecodeError, ConnectionError) as e:
            print(f"Error during document analysis with Gemini: {e}")
            # Return a default or empty list on error
            return []
        except Exception as e:
            print(f"An unexpected error occurred during document analysis: {e}")
            return []
    
    def generate_meeting_summary(self, meeting_content: str) -> Dict[str, Any]:
        """Generate AI summary and action items from meeting content."""
        
        prompt = f"""
        Analyze the following meeting content and provide:
        1. A concise summary of key discussion points
        2. Action items with assignees (if mentioned)
        3. Audit findings discussed
        4. Decisions made
        5. Next steps
        
        Meeting content:
        {meeting_content[:8000]} # Limit content
        
        Return a JSON object with this structure:
        {{
            "summary": "Concise meeting summary",
            "key_points": ["point1", "point2"],
            "action_items": [
                {{
                    "description": "Action description",
                    "assignee": "person_name",
                    "due_date": "YYYY-MM-DD or null",
                    "priority": "high|medium|low"
                }}
            ],
            "findings_discussed": [
                {{
                    "finding_id": "finding_id_if_mentioned",
                    "discussion_summary": "what was discussed"
                }}
            ],
            "decisions": ["decision1", "decision2"],
            "next_steps": ["step1", "step2"]
        }}
        """
        
        try:
            raw_content = self._call_gemini_api(prompt, temperature=0.2, max_output_tokens=1024)
            
            if '\`\`\`json' in raw_content:
                json_str = raw_content.split('\`\`\`json')[1].split('\`\`\`')[0]
            else:
                json_str = raw_content
            
            summary_data = json.loads(json_str.strip())
            return summary_data
        except (ValueError, json.JSONDecodeError, ConnectionError) as e:
            print(f"Error generating meeting summary with Gemini: {e}")
            return {"summary": "Failed to generate summary due to AI error.", "action_items": [], "findings_discussed": []}
        except Exception as e:
            print(f"An unexpected error occurred during meeting summary generation: {e}")
            return {"summary": "Error generating summary", "action_items": [], "findings_discussed": []}
    
    def suggest_remediation(self, finding_description: str, finding_type: str) -> List[str]:
        """Generate remediation suggestions for a finding."""
        
        prompt = f"""
        As an audit expert, provide specific, actionable remediation recommendations for the following audit finding:
        
        Finding Type: {finding_type}
        Finding Description: {finding_description}
        
        Provide 3-5 specific, actionable recommendations that address:
        1. Immediate corrective actions
        2. Process improvements
        3. Control enhancements
        4. Monitoring mechanisms
        5. Training or awareness needs
        
        Return only a JSON array of recommendation strings.
        """
        
        try:
            raw_content = self._call_gemini_api(prompt, temperature=0.1, max_output_tokens=512) # Reduced max tokens for recommendations
            
            if '\`\`\`json' in raw_content:
                json_str = raw_content.split('\`\`\`json')[1].split('\`\`\`')[0]
            else:
                json_str = raw_content
            
            recommendations = json.loads(json_str.strip())
            return recommendations if isinstance(recommendations, list) else []
        except (ValueError, json.JSONDecodeError, ConnectionError) as e:
            print(f"Error generating remediation suggestions with Gemini: {e}")
            # Fallback recommendations on error
            return [
                "Review and update relevant policies and procedures",
                "Implement additional controls to prevent recurrence",
                "Provide training to relevant personnel"
            ]
        except Exception as e:
            print(f"An unexpected error occurred during remediation suggestion generation: {e}")
            return ["Review and update relevant policies and procedures"]
    
    def calculate_risk_score(self, finding_data: Dict[str, Any]) -> float:
        """Calculate risk score based on finding characteristics."""
        
        severity_weights = {
            'critical': 1.0,
            'high': 0.8,
            'medium': 0.6,
            'low': 0.4,
            'info': 0.2
        }
        
        type_weights = {
            'compliance': 0.9,
            'financial': 0.85,
            'operational': 0.7,
            'technical': 0.6,
            'governance': 0.75
        }
        
        base_score = severity_weights.get(finding_data.get('severity', 'medium'), 0.6)
        type_modifier = type_weights.get(finding_data.get('type', 'operational'), 0.7)
        
        # Additional factors
        confidence = finding_data.get('confidence', 0.5)
        
        # Calculate final risk score
        risk_score = (base_score * type_modifier * confidence)
        
        return min(max(risk_score, 0.0), 1.0)  # Ensure between 0 and 1

class FindingService:
    def __init__(self, db: Session):
        self.db = db
        self.ai_analyzer = AIAnalyzer()

    def get_dashboard_stats(self, current_user: User) -> Dict[str, Any]:
        """Get comprehensive findings dashboard data for the user's company."""
        try:
            # Verify company access (assuming current_user always has a company_id)
            if not current_user.company_id:
                raise ValueError("User is not associated with a company.")

            # Get findings statistics
            total_findings = self.db.query(AuditFinding).join(
                Audit, AuditFinding.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id
            ).count()
            
            open_findings = self.db.query(AuditFinding).join(
                Audit, AuditFinding.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id,
                AuditFinding.status == FindingStatus.open
            ).count()
            
            critical_findings = self.db.query(AuditFinding).join(
                Audit, AuditFinding.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id,
                AuditFinding.severity == FindingSeverity.critical,
                AuditFinding.status != FindingStatus.resolved
            ).count()
            
            ai_detected = self.db.query(AuditFinding).join(
                Audit, AuditFinding.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id,
                AuditFinding.ai_detected == True
            ).count()
            
            # Meeting statistics - explicitly specify the join condition
            upcoming_meetings = self.db.query(AuditMeeting).join(
                Audit, AuditMeeting.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id,
                AuditMeeting.scheduled_time > datetime.utcnow(),
                AuditMeeting.status == MeetingStatus.scheduled
            ).count()
            
            # Recent findings (last 5, regardless of audit_id, but within company)
            recent_findings = self.db.query(AuditFinding).join(
                Audit, AuditFinding.audit_id == Audit.id
            ).filter(
                Audit.company_id == current_user.company_id
            ).order_by(desc(AuditFinding.created_at)).limit(5).all()
            
            recent_findings_data = []
            for finding in recent_findings:
                recent_findings_data.append({
                    'id': finding.id,
                    'finding_id': finding.finding_id,
                    'title': finding.title,
                    'severity': finding.severity.value,
                    'status': finding.status.value,
                    'created_at': finding.created_at.isoformat()
                })
            
            return {
                'stats': {
                    'total_findings': total_findings,
                    'open_findings': open_findings,
                    'critical_findings': critical_findings,
                    'ai_detected_findings': ai_detected,
                    'upcoming_meetings': upcoming_meetings
                },
                'recent_findings': recent_findings_data
            }
        except Exception as e:
            print(f"Error in FindingService.get_dashboard_stats: {e}")
            raise

    def get_findings(
        self,
        current_user: User,
        page: int,
        per_page: int,
        status: Optional[str],
        severity: Optional[str],
        finding_type: Optional[str],
        assigned_to: Optional[str],
        search: Optional[str],
        audit_id: Optional[int]
    ) -> Dict[str, Any]:
        """Get all audit findings with filtering and pagination for the user's company."""
        try:
            query = self.db.query(AuditFinding).join(Audit).filter(
                Audit.company_id == current_user.company_id
            ).options(
                joinedload(AuditFinding.audit),
                joinedload(AuditFinding.creator),
                joinedload(AuditFinding.resolver)
            )
            
            if audit_id:
                query = query.filter(AuditFinding.audit_id == audit_id)
            
            if status and status != "all":
                query = query.filter(AuditFinding.status == FindingStatus(status))
            
            if severity and severity != "all":
                query = query.filter(AuditFinding.severity == FindingSeverity(severity))
            
            if finding_type and finding_type != "all":
                query = query.filter(AuditFinding.finding_type == finding_type)
            
            if assigned_to:
                query = query.filter(AuditFinding.assigned_to == assigned_to)
            
            if search:
                query = query.filter(or_(
                    AuditFinding.title.ilike(f'%{search}%'),
                    AuditFinding.description.ilike(f'%{search}%'),
                    AuditFinding.finding_id.ilike(f'%{search}%')
                ))
            
            total = query.count()
            findings = query.order_by(desc(AuditFinding.created_at)).offset((page - 1) * per_page).limit(per_page).all()
            
            findings_data = []
            for finding in findings:
                comments_count = self.db.query(FindingComment).filter(
                    FindingComment.finding_id == finding.id
                ).count()
                
                finding_dict = {
                    'id': finding.id,
                    'finding_id': finding.finding_id,
                    'title': finding.title,
                    'description': finding.description,
                    'finding_type': finding.finding_type or 'compliance',
                    'severity': finding.severity.value,
                    'status': finding.status.value,
                    'ai_detected': finding.ai_detected or False,
                    'ai_confidence_score': finding.ai_confidence_score or 0.0,
                    'ai_risk_score': finding.ai_risk_score or 0.0,
                    'ai_recommendations': finding.ai_recommendations or [],
                    'document_id': finding.document_id,
                    'document_page': finding.document_page,
                    'document_section': finding.document_section,
                    'meeting_id': finding.meeting_id,
                    'assigned_to': finding.assigned_to,
                    'assigned_date': finding.assigned_date.isoformat() if finding.assigned_date else None,
                    'due_date': finding.due_date.isoformat() if finding.due_date else None,
                    'resolved_date': finding.resolved_at.isoformat() if finding.resolved_at else None,
                    'evidence': finding.evidence or {},
                    'remediation_plan': finding.remediation_plan,
                    'remediation_status': finding.remediation_status,
                    'remediation_notes': finding.remediation_notes,
                    'created_by': f"{finding.creator.f_name} {finding.creator.l_name}" if finding.creator else "System",
                    'created_at': finding.created_at.isoformat(),
                    'updated_at': finding.created_at.isoformat(),
                    'audit': {
                        'id': finding.audit.id,
                        'name': finding.audit.name
                    } if finding.audit else None,
                    'comments_count': comments_count
                }
                findings_data.append(finding_dict)
            
            return {
                'findings': findings_data,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        except Exception as e:
            print(f"Error in FindingService.get_findings: {e}")
            raise

    def create_finding(self, finding_data: Dict[str, Any], current_user: User) -> Dict[str, Any]:
        """Create a new audit finding."""
        try:
            audit = self.db.query(Audit).filter(
                Audit.id == finding_data.get('audit_id'),
                Audit.company_id == current_user.company_id
            ).first()
            
            if not audit:
                raise ValueError("Audit not found or access denied.")
            
            finding_id = f"AF-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            finding = AuditFinding(
                finding_id=finding_id,
                audit_id=finding_data['audit_id'],
                title=finding_data['title'],
                description=finding_data['description'],
                finding_type=finding_data.get('finding_type', 'compliance'),
                severity=FindingSeverity(finding_data['severity']),
                status=FindingStatus(finding_data.get('status', 'open')),
                recommendation=finding_data.get('recommendation'),
                document_id=finding_data.get('document_id'),
                document_page=finding_data.get('document_page'),
                document_section=finding_data.get('document_section'),
                meeting_id=finding_data.get('meeting_id'),
                assigned_to=finding_data.get('assigned_to'),
                assigned_date=datetime.fromisoformat(finding_data['assigned_date']) if finding_data.get('assigned_date') else None,
                due_date=datetime.fromisoformat(finding_data['due_date']) if finding_data.get('due_date') else None,
                evidence=finding_data.get('evidence', {}),
                remediation_plan=finding_data.get('remediation_plan'),
                estimated_impact=finding_data.get('estimated_impact'),
                likelihood=finding_data.get('likelihood'),
                created_by=current_user.id
            )
            
            self.db.add(finding)
            self.db.commit()
            self.db.refresh(finding)
            
            return {
                'message': 'Finding created successfully',
                'finding_id': finding.finding_id,
                'id': finding.id
            }
        except Exception as e:
            self.db.rollback() # Rollback in case of error during commit
            print(f"Error in FindingService.create_finding: {e}")
            raise

    def update_finding(self, finding_id: int, finding_data: Dict[str, Any], current_user: User) -> Dict[str, Any]:
        """Update an existing audit finding."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            for field, value in finding_data.items():
                if hasattr(finding, field) and value is not None:
                    if field == "severity":
                        setattr(finding, field, FindingSeverity(value))
                    elif field == "status":
                        setattr(finding, field, FindingStatus(value))
                        if value == "resolved":
                            finding.resolved_date = datetime.utcnow()
                            finding.resolved_by = current_user.id
                    elif field == "finding_type":
                        setattr(finding, field, value) # finding_type is String, not Enum in current models
                    elif field in ["assigned_date", "due_date"] and isinstance(value, str):
                        setattr(finding, field, datetime.fromisoformat(value))
                    else:
                        setattr(finding, field, value)
            
            finding.updated_at = datetime.utcnow()
            self.db.commit()
            
            return {'message': 'Finding updated successfully'}
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.update_finding: {e}")
            raise

    def get_finding_details(self, finding_id: int, current_user: User) -> Dict[str, Any]:
        """Get detailed information about a specific finding."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).options(
                joinedload(AuditFinding.audit),
                joinedload(AuditFinding.creator),
                joinedload(AuditFinding.resolver)
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            comments = self.db.query(FindingComment).filter(
                FindingComment.finding_id == finding_id
            ).order_by(desc(FindingComment.created_at)).all()
            
            comments_data = []
            for comment in comments:
                comments_data.append({
                    'id': comment.id,
                    'comment': comment.comment,
                    'comment_type': comment.comment_type,
                    'created_by': comment.created_by,
                    'created_at': comment.created_at.isoformat()
                })
            
            document_info = None
            if finding.document_id:
                document = self.db.query(Document).filter(Document.id == finding.document_id).first()
                if document:
                    document_info = {
                        'id': document.id,
                        'title': document.title,
                        'file_type': document.file_type,
                        'file_size': document.file_size
                    }
            
            meeting_info = None
            if finding.meeting_id:
                meeting = self.db.query(AuditMeeting).filter(AuditMeeting.id == finding.meeting_id).first()
                if meeting:
                    meeting_info = {
                        'id': meeting.id,
                        'title': meeting.title,
                        'meeting_type': meeting.meeting_type.value,
                        'scheduled_time': meeting.scheduled_time.isoformat()
                    }
            
            finding_detail = {
                'id': finding.id,
                'finding_id': finding.finding_id,
                'title': finding.title,
                'description': finding.description,
                'finding_type': finding.finding_type or 'compliance',
                'severity': finding.severity.value,
                'status': finding.status.value,
                'recommendation': finding.recommendation,
                'ai_detected': finding.ai_detected or False,
                'ai_confidence_score': finding.ai_confidence_score or 0.0,
                'ai_risk_score': finding.ai_risk_score or 0.0,
                'ai_recommendations': finding.ai_recommendations or [],
                'document_id': finding.document_id,
                'document_page': finding.document_page,
                'document_section': finding.document_section,
                'document_info': document_info,
                'meeting_id': finding.meeting_id,
                'meeting_info': meeting_info,
                'assigned_to': finding.assigned_to,
                'assigned_date': finding.assigned_date.isoformat() if finding.assigned_date else None,
                'due_date': finding.due_date.isoformat() if finding.due_date else None,
                'resolved_date': finding.resolved_date.isoformat() if finding.resolved_date else None,
                'evidence': finding.evidence or {},
                'remediation_plan': finding.remediation_plan,
                'remediation_status': finding.remediation_status,
                'remediation_notes': finding.remediation_notes,
                'estimated_impact': finding.estimated_impact,
                'likelihood': finding.likelihood,
                'risk_score': finding.risk_score,
                'created_by': f"{finding.creator.f_name} {finding.creator.l_name}" if finding.creator else "System",
                'resolved_by': f"{finding.resolver.f_name} {finding.resolver.l_name}" if finding.resolver else None,
                'created_at': finding.created_at.isoformat(),
                'updated_at': finding.updated_at.isoformat(),
                'audit': {
                    'id': finding.audit.id,
                    'name': finding.audit.name
                },
                'comments': comments_data
            }
            
            return finding_detail
        except Exception as e:
            print(f"Error in FindingService.get_finding_details: {e}")
            raise

    def add_finding_comment(self, finding_id: int, comment_data: Dict[str, Any], current_user: User) -> Dict[str, Any]:
        """Add a comment to a finding."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            comment = FindingComment(
                finding_id=finding_id,
                comment=comment_data['comment'],
                comment_type=comment_data.get('comment_type', 'general'),
                created_by=f"{current_user.f_name} {current_user.l_name}"
            )
            
            self.db.add(comment)
            self.db.commit()
            
            return {'message': 'Comment added successfully', 'comment_id': comment.id}
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.add_finding_comment: {e}")
            raise

    def get_finding_comments(self, finding_id: int, current_user: User) -> Dict[str, Any]:
        """Get comments for a specific finding."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            comments = self.db.query(FindingComment).filter(
                FindingComment.finding_id == finding_id
            ).order_by(desc(FindingComment.created_at)).all()
            
            comments_data = []
            for comment in comments:
                comments_data.append({
                    'id': comment.id,
                    'comment': comment.comment,
                    'comment_type': comment.comment_type,
                    'created_by': comment.created_by,
                    'created_at': comment.created_at.isoformat()
                })
            
            return {'comments': comments_data}
        except Exception as e:
            print(f"Error in FindingService.get_finding_comments: {e}")
            raise

    def get_meetings(
        self,
        current_user: User,
        page: int,
        per_page: int,
        status: Optional[str],
        meeting_type: Optional[str],
        audit_id: Optional[int]
    ) -> Dict[str, Any]:
        """Get all audit meetings with filtering and pagination for the user's company."""
        try:
            query = self.db.query(AuditMeeting).join(
                Audit, AuditMeeting.audit_id == Audit.id  # Explicit join condition
            ).filter(
                Audit.company_id == current_user.company_id
            ).options(
                joinedload(AuditMeeting.audit),
                joinedload(AuditMeeting.creator)
            )
            
            if audit_id:
                query = query.filter(AuditMeeting.audit_id == audit_id)
            
            if status and status != "all":
                query = query.filter(AuditMeeting.status == MeetingStatus(status))
            
            if meeting_type and meeting_type != "all":
                query = query.filter(AuditMeeting.meeting_type == MeetingType(meeting_type))
            
            total = query.count()
            meetings = query.order_by(desc(AuditMeeting.scheduled_time)).offset((page - 1) * per_page).limit(per_page).all()
            
            meetings_data = []
            for meeting in meetings:
                meetings_data.append({
                    'id': meeting.id,
                    'meeting_id': meeting.meeting_id,
                    'title': meeting.title,
                    'description': meeting.description,
                    'meeting_type': meeting.meeting_type.value,
                    'scheduled_time': meeting.scheduled_time.isoformat(),
                    'end_time': meeting.end_time.isoformat() if meeting.end_time else None,
                    'duration_minutes': meeting.duration_minutes,
                    'location': meeting.location,
                    'meeting_url': meeting.meeting_url,
                    'status': meeting.status.value,
                    'organizer': meeting.organizer,
                    'participants': meeting.participants or [],
                    'agenda': meeting.agenda or [],
                    'minutes': meeting.minutes,
                    'action_items': meeting.action_items or [],
                    'ai_summary': meeting.ai_summary,
                    'created_by': f"{meeting.creator.f_name} {meeting.creator.l_name}" if meeting.creator else "System",
                    'created_at': meeting.created_at.isoformat(),
                    'audit': {
                        'id': meeting.audit.id,
                        'name': meeting.audit.name
                    } if meeting.audit else None
                })
            
            return {
                'meetings': meetings_data,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page
            }
        except Exception as e:
            print(f"Error in FindingService.get_meetings: {e}")
            raise

    def create_meeting(self, meeting_data: Dict[str, Any], current_user: User) -> Dict[str, Any]:
        """Create a new audit meeting."""
        try:
            audit = self.db.query(Audit).filter(
                Audit.id == meeting_data.get('audit_id'),
                Audit.company_id == current_user.company_id
            ).first()
            
            if not audit:
                raise ValueError("Audit not found or access denied.")
            
            meeting_id = f"AM-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
            
            meeting = AuditMeeting(
                meeting_id=meeting_id,
                audit_id=meeting_data['audit_id'],
                title=meeting_data['title'],
                description=meeting_data.get('description'),
                meeting_type=MeetingType(meeting_data.get('meeting_type', 'progress')),
                scheduled_time=datetime.fromisoformat(meeting_data['scheduled_time']),
                duration_minutes=meeting_data.get('duration_minutes', 60),
                location=meeting_data.get('location'),
                meeting_url=meeting_data.get('meeting_url'),
                organizer=meeting_data.get('organizer', f"{current_user.f_name} {current_user.l_name}"),
                participants=meeting_data.get('participants', []),
                agenda=meeting_data.get('agenda', []),
                created_by=current_user.id
            )
            
            self.db.add(meeting)
            self.db.commit()
            self.db.refresh(meeting)
            
            return {
                'message': 'Meeting created successfully',
                'meeting_id': meeting.meeting_id,
                'id': meeting.id
            }
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.create_meeting: {e}")
            raise

    def update_meeting(self, meeting_id: int, meeting_data: Dict[str, Any], current_user: User) -> Dict[str, Any]:
        """Update an existing meeting."""
        try:
            meeting = self.db.query(AuditMeeting).join(Audit).filter(
                AuditMeeting.id == meeting_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not meeting:
                raise ValueError("Meeting not found or access denied.")
            
            for field, value in meeting_data.items():
                if hasattr(meeting, field) and value is not None:
                    if field == 'meeting_type':
                        setattr(meeting, field, MeetingType(value))
                    elif field == 'status':
                        setattr(meeting, field, MeetingStatus(value))
                        if value == 'completed':
                            meeting.end_time = datetime.utcnow()
                    elif field == 'scheduled_time' and isinstance(value, str):
                        setattr(meeting, field, datetime.fromisoformat(value))
                    else:
                        setattr(meeting, field, value)
            
            self.db.commit()
            
            return {'message': 'Meeting updated successfully'}
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.update_meeting: {e}")
            raise

    def get_meeting_details(self, meeting_id: int, current_user: User) -> Dict[str, Any]:
        """Get detailed information about a specific meeting."""
        try:
            meeting = self.db.query(AuditMeeting).join(Audit).filter(
                AuditMeeting.id == meeting_id,
                Audit.company_id == current_user.company_id
            ).options(
                joinedload(AuditMeeting.audit),
                joinedload(AuditMeeting.creator)
            ).first()
            
            if not meeting:
                raise ValueError("Meeting not found or access denied.")
            
            meeting_detail = {
                'id': meeting.id,
                'meeting_id': meeting.meeting_id,
                'title': meeting.title,
                'description': meeting.description,
                'meeting_type': meeting.meeting_type.value,
                'scheduled_time': meeting.scheduled_time.isoformat(),
                'end_time': meeting.end_time.isoformat() if meeting.end_time else None,
                'duration_minutes': meeting.duration_minutes,
                'location': meeting.location,
                'meeting_url': meeting.meeting_url,
                'status': meeting.status.value,
                'organizer': meeting.organizer,
                'participants': meeting.participants or [],
                'agenda': meeting.agenda or [],
                'minutes': meeting.minutes,
                'action_items': meeting.action_items or [],
                'attachments': meeting.attachments or [],
                'ai_summary': meeting.ai_summary,
                'ai_action_items': meeting.ai_action_items or [],
                'ai_findings_discussed': meeting.ai_findings_discussed or [],
                'created_by': f"{meeting.creator.f_name} {meeting.creator.l_name}" if meeting.creator else "System",
                'created_at': meeting.created_at.isoformat(),
                'audit': {
                    'id': meeting.audit.id,
                    'name': meeting.audit.name
                }
            }
            
            return meeting_detail
        except Exception as e:
            print(f"Error in FindingService.get_meeting_details: {e}")
            raise

    def analyze_document_for_findings(
        self,
        audit_id: int,
        file_content: bytes,
        file_type: str,
        current_user: User
    ) -> Dict[str, Any]:
        """Analyze uploaded document for potential findings using AI."""
        try:
            audit = self.db.query(Audit).filter(
                Audit.id == audit_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not audit:
                raise ValueError("Audit not found or access denied.")
            
            text_content = ""
            if file_type == "application/pdf":
                try:
                    pdf_reader = PyPDF2.PdfReader(BytesIO(file_content))
                    for page in pdf_reader.pages:
                        text_content += page.extract_text() + "\n"
                except Exception as e:
                    print(f"Error extracting text from PDF: {e}") # Specific print for PDF error
                    raise ValueError(f"Could not extract text from PDF: {str(e)}")
            elif file_type in ["text/plain", "text/csv"]:
                text_content = file_content.decode('utf-8', errors='ignore')
            else:
                raise ValueError("Unsupported file type.")
            
            findings_from_ai = self.ai_analyzer.analyze_document_with_gemini(
                text_content,
                audit.financial_audit_type.value if audit.financial_audit_type else "general"
            )
            
            saved_findings = []
            for finding_data in findings_from_ai:
                finding_id = f"AF-AI-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
                
                finding = AuditFinding(
                    finding_id=finding_id,
                    audit_id=audit_id,
                    title=finding_data.get('title', 'AI Detected Finding'),
                    description=finding_data.get('description', 'No description provided by AI.'),
                    finding_type=finding_data.get('type', 'compliance'),
                    severity=FindingSeverity(finding_data.get('severity', 'informational')),
                    ai_detected=True,
                    ai_confidence_score=finding_data.get('confidence', 0.0),
                    ai_risk_score=finding_data.get('risk_score', 0.0),
                    ai_recommendations=finding_data.get('recommendations', []),
                    document_page=finding_data.get('page'),
                    document_section=finding_data.get('section'),
                    evidence={"ai_evidence": finding_data.get('evidence', '')},
                    created_by=current_user.id
                )
                
                self.db.add(finding)
                saved_findings.append(finding)
            
            self.db.commit()
            
            return {
                'message': f'{len(saved_findings)} findings detected and saved',
                'findings_count': len(saved_findings),
                'findings': [
                    {
                        'finding_id': f.finding_id,
                        'title': f.title,
                        'severity': f.severity.value,
                        'confidence': f.ai_confidence_score
                    } for f in saved_findings
                ]
            }
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.analyze_document_for_findings: {e}")
            raise

    def generate_remediation_suggestions(self, finding_id: int, current_user: User) -> Dict[str, Any]:
        """Generate AI-powered remediation suggestions for a finding."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            suggestions = self.ai_analyzer.suggest_remediation(
                finding.description,
                finding.finding_type or 'compliance'
            )
            
            finding.ai_recommendations = suggestions # Overwrite or append? Assuming overwrite for simplicity
            self.db.commit()
            
            return {
                'message': 'Remediation suggestions generated successfully',
                'suggestions': suggestions
            }
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.generate_remediation_suggestions: {e}")
            raise

    def delete_finding(self, finding_id: int, current_user: User) -> Dict[str, Any]:
        """Delete a finding (soft delete or hard delete)."""
        try:
            finding = self.db.query(AuditFinding).join(Audit).filter(
                AuditFinding.id == finding_id,
                Audit.company_id == current_user.company_id
            ).first()
            
            if not finding:
                raise ValueError("Finding not found or access denied.")
            
            # Delete related comments and action items
            self.db.query(FindingComment).filter(FindingComment.finding_id == finding_id).delete()
            self.db.query(ActionItem).filter(ActionItem.finding_id == finding_id).delete()
            
            self.db.delete(finding)
            self.db.commit()
            
            return {'message': 'Finding deleted successfully'}
        except Exception as e:
            self.db.rollback()
            print(f"Error in FindingService.delete_finding: {e}")
            raise

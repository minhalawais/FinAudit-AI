import os
import json
import secrets
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import List, Dict, Any
import uuid # Import uuid for token generation

# Assuming AI SDK Python packages are installed as 'ai', 'ai_sdk_google'
import google.generativeai as genai

from groq import Groq # For Grok AI

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text, and_, or_
from fastapi import HTTPException
import bcrypt

from app.models import *

# Configure AI SDK models using environment variables
# Ensure GROQ_API_KEY and GOOGLE_API_KEY are set in your environment
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY") # Using GOOGLE_API_KEY for Gemini

# Initialize models
# Note: In a production environment, you might want to handle API key absence more robustly
grok_client = Groq(api_key=GROQ_API_KEY) # Initialize Groq client directly
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-1.5-flash')


class AuditValidationService:
  def __init__(self, db: Session):
      self.db = db
  
  def validate_audit_creation(self, audit_data) -> dict:
      errors = []
      warnings = []
      suggestions = []
      
      # Date logic validation
      if audit_data.start_date >= audit_data.end_date:
          errors.append("Start date must be before end date")
      
      if audit_data.end_date >= audit_data.deadline:
          errors.append("End date must be before deadline")
      
      # Budget validation
      if audit_data.estimated_budget:
          threshold = audit_data.materiality_threshold
          if threshold == 0: # Avoid division by zero
              warnings.append("Materiality threshold is zero, budget validation skipped.")
          else:
              ratio = audit_data.estimated_budget / threshold
              if ratio < 0.1:
                  warnings.append("Budget seems low compared to materiality threshold. Consider increasing or narrowing scope.")
              elif ratio > 10:
                  warnings.append("Budget seems high compared to materiality threshold. Review budget allocation.")
      
      # High-value audit check
      if audit_data.materiality_threshold > 100000:
          suggestions.append("This audit requires management approval due to high materiality threshold. Ensure proper sign-offs.")
      
      # Timeline validation
      duration = (audit_data.deadline - audit_data.start_date).days
      if duration < 14:
          warnings.append("Audit timeline is very tight (less than 2 weeks). This may impact thoroughness.")
      elif duration > 180:
          warnings.append("Audit timeline is very long (more than 6 months). Consider breaking into phases.")
      
      return {
          "is_valid": len(errors) == 0,
          "errors": errors,
          "warnings": warnings,
          "suggestions": suggestions
      }
  
  def check_auditor_availability(self, auditor_emails: List[str], start_date: datetime, end_date: datetime) -> List[Dict]:
      results = []
      
      for email in auditor_emails:
          auditor = self.db.query(User).filter(User.email == email).first()
          if not auditor:
              results.append({
                  "email": email,
                  "is_available": False,
                  "conflicts": ["Auditor not found in system"],
                  "current_workload": 0,
                  "max_capacity": 0
              })
              continue
          
          # Check availability
          conflicts = self.db.query(AuditorAvailability).filter(
              AuditorAvailability.auditor_id == auditor.id,
              AuditorAvailability.availability_type == 'busy',
              or_(
                  and_(AuditorAvailability.start_date <= start_date, AuditorAvailability.end_date >= start_date),
                  and_(AuditorAvailability.start_date <= end_date, AuditorAvailability.end_date >= end_date),
                  and_(AuditorAvailability.start_date >= start_date, AuditorAvailability.end_date <= end_date)
              )
          ).all()
          
          # Check current workload
          current_audits = self.db.execute(
              text("""
                  SELECT COUNT(*) as count
                  FROM audit_auditor_assignments aaa
                  JOIN audits a ON aaa.audit_id = a.id
                  WHERE aaa.auditor_id = :auditor_id 
                  AND aaa.is_active = true
                  AND a.status IN ('planned', 'in_progress')
                  AND (
                      (a.start_date <= :start_date AND a.end_date >= :start_date) OR
                      (a.start_date <= :end_date AND a.end_date >= :end_date) OR
                      (a.start_date >= :start_date AND a.end_date <= :end_date)
                  )
              """),
              {"auditor_id": auditor.id, "start_date": start_date, "end_date": end_date}
          ).fetchone()
          
          availability_record = self.db.query(AuditorAvailability).filter(
              AuditorAvailability.auditor_id == auditor.id
          ).first()
          
          max_capacity = availability_record.max_concurrent_audits if availability_record else 3
          current_workload = current_audits.count if current_audits else 0
          
          is_available = len(conflicts) == 0 and current_workload < max_capacity
          
          results.append({
              "auditor_id": auditor.id,
              "email": email,
              "is_available": is_available,
              "conflicts": [{
                  "start_date": c.start_date.isoformat(),
                  "end_date": c.end_date.isoformat(),
                  "type": c.availability_type
              } for c in conflicts],
              "current_workload": current_workload,
              "max_capacity": max_capacity
          })
      
      return results

class AIEnhancementService:
  def __init__(self, db: Session):
      self.db = db
  
  async def get_historical_insights(self, audit_data) -> Dict[str, Any]:
      # Find similar historical audits
      similar_audits = self.db.query(Audit).filter(
          Audit.financial_audit_type == audit_data.financial_audit_type,
          Audit.status == AuditStatus.completed,
          Audit.materiality_threshold.between(
              audit_data.materiality_threshold * 0.5,
              audit_data.materiality_threshold * 2.0
          )
      ).limit(5).all()
      
      if not similar_audits:
          return {"message": "No similar historical audits found"}
      
      # Analyze historical data
      avg_duration = sum([(a.end_date - a.start_date).days for a in similar_audits if a.end_date and a.start_date]) / len(similar_audits)
      avg_findings = sum([len(a.findings) for a in similar_audits]) / len(similar_audits)
      
      return {
          "similar_audits_count": len(similar_audits),
          "average_duration_days": round(avg_duration, 1),
          "average_findings_count": round(avg_findings, 1),
          "recommendations": [
              f"Based on similar audits, expect approximately {int(avg_findings)} findings.",
              f"Typical duration for this type of audit is {int(avg_duration)} days.",
              "Consider focusing on high-risk areas identified in similar audits."
          ]
      }
  
  async def generate_intelligent_requirements(self, audit_data, risk_assessment: Dict) -> List[Dict]:
    prompt = f"""
    As a professional financial audit expert, based on the following audit parameters and AI risk assessment, generate specific document requirements.
    
    Audit Type: {audit_data.financial_audit_type}
    Industry: {audit_data.industry_type}
    Compliance Frameworks: {audit_data.compliance_frameworks}
    Materiality Threshold: ${audit_data.materiality_threshold:,.2f}
    Risk Assessment Summary: {json.dumps(risk_assessment.get('risk_categories', []))}
    Key Recommendations from AI: {json.dumps(risk_assessment.get('key_recommendations', []))}
    
    Generate a JSON list of 3-7 essential document requirements. For each requirement, include:
    - "document_type": A specific, professional document name (e.g., "General Ledger", "Bank Statements", "Vendor Contracts").
    - "priority": "high", "medium", or "low" based on its criticality to the audit and identified risks.
    - "deadline_offset_days": An integer representing days from the audit start date for submission.
    - "validation_rules": A JSON object with specific validation criteria (e.g., {{"required_fields": ["account_number", "amount"], "format": "PDF"}}).
    - "ai_priority_score": A float (0-10) indicating AI's calculated importance.
    - "risk_level": "low", "medium", "high", or "critical" based on the document's relevance to identified risks.
    - "description": A brief, professional description of the document's purpose.
    - "compliance_framework": The most relevant compliance framework (e.g., "SOX", "GAAP", "GDPR").
    
    Focus on documents that directly address the highest risk areas and compliance requirements for a financial audit.
    
    IMPORTANT: Return ONLY a JSON array of requirements, without any markdown formatting or code block wrappers.
    """
    
    try:
        messages = [
            {
                "role": "system",
                "content": "You are a professional financial audit expert. Generate specific document requirements in JSON format."
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
        
        response = grok_client.chat.completions.create(
            messages=messages,
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        
        # Handle both direct array responses and object with array
        response_content = response.choices[0].message.content
        print('AI Response Content:', response_content)
        if isinstance(response_content, str):
            try:
                response_content = json.loads(response_content)
                print('Parsed JSON response from AI:', response_content)
            except json.JSONDecodeError:
                print('Invalid JSON response from AI:', response_content)
                raise ValueError("Invalid JSON response from AI")
        
        # Check for both possible keys in the response
        if isinstance(response_content, dict):
            requirements = response_content.get("document_requirements", 
                             response_content.get("requirements", []))
            print('Extracted requirements from AI response:', requirements)
        else:
            requirements = response_content
            print('Directly received requirements from AI response:', requirements)
        
        # Ensure we have a list
        if not isinstance(requirements, list):
            print('AI response was not a list, wrapping in a list.')
            requirements = [requirements]
            
        # Add default description and compliance_framework if not present in AI output
        for req in requirements:
            req['description'] = req.get('description', f"Required document for {req['document_type']}")
            req['compliance_framework'] = req.get('compliance_framework', 'SOX')
            req['risk_level'] = req.get('risk_level', 'medium')
        return requirements
    except Exception as e:
        print(f"Error generating intelligent requirements with AI: {e}")
        # Fallback requirements
        return [
            {
                "document_type": "Financial Statements",
                "priority": "high",
                "deadline_offset_days": 7,
                "validation_rules": {"required_fields": ["balance_sheet", "income_statement", "cash_flow_statement"], "format": "PDF"},
                "ai_priority_score": 9.5,
                "risk_level": "critical",
                "description": "Audited financial statements including balance sheet, income statement, and cash flow statement for the audit period.",
                "compliance_framework": "GAAP"
            },
            {
                "document_type": "Trial Balance",
                "priority": "high",
                "deadline_offset_days": 5,
                "validation_rules": {"format": "Excel", "columns": ["account_number", "account_name", "debit", "credit"]},
                "ai_priority_score": 9.0,
                "risk_level": "high",
                "description": "Detailed trial balance for the audit period.",
                "compliance_framework": "GAAP"
            },
            {
                "document_type": "Bank Reconciliations",
                "priority": "medium",
                "deadline_offset_days": 10,
                "validation_rules": {"required_fields": ["bank_statement_balance", "general_ledger_balance", "reconciling_items"]},
                "ai_priority_score": 7.0,
                "risk_level": "medium",
                "description": "Bank reconciliations for all material bank accounts.",
                "compliance_framework": "SOX"
            }
        ]
  
  async def match_auditors_intelligently(self, audit_data, available_auditors: List[User]) -> List[Dict]:
      # Score auditors based on specializations, past performance, and availability
      scored_auditors = []
      
      for auditor in available_auditors:
          score = 0
          reasons = []
          
          # Specialization match
          if auditor.specializations:
              if audit_data.financial_audit_type in auditor.specializations:
                  score += 30
                  reasons.append("Specialized in this audit type")
              
              if audit_data.industry_type in auditor.specializations:
                  score += 20
                  reasons.append("Industry experience")
          
          # Compliance framework experience
          for framework in audit_data.compliance_frameworks:
              if auditor.certifications and framework.lower() in [c.lower() for c in auditor.certifications]:
                  score += 15
                  reasons.append(f"{framework.upper()} certified")
          
          # Past performance (mock calculation)
          completed_audits = self.db.execute(
              text("""
                  SELECT COUNT(*) as count
                  FROM audit_auditor_assignments aaa
                  JOIN audits a ON aaa.audit_id = a.id
                  WHERE aaa.auditor_id = :auditor_id 
                  AND a.status = 'completed'
              """),
              {"auditor_id": auditor.id}
          ).fetchone()
          
          if completed_audits and completed_audits.count > 5:
              score += 10
              reasons.append("Experienced auditor")
          
          scored_auditors.append({
              "auditor_id": auditor.id,
              "name": f"{auditor.f_name} {auditor.l_name}",
              "email": auditor.email,
              "match_score": score,
              "reasons": reasons,
              "hourly_rate": auditor.hourly_rate
          })
      
      return sorted(scored_auditors, key=lambda x: x["match_score"], reverse=True)

  async def generate_audit_summary(self, audit_data) -> str:
      """Generate a concise, professional summary for a financial audit using Grok AI."""
      messages = [
          {
              "role": "system",
              "content": "You are a professional financial audit expert. Generate concise and accurate summaries."
          },
          {
              "role": "user",
              "content": f"""
              Generate a concise, professional summary for a financial audit with the following details:
              Audit Name: {audit_data.name}
              Audit Type: {audit_data.financial_audit_type}
              Scope: {audit_data.scope}
              Description: {audit_data.description}
              
              Focus on key objectives, the purpose of the audit, and expected outcomes in 2-3 sentences.
              """
          }
      ]
      try:
          chat_completion = grok_client.chat.completions.create(
              messages=messages,
              model="llama-3.3-70b-versatile" # Using llama-3.3-70b-versatile as a common Grok model, adjust if a specific version is preferred
          )
          return chat_completion.choices[0].message.content
      except Exception as e:
          print(f"Error generating audit summary with Grok AI: {e}")
          return f"Audit of {audit_data.name} focusing on {audit_data.financial_audit_type} within the scope of {audit_data.scope}."

  async def suggest_initial_findings(self, audit_data, ai_assessment: Dict) -> List[Dict]:
      """Suggest initial high-level audit findings using Grok AI based on audit parameters and risk assessment."""
      risk_assessment_summary = json.dumps(ai_assessment.get("risk_categories", []))
      key_recommendations_summary = ", ".join(ai_assessment.get("key_recommendations", []))

      messages = [
          {
              "role": "system",
              "content": "You are a highly experienced financial auditor. Provide realistic and actionable audit findings in JSON format."
          },
          {
              "role": "user",
              "content": f"""
              Based on a financial audit of type '{audit_data.financial_audit_type}' with scope '{audit_data.scope}', and considering the following AI risk assessment summary:
              Risk Categories: {risk_assessment_summary}
              Key Recommendations: {key_recommendations_summary}

              Generate a JSON list of 3-5 potential high-level audit findings. For each finding, provide:
              - 'title': A concise title for the finding (e.g., "Inadequate Revenue Recognition Controls").
              - 'description': A detailed description of the potential issue (e.g., "Lack of proper segregation of duties in the revenue cycle leading to potential misstatements.").
              - 'severity': ("critical", "major", "minor", "informational") - based on financial impact and likelihood.
              - 'recommendation': A clear, actionable recommendation to address the finding (e.g., "Implement a robust control framework for revenue recognition, including independent review.").
              - 'estimated_impact': ("low", "medium", "high") - the potential financial or operational impact.
              - 'likelihood': ("low", "medium", "high") - the probability of this finding occurring.
              - 'risk_score': (1-10) - an overall risk score for the finding.
              - 'finding_type': ("compliance", "control_deficiency", "documentation_issue", "process_inefficiency", "risk_exposure", "best_practice").
              - 'ai_confidence_score': (0-1) - AI's confidence in this suggestion.
              - 'ai_risk_score': (0-10) - AI's calculated risk score for this specific finding.
              - 'ai_recommendations': A list of specific AI-driven recommendations for this finding.

              Ensure these findings are typical for a professional financial audit and align with the identified risks.
              """
          }
      ]
      try:
          chat_completion = grok_client.chat.completions.create(
              messages=messages,
              model="llama-3.3-70b-versatile", # Using llama-3.3-70b-versatile
              response_format={"type": "json_object"} # Request JSON output
          )
          response_content = chat_completion.choices[0].message.content
          
          try:
              parsed_content = json.loads(response_content)
          except json.JSONDecodeError:
              print(f"AI response was not valid JSON for initial findings: {response_content}")
              return [] # Return empty list if JSON parsing fails

          findings_raw = []
          if isinstance(parsed_content, dict):
              # Try common keys where the list might be nested
              if "audit_findings" in parsed_content and isinstance(parsed_content["audit_findings"], list):
                  findings_raw = parsed_content["audit_findings"]
              elif "findings" in parsed_content and isinstance(parsed_content["findings"], list):
                  findings_raw = parsed_content["findings"]
              else:
                  # If it's a dict but no known list key, assume it's a single item
                  findings_raw = [parsed_content]
          elif isinstance(parsed_content, list):
              findings_raw = parsed_content
          
          # Flatten any nested lists and filter for dictionaries
          findings_list = []
          for item in findings_raw:
              if isinstance(item, list): # If it's a list of lists, flatten it
                  for sub_item in item:
                      if isinstance(sub_item, dict):
                          findings_list.append(sub_item)
              elif isinstance(item, dict):
                  findings_list.append(item)
              else:
                  print(f"Skipping non-dictionary/non-list item in findings raw: {item}")

          # Add default values if AI doesn't provide them
          for finding in findings_list: # Iterate over the correctly extracted list
              # Ensure 'finding' is a dictionary before calling .get()
            if not isinstance(finding, dict):
                print(f"Skipping non-dictionary item in findings: {finding}")
                continue
            if 'severity' in finding:
                # Ensure the severity value matches the enum exactly
                finding['severity'] = finding['severity'].lower().replace(' ', '_')
                # Map to the actual enum value
                finding['severity'] = {
                    'critical': 'critical',
                    'major': 'major',
                    'minor': 'minor',
                    'informational': 'informational'
                }.get(finding['severity'], 'minor')  # default to minor if invalid
            finding['finding_type'] = finding.get('finding_type', 'compliance')
            finding['ai_confidence_score'] = finding.get('ai_confidence_score', 0.7)
            finding['ai_risk_score'] = finding.get('ai_risk_score', finding.get('risk_score', 5.0))
            
            # Ensure ai_recommendations is a list
            ai_recs = finding.get('ai_recommendations', [])
            if isinstance(ai_recs, str):
                try:
                    ai_recs = json.loads(ai_recs)
                except json.JSONDecodeError:
                    ai_recs = [] # Fallback if it's a malformed string
            finding['ai_recommendations'] = ai_recs if isinstance(ai_recs, list) else []

            # Ensure 'title' is present, or provide a default
            if 'title' not in finding:
                print(f"Warning: 'title' missing in AI-generated finding: {finding}")
                finding['title'] = 'Untitled Finding' # Provide a default
          return findings_list
      except Exception as e:
          print(f"Error suggesting initial findings with Grok AI: {e}")
          return [] # Return empty list on error

  async def suggest_compliance_checkpoints(self, audit_data, ai_assessment: Dict) -> List[Dict]:
      """Suggest initial compliance checkpoints using Grok AI based on audit parameters and compliance frameworks."""
      compliance_frameworks_list = ", ".join(audit_data.compliance_frameworks)
      key_recommendations_summary = ", ".join(ai_assessment.get("key_recommendations", []))

      messages = [
          {
              "role": "system",
              "content": "You are a compliance expert. Provide high-level compliance checkpoints in JSON format."
          },
          {
          "role": "user",
          "content": f"""
          For a financial audit of type '{audit_data.financial_audit_type}' focusing on compliance with frameworks: {compliance_frameworks_list}, and considering key recommendations: {key_recommendations_summary}, generate a JSON list of 3-5 initial compliance checkpoints. For each checkpoint, provide:
          - 'checkpoint_type': (e.g., 'data_privacy', 'financial_reporting', 'internal_control', 'regulatory_filing').
          - 'status': ("passed", "failed", "warning") - initial status, typically 'warning' or 'pending_review'.
          - 'score': (0-100) - an initial compliance health score, reflecting perceived adherence.
          - 'details': A brief description of what needs to be checked for this checkpoint (e.g., "Verify adherence to SOX Section 302 certification requirements.").
          - 'next_check_at_offset_days': (integer) - days from audit start for the next scheduled check.

          These should be high-level checks relevant to the specified frameworks and audit type, focusing on critical compliance areas.
          """
          }
      ]
      try:
          chat_completion = grok_client.chat.completions.create(
              messages=messages,
              model="llama-3.3-70b-versatile", # Using llama-3.3-70b-versatile
              response_format={"type": "json_object"} # Request JSON output
          )
          response_content = chat_completion.choices[0].message.content

          try:
              parsed_content = json.loads(response_content)
          except json.JSONDecodeError:
              print(f"AI response was not valid JSON for compliance checkpoints: {response_content}")
              return [] # Return empty list if JSON parsing fails

          checkpoints_raw = []
          if isinstance(parsed_content, dict):
              # Try common keys where the list might be nested
              if "checkpoints" in parsed_content and isinstance(parsed_content["checkpoints"], list):
                  checkpoints_raw = parsed_content["checkpoints"]
              elif "compliance_checkpoints" in parsed_content and isinstance(parsed_content["compliance_checkpoints"], list):
                  checkpoints_raw = parsed_content["compliance_checkpoints"]
              else:
                  # If it's a dict but no known list key, assume it's a single item
                  checkpoints_raw = [parsed_content]
          elif isinstance(parsed_content, list):
              checkpoints_raw = parsed_content
          
          # Flatten any nested lists and filter for dictionaries
          checkpoints_list = []
          for item in checkpoints_raw:
              if isinstance(item, list): # If it's a list of lists, flatten it
                  for sub_item in item:
                      if isinstance(sub_item, dict):
                          checkpoints_list.append(sub_item)
              elif isinstance(item, dict):
                  checkpoints_list.append(item)
              else:
                  print(f"Skipping non-dictionary/non-list item in checkpoints raw: {item}")


          # Add default values if AI doesn't provide them
          for cp in checkpoints_list: # Iterate over the correctly extracted list
              # Ensure 'cp' is a dictionary before calling .get() - already filtered above, but good for safety
              if not isinstance(cp, dict):
                  continue # Should not happen after filtering, but defensive programming
              cp['status'] = cp.get('status', 'warning')
              cp['score'] = cp.get('score', 50.0)
              cp['next_check_at_offset_days'] = cp.get('next_check_at_offset_days', 30)
              # Ensure checkpoint_type is present, or provide a default
              if 'checkpoint_type' not in cp:
                  print(f"Warning: 'checkpoint_type' missing in AI-generated checkpoint: {cp}")
                  cp['checkpoint_type'] = 'general_compliance' # Provide a default
          return checkpoints_list
      except Exception as e:
          print(f"Error suggesting compliance checkpoints with Grok AI: {e}")
          return [] # Return empty list on error

# Utility Functions
def generate_secure_password(length: int = 12) -> str:
  """Generate a secure temporary password"""
  alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
  password = ''.join(secrets.choice(alphabet) for _ in range(length))
  return password

async def generate_ai_risk_assessment(
  financial_audit_type: str,
  scope: str,
  materiality_threshold: float,
  db: Session
) -> dict:
  """Generate AI-powered risk assessment using Groq"""
  
  # Get historical risk patterns
  historical_risks = db.query(AIRiskAssessment).join(Audit).filter(
      Audit.financial_audit_type == financial_audit_type
  ).limit(10).all()
  
  historical_context = ""
  if historical_risks:
      risk_patterns = {}
      for risk in historical_risks:
          if risk.risk_category not in risk_patterns:
              risk_patterns[risk.risk_category] = []
          risk_patterns[risk.risk_category].append(risk.risk_level.value)
      
      historical_context = f"Historical risk patterns for {financial_audit_type}: {risk_patterns}"
  
  prompt = f"""
  As a senior financial audit expert with access to historical data, analyze the following audit parameters:
  
  Audit Type: {financial_audit_type}
  Scope: {scope}
  Materiality Threshold: ${materiality_threshold:,.2f}
  Historical Context: {historical_context}
  
  Provide a comprehensive risk assessment with:
  1. Risk categories with levels (low, medium, high, critical)
  2. Confidence scores (0-1) based on data quality and historical patterns
  3. Detailed descriptions and AI reasoning
  4. Suggested focus areas for each risk
  5. Overall risk score (0-10) with justification
  6. Key recommendations prioritized by risk level
  
  Consider industry best practices, regulatory requirements, and historical audit outcomes.
  
  Format as JSON:
  {{
      "risk_categories": [
          {{
              "category": "string",
              "level": "high|medium|low|critical",
              "confidence": 0.95,
              "description": "string",
              "reasoning": "string with historical context",
              "focus_areas": ["area1", "area2"]
          }}
      ],
      "overall_risk_score": 7.5,
      "confidence": 0.9,
      "key_recommendations": ["rec1", "rec2"],
      "historical_insights": "insights from similar audits"
  }}
  
  IMPORTANT: Return ONLY the JSON object, without any markdown formatting or code block wrappers.
  """
  
  try:
      messages = [
          {
              "role": "system",
              "content": "You are a senior financial audit expert. Provide a comprehensive risk assessment in JSON format."
          },
          {
              "role": "user",
              "content": prompt
          }
      ]
      
      response = grok_client.chat.completions.create(
          messages=messages,
          model="llama-3.3-70b-versatile",
          response_format={"type": "json_object"}
      )
      
      ai_assessment = json.loads(response.choices[0].message.content)
      return ai_assessment
  except Exception as e:
      print(f"Error generating AI risk assessment with Groq: {str(e)}")
      
      # Enhanced fallback with historical context
      return {
          "risk_categories": [
              {
                  "category": "High-Value Transactions",
                  "level": "high",
                  "confidence": 0.8,
                  "description": f"Transactions above ${materiality_threshold:,.2f} require detailed review",
                  "reasoning": "Large transactions pose higher risk of errors or fraud based on historical patterns",
                  "focus_areas": ["Authorization", "Supporting Documentation", "Approval Workflow"]
              },
              {
                  "category": "Internal Controls",
                  "level": "medium",
                  "confidence": 0.7,
                  "description": "Assessment of internal control effectiveness",
                  "reasoning": "Control deficiencies commonly found in similar audits",
                  "focus_areas": ["Segregation of Duties", "Management Review", "Documentation"]
              }
          ],
          "overall_risk_score": 6.5,
          "confidence": 0.75,
          "key_recommendations": [
              "Focus on high-value transactions above materiality threshold",
              "Review internal control design and implementation",
              "Test management review controls"
          ],
          "historical_insights": "Based on similar audits, expect 2-3 medium findings on average"
      }

def get_password_hash(password: str) -> str:
  try:
      return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
  except ValueError as e:
      raise HTTPException(status_code=500, detail="Error processing password")

async def invite_auditor_with_credentials(
  audit_id: int,
  email: str,
  invited_by: int,
  db: Session
):
  """Invite auditor with auto-generated credentials and send email"""
  # Generate secure temporary password
  temp_password = generate_secure_password()
  
  # Get company ID from the inviting user
  inviting_user = db.query(User).filter(User.id == invited_by).first()
  if not inviting_user:
      raise ValueError("Inviting user not found")
  
  # Create invitation record
  invitation = AuditorInvitation(
      company_id=inviting_user.company_id,
      email=email,
      invited_by=invited_by,
      role="auditor",
      temp_password=temp_password,
      token=str(uuid.uuid4()),
      expires_at=datetime.utcnow() + timedelta(days=7),
      message="You have been invited to join our audit platform"
  )
  
  db.add(invitation)
  db.flush() # Flush to get invitation.id before creating user
  
  password = get_password_hash(temp_password)
  # Create user record with auditor role
  user = User(
      username=email.split('@')[0],
      email=email,
      hashed_password=password,  # Note: In production, hash this password
      role=UserRole.auditor,
      f_name="",
      l_name="",
      company_id=inviting_user.company_id,
      is_active=False,  # User needs to confirm email to activate
      availability_status="available"
  )
  
  db.add(user)
  db.flush() # Flush to get user.id before committing
  
  # Send email with credentials
  await send_auditor_invitation_email(
      email=email,
      temp_password=temp_password,
      token=invitation.token,
      audit_id=audit_id,
      inviting_user=inviting_user
  )
  
  return invitation

async def send_auditor_invitation_email(
  email: str,
  temp_password: str,
  token: str,
  audit_id: int,
  inviting_user: User
):
  """Send invitation email to auditor with credentials"""
  try:
      # Email configuration
      sender_email = "minhalawais1@gmail.com"  # Your Gmail address
      sender_password = "ibcf vrxn euoa qdci"  # Your Gmail app password

      # Create message
      message = MIMEMultipart()
      message["From"] = sender_email
      message["To"] = email
      message["Subject"] = "Invitation to Join Audit Platform"
      
      # Email body
      body = f"""
      <html>
          <body>
              <h2>Audit Platform Invitation</h2>
              <p>You have been invited by {inviting_user.f_name} {inviting_user.l_name} to participate in audit ID: {audit_id}.</p>
              <p>Your temporary credentials:</p>
              <ul>
                  <li>Email: {email}</li>
                  <li>Temporary Password: {temp_password}</li>
              </ul>
              <p>Please click the link below to activate your account and set a new password:</p>
              <p><a href="http://yourapp.com/activate?token={token}">Activate Account</a></p>
              <p>This invitation will expire in 7 days.</p>
              <p>If you didn't request this invitation, please ignore this email.</p>
              <br>
              <p>Best regards,</p>
              <p>Audit Platform Team</p>
          </body>
      </html>
      """
      
      message.attach(MIMEText(body, "html"))
      
      # Send email
      with smtplib.SMTP("smtp.gmail.com", 587) as server:
          server.starttls()
          server.login(sender_email, sender_password)
          server.sendmail(sender_email, email, message.as_string())
          
  except Exception as e:
      print(f"Failed to send invitation email: {e}")
      raise

async def schedule_kickoff_meeting(
  audit_id: int,
  created_by: int,
  db: Session
) -> AuditMeeting:
  """Auto-schedule kickoff meeting 48 hours after audit creation"""
  
  kickoff_time = datetime.utcnow() + timedelta(hours=48)
  
  meeting = AuditMeeting(
      audit_id=audit_id,
      title="Audit Kickoff Meeting",
      meeting_type=MeetingType.kickoff,
      scheduled_time=kickoff_time,
      duration_minutes=90,
      location="Virtual Meeting",
      meeting_url="https://meet.google.com/auto-generated-link",
      status=MeetingStatus.scheduled,
      created_by=created_by
  )
  
  db.add(meeting)
  db.flush()
  
  # Add default agenda items
  agenda_items = [
      {"title": "Audit Scope Review", "time_allocation": 20, "order_index": 1},
      {"title": "Document Requirements Walkthrough", "time_allocation": 30, "order_index": 2},
      {"title": "Timeline and Milestones", "time_allocation": 20, "order_index": 3},
      {"title": "Q&A and Next Steps", "time_allocation": 20, "order_index": 4}
  ]
  
  for item in agenda_items:
      agenda = MeetingAgendaItem(
          meeting_id=meeting.id,
          title=item["title"],
          time_allocation=item["time_allocation"],
          order_index=item["order_index"]
      )
      db.add(agenda)
  
  return meeting

def calculate_overall_progress(audit_id: int, db: Session) -> float:
  """Calculate overall audit progress"""
  # This is a simplified calculation - you can make it more sophisticated
  requirements_weight = 0.4
  findings_weight = 0.3
  meetings_weight = 0.3
  
  # Requirements progress
  total_reqs = db.query(DocumentRequirement).filter(
      DocumentRequirement.audit_id == audit_id
  ).count()
  
  completed_reqs = db.query(DocumentRequirement).join(
      DocumentSubmission
  ).filter(
      DocumentRequirement.audit_id == audit_id,
      DocumentSubmission.verification_status == EvidenceStatus.approved
  ).count()
  
  req_progress = (completed_reqs / total_reqs * 100) if total_reqs > 0 else 0
  
  # Findings progress
  total_findings = db.query(AuditFinding).filter(
      AuditFinding.audit_id == audit_id
  ).count()
  
  resolved_findings = db.query(AuditFinding).filter(
      AuditFinding.audit_id == audit_id,
      AuditFinding.status == FindingStatus.resolved
  ).count()
  
  findings_progress = (resolved_findings / total_findings * 100) if total_findings > 0 else 0
  
  # Meetings progress
  total_meetings = db.query(AuditMeeting).filter(
      AuditMeeting.audit_id == audit_id
  ).count()
  
  completed_meetings = db.query(AuditMeeting).filter(
      AuditMeeting.audit_id == audit_id,
      AuditMeeting.status == MeetingStatus.completed
  ).count()
  
  meetings_progress = (completed_meetings / total_meetings * 100) if total_meetings > 0 else 0
  
  # Calculate weighted average
  overall = (
      req_progress * requirements_weight +
      findings_progress * findings_weight +
      meetings_progress * meetings_weight
  )
  
  return round(overall, 1)

def calculate_complexity_score(audit_data, ai_assessment: Dict) -> float:
  """Calculate audit complexity score (1-10)"""
  score = 5.0  # Base score
  
  # Materiality threshold impact
  if audit_data.materiality_threshold > 1000000:
      score += 2
  elif audit_data.materiality_threshold > 100000:
      score += 1
  
  # Compliance frameworks
  score += len(audit_data.compliance_frameworks) * 0.5
  
  # AI risk score impact
  if ai_assessment.get("overall_risk_score", 5) > 7:
      score += 1.5
  
  # Timeline pressure
  duration = (audit_data.deadline - audit_data.start_date).days
  if duration < 30:
      score += 1
  
  return min(10.0, max(1.0, score))

def estimate_audit_hours(complexity_score: float, audit_data) -> float:
  """Estimate audit hours based on complexity"""
  base_hours = 40  # Base hours for simple audit
  
  # Complexity multiplier
  hours = base_hours * (complexity_score / 5.0)
  
  # Audit type specific adjustments
  type_multipliers = {
      "vendor_payments": 1.2,
      "revenue_recognition": 1.5,
      "tax_compliance": 1.3,
      "payroll_audit": 1.1,
      "custom": 1.4,
      "expense_reimbursements": 1.1,
      "accounts_payable": 1.2,
      "accounts_receivable": 1.2,
      "inventory_valuation": 1.3
  }
  
  multiplier = type_multipliers.get(audit_data.financial_audit_type, 1.0)
  hours *= multiplier
  
  # Compliance framework overhead
  hours += len(audit_data.compliance_frameworks) * 8
  
  return round(hours, 1)

async def send_meeting_invites(meeting_id: int, db: Session, is_update: bool = False):
  """Send meeting invitations to all attendees"""
  try:
      meeting = db.query(AuditMeeting).options(
          joinedload(AuditMeeting.attendees).joinedload(MeetingAttendee.user),
          joinedload(AuditMeeting.audit)
      ).filter(AuditMeeting.id == meeting_id).first()
      
      if not meeting:
          return
      
      # In a real implementation, this would send actual emails or calendar invites
      # For now, we'll just log it
      print(f"{'Updating' if is_update else 'Sending'} invites for meeting {meeting.id}")
      
      # Update attendee statuses
      for attendee in meeting.attendees:
          attendee.has_confirmed = False  # Reset confirmation status if meeting was updated
          
      db.commit()
      
  except Exception as e:
      print(f"Failed to send meeting invites: {e}")

def generate_meeting_minutes_template(meeting_type: str) -> str:
  """Generate a basic meeting minutes template based on meeting type"""
  templates = {
      "kickoff": """# Kickoff Meeting Minutes

## Attendees:
- 

## Agenda Items:
1. 

## Discussion Points:
- 

## Action Items:
- 

## Next Steps:
1. 
""",
      "progress": """# Progress Meeting Minutes

## Attendees:
- 

## Status Updates:
- 

## Issues/Blockers:
- 

## Action Items:
- 

## Next Steps:
1. 
""",
      "exit": """# Exit Meeting Minutes

## Attendees:
- 

## Audit Findings Summary:
- 

## Recommendations:
- 

## Action Items:
- 

## Next Steps:
1. 
"""
  }
  
  return templates.get(meeting_type, """# Meeting Minutes

## Attendees:
- 

## Discussion:
- 

## Decisions:
- 

## Action Items:
- 
""")

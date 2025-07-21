"""
Updated routers initialization to include new audit sub-modules
"""

from .document import router as document_router
from .auth import router as auth_router
from .employee import router as employee_router
from .company import router as company_router
from ._user import router as user_router
from .workflow_routes import router as workflow_router
from .version_routes import router as version_router
from .dashboard_routes import router as dashboard_router

# Import new audit-related routers
from .audit.main_routes import router as audit_router
from .audit.dashboard_routes import router as auditee_router
from .audit.auditor_directory_routes import auditors_router
from .audit.document_routes import document_router as audit_document_router
from .audit.findings_routes import findings_router
from .audit.meeting_routes import meeting_router
from .audit.communication_routes import communication_router
from .audit.report_routes import report_router
from .audit.analytics_routes import analytics_router
from .audit.enhanced_routes import enhanced_router
from .audit.document_submission_routes import router as document_submission_router
from .audit.compliance_routes import compliance_router
__all__ = [
    "document_router", 
    "auth_router", 
    "employee_router", 
    "company_router", 
    "user_router", 
    "workflow_router", 
    "version_router", 
    "dashboard_router",
    # Add new audit routers to __all__
    "audit_router",
    "auditee_router",
    "auditors_router",
    "audit_document_router",
    "findings_router",
    "meeting_router",
    "communication_router",
    "report_router",
    "analytics_router",
    "enhanced_router",
    "document_submission_router",
    "compliance_router"
]

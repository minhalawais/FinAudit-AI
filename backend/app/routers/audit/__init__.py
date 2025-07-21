"""
Audit module initialization
Imports all audit-related routers and services
"""

from .main_routes import router as audit_router
from .dashboard_routes import router as auditee_router
from .auditor_directory_routes import auditors_router
from .document_routes import document_router
from .findings_routes import findings_router
from .meeting_routes import meeting_router
from .communication_routes import communication_router
from .report_routes import report_router
from .analytics_routes import analytics_router
from .enhanced_routes import enhanced_router
from .document_submission_routes import router as document_submission_router
from .compliance_routes import compliance_router
__all__ = [
    "audit_router",
    "auditee_router",
    "auditors_router",
    "document_router",
    "findings_router",
    "meeting_router",
    "communication_router",
    "report_router",
    "analytics_router",
    "enhanced_router",
    "document_submission_router",
    "compliance_router"
]

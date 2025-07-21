"""
Updated main.py to include all audit sub-routers
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import (
    document_router, auth_router, employee_router, company_router, 
    user_router, workflow_router, version_router, dashboard_router
)

# Import all audit-related routers
from app.routers.audit.main_routes import router as audit_router
from app.routers.audit.dashboard_routes import router as  auditee_router
from app.routers.audit.auditor_directory_routes import auditors_router
from app.routers.audit.document_routes import document_router as audit_document_router
from app.routers.audit.findings_routes import findings_router
from app.routers.audit.meeting_routes import meeting_router
from app.routers.audit.communication_routes import communication_router
from app.routers.audit.report_routes import report_router
from app.routers.audit.analytics_routes import analytics_router
from app.routers.audit.enhanced_routes import enhanced_router
from app.routers.audit.document_submission_routes import router as document_submission_router
from app.routers.audit.compliance_routes import compliance_router
from app.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FinAudit AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include existing routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(document_router, tags=["Documents"])
app.include_router(employee_router, prefix="/employees", tags=["Employees"])
app.include_router(company_router, prefix="/companies", tags=["Companies"])
app.include_router(user_router, prefix="/users", tags=["Users"])
app.include_router(workflow_router, tags=["Workflows"])
app.include_router(version_router, tags=["Versions"])
app.include_router(dashboard_router, tags=["Dashboard"])

# Include all audit routers
app.include_router(audit_router)
app.include_router(auditee_router)
app.include_router(auditors_router)
app.include_router(audit_document_router)
app.include_router(findings_router)
app.include_router(meeting_router)
app.include_router(communication_router)
app.include_router(report_router)
app.include_router(analytics_router)
app.include_router(enhanced_router)
app.include_router(document_submission_router)
app.include_router(compliance_router)

@app.get("/")
async def root():
    return {"message": "Welcome to FinAudit AI API"}

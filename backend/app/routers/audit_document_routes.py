from fastapi import APIRouter, Depends, HTTPException, Body, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import os
import shutil
import logging

from app.database import get_db
from app.models import (
    User, Audit, AuditDocument, Document, EvidenceStatus,
    AuditActivity
)
from app.routers.auth import get_current_user

router = APIRouter(
    tags=["audit documents"]
)

logger = logging.getLogger(__name__)

# B. Document Handling Routes

@router.get("/audits/{audit_id}/documents", response_model=Dict[str, Any])
async def list_audit_documents(
    audit_id: int,
    status: Optional[EvidenceStatus] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List documents requested/submitted for an audit
    """
    try:
        # Check if audit exists and user has access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        # Build query for audit documents
        query = db.query(AuditDocument).filter(AuditDocument.audit_id == audit_id)
        
        # Apply status filter if provided
        if status:
            query = query.filter(AuditDocument.status == status)
        
        # Get total count for pagination
        total_count = query.count()
        
        # Apply pagination
        audit_documents = query.order_by(AuditDocument.requested_at.desc()).offset((page - 1) * limit).limit(limit).all()
        
        # Format response
        documents_list = []
        for audit_doc in audit_documents:
            document = audit_doc.document
            
            documents_list.append({
                "id": audit_doc.id,
                "document_id": audit_doc.document_id,
                "document": {
                    "id": document.id,
                    "title": document.title,
                    "file_type": document.file_type,
                    "file_size": document.file_size
                } if document else None,
                "status": audit_doc.status.value,
                "requested_at": audit_doc.requested_at.isoformat(),
                "submitted_at": audit_doc.submitted_at.isoformat() if audit_doc.submitted_at else None,
                "verification_notes": audit_doc.verification_notes,
                "verified_by": audit_doc.verified_by,
                "verified_at": audit_doc.verified_at.isoformat() if audit_doc.verified_at else None
            })
        
        # Log activity
        activity = AuditActivity(
            audit_id=audit_id,
            user_id=current_user.id,
            action="list_audit_documents",
            details={"status_filter": status.value if status else None},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "documents": documents_list,
            "pagination": {
                "total": total_count,
                "page": page,
                "limit": limit,
                "pages": (total_count + limit - 1) // limit  # Ceiling division
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing audit documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list audit documents: {str(e)}")

@router.post("/audits/{audit_id}/documents/request", response_model=Dict[str, Any])
async def request_documents(
    audit_id: int,
    request_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Request specific documents for an audit
    """
    try:
        # Check if audit exists and user has access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        # Extract document requests
        document_requests = request_data.get("document_requests", [])
        if not document_requests:
            raise HTTPException(status_code=400, detail="No document requests provided")
        
        # Process each document request
        created_requests = []
        for req in document_requests:
            # Check if document already exists
            document = None
            print('Request:', req)
            if "document_id" in req and req["document_id"]:
                document = db.query(Document).filter(
                    Document.id == req["document_id"],
                    Document.company_id == current_user.company_id,
                    Document.is_deleted == False
                ).first()
                print('Document:', document)
                
                
                if not document:
                    raise HTTPException(status_code=404, detail=f"Document with ID {req['document_id']} not found")
            
            # Create new audit document request
            audit_document = AuditDocument(
                audit_id=audit_id,
                document_id=document.id if document else None,
                requested_at=datetime.utcnow(),
                status=EvidenceStatus.pending
            )
            
            db.add(audit_document)
            db.flush()  # Get ID without committing
            
            created_requests.append({
                "id": audit_document.id,
                "document_id": audit_document.document_id,
                "document_title": document.title if document else None,
                "status": audit_document.status.value,
                "requested_at": audit_document.requested_at.isoformat()
            })
        
        # Commit all changes
        db.commit()
        
        # Log activity
        activity = AuditActivity(
            audit_id=audit_id,
            user_id=current_user.id,
            action="request_documents",
            details={"count": len(created_requests)},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "message": f"Successfully requested {len(created_requests)} documents",
            "document_requests": created_requests
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error requesting documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to request documents: {str(e)}")

@router.post("/audits/{audit_id}/documents/{doc_id}/verify", response_model=Dict[str, Any])
async def verify_document(
    audit_id: int,
    doc_id: int,
    verification_data: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve or reject submitted evidence
    """
    try:
        # Check if audit exists and user has access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        # Get the audit document
        audit_document = db.query(AuditDocument).filter(
            AuditDocument.id == doc_id,
            AuditDocument.audit_id == audit_id
        ).first()
        
        if not audit_document:
            raise HTTPException(status_code=404, detail="Audit document not found")
        
        # Extract verification data
        verification_status = verification_data.get("status")
        verification_notes = verification_data.get("notes", "")
        
        if not verification_status:
            raise HTTPException(status_code=400, detail="Verification status is required")
        
        try:
            audit_document.status = EvidenceStatus(verification_status)
        except ValueError:
            valid_statuses = [status.value for status in EvidenceStatus]
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status. Valid values are: {', '.join(valid_statuses)}"
            )
        
        # Update verification details
        audit_document.verification_notes = verification_notes
        audit_document.verified_by = current_user.id
        audit_document.verified_at = datetime.utcnow()
        
        # Save changes
        db.commit()
        db.refresh(audit_document)
        
        # Log activity
        activity = AuditActivity(
            audit_id=audit_id,
            user_id=current_user.id,
            action="verify_document",
            details={
                "document_id": doc_id,
                "status": verification_status,
                "document_title": audit_document.document.title if audit_document.document else "Unknown"
            },
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "message": f"Document verification status set to {verification_status}",
            "document": {
                "id": audit_document.id,
                "document_id": audit_document.document_id,
                "status": audit_document.status.value,
                "verification_notes": audit_document.verification_notes,
                "verified_by": audit_document.verified_by,
                "verified_at": audit_document.verified_at.isoformat()
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error verifying document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to verify document: {str(e)}")

@router.get("/audits/{audit_id}/documents/compare", response_model=Dict[str, Any])
async def compare_documents(
    audit_id: int,
    doc1_id: int = Query(..., description="First document ID"),
    doc2_id: int = Query(..., description="Second document ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare two documents (e.g., invoice vs. receipt)
    """
    try:
        # Check if audit exists and user has access
        audit = db.query(Audit).filter(
            Audit.id == audit_id,
            Audit.company_id == current_user.company_id
        ).first()
        
        if not audit:
            raise HTTPException(status_code=404, detail="Audit not found")
        
        
        # Get the documents
        doc1 = db.query(Document).filter(
            Document.id == doc1_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).first()
        
        if not doc1:
            raise HTTPException(status_code=404, detail="First document not found")
        
        doc2 = db.query(Document).filter(
            Document.id == doc2_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).first()
        
        if not doc2:
            raise HTTPException(status_code=404, detail="Second document not found")
        
        # Extract content for comparison
        doc1_content = json.loads(doc1.content) if doc1.content else {}
        doc2_content = json.loads(doc2.content) if doc2.content else {}
        
        # Perform basic comparison
        # This is a simplified comparison - in a real application, you might use more sophisticated methods
        comparison_result = {
            "matching_fields": [],
            "differing_fields": [],
            "unique_to_doc1": [],
            "unique_to_doc2": []
        }
        
        # Compare common fields
        all_keys = set(doc1_content.keys()) | set(doc2_content.keys())
        for key in all_keys:
            if key in doc1_content and key in doc2_content:
                if doc1_content[key] == doc2_content[key]:
                    comparison_result["matching_fields"].append({
                        "field": key,
                        "value": doc1_content[key]
                    })
                else:
                    comparison_result["differing_fields"].append({
                        "field": key,
                        "doc1_value": doc1_content[key],
                        "doc2_value": doc2_content[key]
                    })
            elif key in doc1_content:
                comparison_result["unique_to_doc1"].append({
                    "field": key,
                    "value": doc1_content[key]
                })
            else:  # key in doc2_content
                comparison_result["unique_to_doc2"].append({
                    "field": key,
                    "value": doc2_content[key]
                })
        
        # Log activity
        activity = AuditActivity(
            audit_id=audit_id,
            user_id=current_user.id,
            action="compare_documents",
            details={
                "doc1_id": doc1_id,
                "doc2_id": doc2_id,
                "doc1_title": doc1.title,
                "doc2_title": doc2.title
            },
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "comparison": comparison_result,
            "documents": {
                "doc1": {
                    "id": doc1.id,
                    "title": doc1.title,
                    "file_type": doc1.file_type
                },
                "doc2": {
                    "id": doc2.id,
                    "title": doc2.title,
                    "file_type": doc2.file_type
                }
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error comparing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to compare documents: {str(e)}")
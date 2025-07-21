# app/routers/document_routes.py

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.models import User, Document as DocumentModel, DocumentMetadata, Annotation, DocumentVersion, DocumentWorkflow
from app.models import RelatedDocument, DocumentAIAnalysis, Activity, WorkflowExecutionHistory
from app.cruds.document import (
    create_document, list_documents, batch_operation, get_document, get_document_content,
    update_document_metadata, delete_document, cleanup_deleted_documents, download_document
)
from app.routers.auth import get_current_user
from app.schemas.document import Document
from app.schemas.error import ErrorResponse
from app.tasks import process_pdf, process_excel, process_csv, process_image
import json
import os
import shutil

router = APIRouter()

@router.post("/documents")
async def create_document_route(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    metadata: str = Form(...),
):
    document = create_document(db, file, metadata, current_user)
    
    # Add the appropriate background task based on file type
    if document.file_type == "application/pdf":
        background_tasks.add_task(process_pdf, document.file_path, document.id)
    elif document.file_type in ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"]:
        background_tasks.add_task(process_excel, document.file_path, document.id)
    elif document.file_type == "text/csv":
        background_tasks.add_task(process_csv, document.file_path, document.id)
    elif document.file_type in ["image/jpeg", "image/png"]:
        background_tasks.add_task(process_image, document.file_path, document.id)
    
    # Log the document creation activity
    activity = Activity(
        action="upload_document",
        user_id=current_user.id,
        document_id=document.id,
        details={"type": "document_created", "file_type": document.file_type},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    print('Background task added', document.file_type)
    return {"message": "Document created successfully"}


@router.get("/documents", response_model=Dict[str, Any])
async def list_documents_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    sort_by: str = "uploadDate"
):
    # Log the document listing activity
    activity = Activity(
        action="list_documents",
        user_id=current_user.id,
        document_id=None,  # No specific document
        details={"type": "documents_listed", "search": search, "type": type, "status": status},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return list_documents(db, current_user, page, limit, search, type, status, date_from, date_to, sort_by)

@router.post("/documents/batch", responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def batch_operation_route(
    operation: str,
    document_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = batch_operation(db, operation, document_ids, current_user)
    
    # Log the batch operation activity
    for doc_id in document_ids:
        activity = Activity(
            action=f"batch_{operation}",
            user_id=current_user.id,
            document_id=doc_id,
            details={"type": "batch_operation", "operation": operation},
            created_at=datetime.utcnow()
        )
        db.add(activity)
    db.commit()
    
    return result

# New endpoint for basic document info
@router.get("/documents/{document_id}/basic", response_model=Dict[str, Any])
async def get_document_basic_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the document basic info view activity
    activity = Activity(
        action="view_document_basic",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_basic_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    return {
        "id": document.id,
        "title": document.title,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "name": document.title,
        "created_at": document.created_at.isoformat() if document.created_at else None,
        "updated_at": document.updated_at.isoformat() if document.updated_at else None
    }

# Original endpoint for full document info
@router.get("/documents/{document_id}", response_model=Dict[str, Any])
async def get_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log the full document view activity
    activity = Activity(
        action="view_document_full",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_full_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return get_document(db, document_id, current_user)

# New endpoint for document content data
@router.get("/documents/{document_id}/content-data", response_model=Dict[str, Any])
async def get_document_content_data_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the document content view activity
    activity = Activity(
        action="view_document_content",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_content_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    # Parse the document.content field into a Python dictionary
    try:
        content = json.loads(document.content) if document.content else {}
    except json.JSONDecodeError:
        content = {}  # Fallback to an empty dictionary if JSON is invalid
    
    try:
        raw_content = document.raw_content if document.raw_content else ''
    except Exception:
        raw_content = ''

    return {
        "content": content,
        "raw_content": raw_content
    }

# New endpoint for document metadata
@router.get("/documents/{document_id}/metadata", response_model=Dict[str, Any])
async def get_document_metadata_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the metadata view activity
    activity = Activity(
        action="view_metadata",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "metadata_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    metadata = db.query(DocumentMetadata).filter(
        DocumentMetadata.document_id == document_id
    ).all()

    metadata_dict = {m.key: m.value for m in metadata}

    return {
        "metadata": metadata_dict
    }

# New endpoint for document annotations
@router.get("/documents/{document_id}/annotations", response_model=Dict[str, Any])
async def get_document_annotations_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the annotations view activity
    activity = Activity(
        action="view_annotations",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "annotations_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    annotations = db.query(Annotation).filter(
        Annotation.document_id == document_id
    ).all()
    
    annotations_list = [
        {
            "id": annotation.id,
            "text": annotation.text,
            "user_id": annotation.user_id,
            "created_at": annotation.created_at.isoformat() if annotation.created_at else None
        }
        for annotation in annotations
    ]

    return {
        "annotations": annotations_list
    }

# Add annotation endpoint
@router.post("/documents/{document_id}/annotations", response_model=Dict[str, Any])
async def add_annotation_route(
    document_id: int,
    annotation_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Create new annotation
        new_annotation = Annotation(
            document_id=document_id,
            text=annotation_data.get("text", ""),
            user_id=current_user.id,
            created_at=datetime.utcnow()
        )
        db.add(new_annotation)
        db.commit()
        db.refresh(new_annotation)
        
        # Log the activity
        activity = Activity(
            action="add_annotation",
            user_id=current_user.id,
            document_id=document_id,
            details={"type": "annotation_added"},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "message": "Annotation added successfully",
            "annotation": {
                "id": new_annotation.id,
                "text": new_annotation.text,
                "user_id": new_annotation.user_id,
                "user": current_user.username,
                "created_at": new_annotation.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add annotation: {str(e)}")

# Delete annotation endpoint
@router.delete("/documents/{document_id}/annotations/{annotation_id}", response_model=Dict[str, str])
async def delete_annotation_route(
    document_id: int,
    annotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    annotation = db.query(Annotation).filter(
        Annotation.id == annotation_id,
        Annotation.document_id == document_id
    ).first()
    
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    
    try:
        db.delete(annotation)
        
        # Log the activity
        activity = Activity(
            action="delete_annotation",
            user_id=current_user.id,
            document_id=document_id,
            details={"type": "annotation_deleted"},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {"message": "Annotation deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete annotation: {str(e)}")

# New endpoint for document versions
@router.get("/documents/{document_id}/versions", response_model=Dict[str, Any])
async def get_document_versions_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the versions view activity
    activity = Activity(
        action="view_versions",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "versions_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    versions = db.query(DocumentVersion).filter(
        DocumentVersion.document_id == document_id
    ).order_by(DocumentVersion.version_number.desc()).all()
    
    versions_list = [
        {
            "id": version.id,
            "version_number": version.version_number,
            "content": version.content,
            "created_at": version.created_at.isoformat() if version.created_at else None
        }
        for version in versions
    ]

    return {
        "versions": versions_list
    }

# Add version endpoint
@router.post("/documents/{document_id}/versions", response_model=Dict[str, Any])
async def add_version_route(
    document_id: int,
    version_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Get the latest version number
        latest_version = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).first()
        
        new_version_number = 1
        if latest_version:
            new_version_number = latest_version.version_number + 1
        
        # Create new version
        new_version = DocumentVersion(
            document_id=document_id,
            version_number=new_version_number,
            content=version_data.get("content", ""),
            created_at=datetime.utcnow()
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        
        # Log the activity
        activity = Activity(
            action="add_version",
            user_id=current_user.id,
            document_id=document_id,
            details={"type": "version_added", "version_number": new_version_number},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {
            "message": "Version added successfully",
            "version": {
                "id": new_version.id,
                "version_number": new_version.version_number,
                "content": new_version.content,
                "created_at": new_version.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to add version: {str(e)}")

# Add version with file endpoint
@router.post("/documents/{document_id}/versions/file", response_model=Dict[str, Any])
async def create_document_version_with_file(
    document_id: int,
    file: UploadFile = File(...),
    notes: str = Form(""),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new version of a document with a file upload
    """
    try:
        # Check if document exists and user has access
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Get the latest version number
        latest_version = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).first()
        
        new_version_number = 1
        if latest_version:
            new_version_number = latest_version.version_number + 1
        
        # Save the previous version's file path before updating
        previous_file_path = document.file_path
        
        # Save the new file
        upload_dir = os.path.dirname(document.file_path)
        file_extension = os.path.splitext(document.file_path)[1]
        new_filename = f"{os.path.splitext(os.path.basename(document.file_path))[0]}_v{new_version_number}{file_extension}"
        new_file_path = os.path.join(upload_dir, new_filename)
        
        try:
            with open(new_file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        finally:
            file.file.close()
        
        # Create new version record with the previous file path
        new_version = DocumentVersion(
            document_id=document_id,
            version_number=new_version_number,
            content=notes,
            file_path=previous_file_path,  # Store the previous file path in the version
            created_at=datetime.utcnow()
        )
        
        # Update the document with the new file path
        document.file_path = new_file_path
        document.updated_at = datetime.utcnow()
        
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        
        return {
            "message": "Document version created successfully",
            "version": {
                "id": new_version.id,
                "version_number": new_version.version_number,
                "content": new_version.content,
                "file_path": new_version.file_path,
                "created_at": new_version.created_at.isoformat()
            }
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating document version with file: {str(e)}")
        
        raise HTTPException(status_code=500, detail=f"Failed to create document version: {str(e)}")


# View version content endpoint
@router.get("/documents/{document_id}/versions/{version_id}/content", responses={404: {"model": ErrorResponse}})
async def view_version_content_route(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    version = db.query(DocumentVersion).filter(
        DocumentVersion.id == version_id,
        DocumentVersion.document_id == document_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Log the activity
    activity = Activity(
        action="view_version",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "version_viewed", "version_id": version_id},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    # If the version has a file path, return the file
    if version.file_path:
        try:
            return StreamingResponse(
                open(version.file_path, "rb"),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"inline; filename={version.file_path.split('/')[-1]}"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve version file: {str(e)}")
    
    # Otherwise, return the content as JSON
    return {"content": version.content}

# Download version endpoint
@router.get("/documents/{document_id}/versions/{version_id}/download", responses={404: {"model": ErrorResponse}})
async def download_version_route(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    version = db.query(DocumentVersion).filter(
        DocumentVersion.id == version_id,
        DocumentVersion.document_id == document_id
    ).first()
    
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Log the activity
    activity = Activity(
        action="download_version",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "version_downloaded", "version_id": version_id},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    # If the version has a file path, return the file
    if version.file_path:
        try:
            return StreamingResponse(
                open(version.file_path, "rb"),
                media_type="application/octet-stream",
                headers={"Content-Disposition": f"attachment; filename={version.file_path.split('/')[-1]}"}
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to download version file: {str(e)}")
    
    # Otherwise, return the content as a text file
    content = version.content or ""
    return StreamingResponse(
        iter([content.encode()]),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename=version_{version.version_number}.txt"}
    )

# New endpoint for document workflows
@router.get("/documents/{document_id}/workflows", response_model=Dict[str, Any])
async def get_document_workflows_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the workflows view activity
    activity = Activity(
        action="view_workflows",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "workflows_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    workflows = db.query(DocumentWorkflow).filter(
        DocumentWorkflow.document_id == document_id
    ).all()
    
    workflows_list = [
        {
            "id": workflow.id,
            "workflow_id": workflow.workflow_id,
            "current_step": workflow.current_step,
            "status": workflow.status,
            "started_at": workflow.started_at.isoformat() if workflow.started_at else None,
            "completed_at": workflow.completed_at.isoformat() if workflow.completed_at else None,
            "timeout_at": workflow.timeout_at.isoformat() if workflow.timeout_at else None,
            "execution_history": [
                {
                    "id": history.id,
                    "step_number": history.step_number,
                    "action": history.action,
                    "performed_by": history.performed_by,
                    "performed_at": history.performed_at.isoformat() if history.performed_at else None,
                    "notes": history.notes,
                    "status": history.status
                }
                for history in workflow.execution_history
            ]
        }
        for workflow in workflows
    ]

    return {
        "workflows": workflows_list
    }

# Workflow action endpoint
@router.post("/documents/{document_id}/workflow/action", response_model=Dict[str, Any])
async def workflow_action_route(
    document_id: int,
    action_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    workflow_id = action_data.get("workflow_id")
    action = action_data.get("action")
    notes = action_data.get("notes", "")
    step_number = action_data.get("step_number")
    
    if not workflow_id or not action or not step_number:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    workflow = db.query(DocumentWorkflow).filter(
        DocumentWorkflow.id == workflow_id,
        DocumentWorkflow.document_id == document_id
    ).first()
    
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    try:
        # Create execution history entry
        history = WorkflowExecutionHistory(
            document_workflow_id=workflow_id,
            step_number=step_number,
            action=action,
            performed_by=current_user.id,
            performed_at=datetime.utcnow(),
            notes=notes,
            status="completed" if action == "approve" else "rejected"
        )
        db.add(history)
        
        # Update workflow status
        if action == "approve":
            # Move to next step
            workflow.current_step += 1
            
            # Check if this was the last step
            # This is a simplified example - in a real app, you'd check against the workflow definition
            if workflow.current_step > 4:  # Assuming 4 steps total
                workflow.status = "completed"
                workflow.completed_at = datetime.utcnow()
            else:
                # Set timeout for the next step if needed
                workflow.timeout_at = datetime.utcnow() + timedelta(days=7)  # Example: 7 day timeout
        else:  # reject
            workflow.status = "rejected"
            workflow.rejected_by = current_user.id
            workflow.rejected_at = datetime.utcnow()
        
        db.commit()
        db.refresh(workflow)
        
        # Log the activity
        activity = Activity(
            action=f"workflow_{action}",
            user_id=current_user.id,
            document_id=document_id,
            details={"type": "workflow_action", "workflow_id": workflow_id, "action": action, "step": step_number},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        # Fetch the updated workflow with execution history
        updated_workflow = db.query(DocumentWorkflow).filter(
            DocumentWorkflow.id == workflow_id
        ).first()
        
        workflow_data = {
            "id": updated_workflow.id,
            "workflow_id": updated_workflow.workflow_id,
            "current_step": updated_workflow.current_step,
            "status": updated_workflow.status,
            "started_at": updated_workflow.started_at.isoformat() if updated_workflow.started_at else None,
            "completed_at": updated_workflow.completed_at.isoformat() if updated_workflow.completed_at else None,
            "timeout_at": updated_workflow.timeout_at.isoformat() if updated_workflow.timeout_at else None,
            "execution_history": [
                {
                    "id": history.id,
                    "step_number": history.step_number,
                    "action": history.action,
                    "performed_by": history.performed_by,
                    "performed_at": history.performed_at.isoformat() if history.performed_at else None,
                    "notes": history.notes,
                    "status": history.status
                }
                for history in updated_workflow.execution_history
            ]
        }
        
        return {
            "message": f"Workflow {action} action completed successfully",
            "workflow": workflow_data
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to perform workflow action: {str(e)}")

# New endpoint for document activities
@router.get("/documents/{document_id}/activities", response_model=Dict[str, Any])
async def get_document_activities_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    activities = db.query(Activity).filter(
        Activity.document_id == document_id
    ).order_by(Activity.created_at.desc()).all()
    
    activities_list = [
        {
            "action": activity.action,
            "user": activity.user.username,
            "timestamp": activity.created_at.isoformat() if activity.created_at else None,
            "type": activity.details.get("type") if activity.details else None
        }
        for activity in activities
    ]

    return {
        "activities": activities_list
    }

# New endpoint for document AI analysis
@router.get("/documents/{document_id}/ai-analysis", response_model=Dict[str, Any])
async def get_document_ai_analysis_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # [Activity logging code remains the same...]

    ai_analysis = db.query(DocumentAIAnalysis).filter(
        DocumentAIAnalysis.document_id == document_id
    ).first()

    if not ai_analysis:
        return {"aiAnalysis": []}

    results = ai_analysis.results
    
    # Handle case where results is a JSON string
    if isinstance(results, str):
        try:
            results = json.loads(results)
        except json.JSONDecodeError:
            results = []

    # Ensure we always return a list of dicts
    if results is None:
        results = []
    elif isinstance(results, dict):  # If single dict, wrap in list
        results = [results]
    elif not isinstance(results, list):  # If not list, make empty list
        results = []
    
    # Filter to only include dict items
    results = [r for r in results if isinstance(r, dict)]

    return {
        "aiAnalysis": results
    }

# New endpoint for related documents
@router.get("/documents/{document_id}/related", response_model=Dict[str, Any])
async def get_document_related_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Log the related documents view activity
    activity = Activity(
        action="view_related_documents",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "related_documents_viewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()

    related_documents = db.query(DocumentModel).join(
        RelatedDocument, RelatedDocument.related_document_id == DocumentModel.id
    ).filter(
        RelatedDocument.document_id == document_id
    ).all()
    
    related_documents_list = [
        {
            "id": doc.id,
            "name": doc.title,
            "type": doc.file_type,
            "size": f"{doc.file_size / 1024 / 1024:.2f} MB"
        }
        for doc in related_documents
    ]

    return {
        "relatedDocuments": related_documents_list
    }

# Existing endpoints
@router.get("/documents/{document_id}/content", responses={404: {"model": ErrorResponse}})
async def get_document_content_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log the document content download activity
    activity = Activity(
        action="view_document_content",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_content_accessed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return get_document_content(db, document_id, current_user)

@router.get("/documents/{document_id}/preview", responses={404: {"model": ErrorResponse}})
async def get_document_preview_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log the document preview activity
    activity = Activity(
        action="preview_document",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_previewed"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return get_document_content(db, document_id, current_user)

@router.get("/documents/{document_id}/download", responses={404: {"model": ErrorResponse}})
async def download_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Log the document download activity
    activity = Activity(
        action="download_document",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_downloaded"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return download_document(db, document_id, current_user)

@router.post("/documents/{document_id}/metadata", response_model=Dict[str, Any])
async def update_document_metadata_route(
    document_id: int,
    metadata: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = update_document_metadata(db, document_id, metadata, current_user)
    
    # Log the metadata update activity
    activity = Activity(
        action="update_metadata",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "metadata_updated", "fields": list(metadata.keys())},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return result

@router.patch("/documents/{document_id}/content", response_model=Dict[str, str])
async def update_document_content_route(
    document_id: int,
    content_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        # Update the document content
        document.content = json.dumps(content_data.get("content", {}))
        db.commit()
        
        # Log the activity
        activity = Activity(
            action="update_content",
            user_id=current_user.id,
            document_id=document_id,
            details={"type": "content_update"},
            created_at=datetime.utcnow()
        )
        db.add(activity)
        db.commit()
        
        return {"message": "Document content updated successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update document content: {str(e)}")

@router.delete("/documents/{document_id}", response_model=Dict[str, str], responses={404: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def delete_document_route(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = delete_document(db, document_id, current_user)
    
    # Log the document deletion activity
    activity = Activity(
        action="delete_document",
        user_id=current_user.id,
        document_id=document_id,
        details={"type": "document_deleted"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return result

@router.post("/documents/cleanup", response_model=Dict[str, str])
async def cleanup_deleted_documents_route(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = cleanup_deleted_documents(db, current_user)
    
    # Log the cleanup activity
    activity = Activity(
        action="cleanup_documents",
        user_id=current_user.id,
        document_id=None,  # No specific document
        details={"type": "documents_cleaned_up"},
        created_at=datetime.utcnow()
    )
    db.add(activity)
    db.commit()
    
    return result

# app/crud/document_crud.py

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List, Optional, Dict, Any
import os
import json
import shutil
import uuid
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from app.models import Document as DocumentModel, DocumentMetadata, Workflow, DocumentWorkflow, Annotation, DocumentVersion, Activity, DocumentAIAnalysis, RelatedDocument,WorkflowExecutionHistory
from app.schemas.document import DocumentResponse  
from sqlalchemy import or_, desc
from fastapi.responses import StreamingResponse
from pydantic import ValidationError
import json
import traceback
from sqlalchemy import String
logger = logging.getLogger(__name__)

# Configuration Constants
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_FILE_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # Excel (XLSX)
    "application/vnd.ms-excel",  # Excel (XLS)
    "text/csv"  # CSV files
]
def validate_file(file):
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Allowed types are: {', '.join(ALLOWED_FILE_TYPES)}"
        )

def save_upload_file(file, destination):
    try:
        with open(destination, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        logger.error(f"Error saving file {destination}: {e}")
        raise HTTPException(status_code=500, detail="File upload failed")
    finally:
        file.file.close()

def delete_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError as e:
        logger.error(f"Error deleting file {path}: {e}")

def format_filename(pattern: str, user_id: int, company_id: int, original_filename: str) -> str:
    file_extension = os.path.splitext(original_filename)[1]
    formatted_name = pattern.format(
        timestamp=datetime.now().strftime("%Y%m%d_%H%M%S"),
        user_id=user_id,
        company_id=company_id,
        original_name=os.path.splitext(original_filename)[0],
        unique_id=str(uuid.uuid4())[:8],
        extension=file_extension,
    )
    return formatted_name

def parse_metadata(metadata: str) -> Dict[str, Any]:
    try:
        return json.loads(metadata)
    except json.JSONDecodeError as e:
        logger.error(f"Invalid metadata JSON: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid metadata format")
def create_document(db: Session, file, metadata: str, current_user):
    file_location = None
    try:
        validate_file(file)
        
        file_size = len(file.file.read())
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size exceeds limit of {MAX_FILE_SIZE / 1024 / 1024} MB"
            )
        
        metadata_dict = parse_metadata(metadata)
        
        upload_dir = os.path.join(UPLOAD_DIR, "documents")
        os.makedirs(upload_dir, exist_ok=True)
        
        filename_pattern = "{timestamp}_{user_id}_{company_id}_{original_name}_{unique_id}{extension}"
        formatted_filename = format_filename(
            pattern=filename_pattern,
            user_id=current_user.id,
            company_id=current_user.company_id,
            original_filename=file.filename,
        )
        
        file_location = os.path.join(upload_dir, formatted_filename)
        
        save_upload_file(file, file_location)
        
        db_document = DocumentModel(
            title=metadata_dict.get('title', file.filename),
            file_path=file_location,
            file_type=file.content_type,
            file_size=file_size,
            owner_id=current_user.id,
            company_id=int(current_user.company_id),
            content=metadata_dict.get('description', ''),
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # Add metadata
        for key, value in metadata_dict.items():
            if key not in ['title', 'description']:
                db_metadata = DocumentMetadata(
                    document_id=db_document.id,
                    key=key,
                    value=str(value)
                )
                db.add(db_metadata)
        
        # Create initial version automatically
        initial_version = DocumentVersion(
            document_id=db_document.id,
            version_number=1,
            content="Initial document version",
            file_path=file_location,
            created_at=datetime.utcnow()
        )
        db.add(initial_version)
        
        # Set up workflow if needed
        workflow = db.query(Workflow).filter(
            Workflow.name == "Document Approval Workflow",
            Workflow.company_id == current_user.company_id
        ).first()

        if workflow:
            # Create document workflow starting at step 2
            document_workflow = DocumentWorkflow(
                document_id=db_document.id,
                workflow_id=workflow.id,
                current_step=2,  # Start at step 2 (Review)
                status="in_progress",
                started_at=datetime.utcnow(),
                timeout_at=datetime.utcnow() + timedelta(hours=24)
            )
            db.add(document_workflow)
            
            # Create execution history record for the completed upload step
            upload_history = WorkflowExecutionHistory(
                document_workflow_id=document_workflow.id,
                step_number=1,  # Upload step
                action="Completed Upload",
                performed_by=current_user.id,
                performed_at=datetime.utcnow(),
                notes="Document uploaded successfully",
                status="completed"
            )
            db.add(upload_history)
        
        db.commit()
        return db_document
    
    except ValidationError as e:
        logger.error(f"Validation Error: {e}")
        if file_location:
            delete_file(file_location)
        raise HTTPException(status_code=422, detail=str(e))
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error: {str(e)}")
        logger.error(traceback.format_exc())
        if file_location:
            delete_file(file_location)
        db.rollback()
        raise HTTPException(status_code=500, detail="Database operation failed")
    
    except HTTPException:
        if file_location:
            delete_file(file_location)
        raise
    
    except Exception as e:
        logger.error(f"Unexpected Error: {str(e)}")
        logger.error(traceback.format_exc())
        if file_location:
            delete_file(file_location)
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

def list_documents(db: Session, current_user, page: int, limit: int, search: Optional[str], type: Optional[str], status: Optional[str], date_from: Optional[str], date_to: Optional[str], sort_by: str):
    try:
        query = db.query(DocumentModel).filter(
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        )

        if search:
            # Search in title and metadata values (as strings)
            # For JSON content, we'll need to cast it to text for searching
            query = query.filter(or_(
                DocumentModel.title.ilike(f"%{search}%"),
                DocumentModel.content.cast(String).ilike(f"%{search}%"),
                DocumentMetadata.value.ilike(f"%{search}%")
            )).join(DocumentMetadata, isouter=True)

        if type:
            query = query.filter(DocumentModel.file_type == type)

        if status:
            query = query.join(DocumentWorkflow).filter(DocumentWorkflow.status == status)

        if date_from:
            query = query.filter(DocumentModel.created_at >= date_from)

        if date_to:
            query = query.filter(DocumentModel.created_at <= date_to)

        if sort_by == "name":
            query = query.order_by(DocumentModel.title)
        elif sort_by == "size":
            query = query.order_by(DocumentModel.file_size)
        elif sort_by == "type":
            query = query.order_by(DocumentModel.file_type)
        else:
            query = query.order_by(desc(DocumentModel.created_at))

        total = query.count()
        documents = query.offset((page - 1) * limit).limit(limit).all()

        document_responses = []
        for doc in documents:
            workflow = db.query(DocumentWorkflow).filter(
                DocumentWorkflow.document_id == doc.id
            ).order_by(DocumentWorkflow.id.desc()).first()
            
            workflow_status = workflow.status if workflow else "Not Started"
            
            doc_response = DocumentResponse.from_orm(doc)
            doc_response.workflow_status = workflow_status
            document_responses.append(doc_response)

        return {
            "documents": document_responses,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error in list_documents: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while retrieving documents")

def batch_operation(db: Session, operation: str, document_ids: List[int], current_user):
    try:
        if operation not in ["delete", "archive", "share"]:
            raise HTTPException(status_code=400, detail="Invalid operation")

        documents = db.query(DocumentModel).filter(
            DocumentModel.id.in_(document_ids),
            DocumentModel.company_id == current_user.company_id
        ).all()

        if len(documents) != len(document_ids):
            raise HTTPException(status_code=404, detail="One or more documents not found")

        if operation == "delete":
            for doc in documents:
                doc.is_deleted = True
                doc.updated_at = datetime.utcnow()
        elif operation == "archive":
            logger.info(f"Archiving documents: {document_ids}")
        elif operation == "share":
            logger.info(f"Sharing documents: {document_ids}")

        db.commit()
        return {"message": f"Batch {operation} operation completed successfully"}
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in batch_operation: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error performing batch operation")


def get_document(db: Session, document_id: int, current_user):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    # Parse the document.content field into a Python dictionary
    try:
        content = json.loads(document.content) if document.content else {}
        print('Content:', content)
    except json.JSONDecodeError:
        content = {}  # Fallback to an empty dictionary if JSON is invalid
    
    try:
        raw_content = document.raw_content if document.raw_content else ''
    except json.JSONDecodeError:
        raw_content = ''

    # Use the SQLAlchemy model for the query
    metadata = db.query(DocumentMetadata).filter(
        DocumentMetadata.document_id == document_id
    ).all()

    metadata_dict = {m.key: m.value for m in metadata}

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

    ai_analysis = db.query(DocumentAIAnalysis).filter(
        DocumentAIAnalysis.document_id == document_id
    ).first()
    print('AI Analysis:', ai_analysis)

    # Initialize an empty dictionary for AI analysis results
    ai_analysis_dict = {}

    # Check if ai_analysis exists and results is a dictionary
    if ai_analysis and isinstance(ai_analysis.results, dict):
        # Iterate over the keys and values in ai_analysis.results
        for key, value in ai_analysis.results.items():
            # Add each key-value pair to ai_analysis_dict
            ai_analysis_dict[key] = value
    else:
        # If ai_analysis is None or results is not a dictionary, initialize with an empty dictionary
        ai_analysis_dict = {}

    print('AI Analysis Dict:', ai_analysis_dict)

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
        "id": document.id,
        "title": document.title,
        "file_type": document.file_type,
        "file_size": document.file_size,
        "name": document.title,
        "metadata": metadata_dict,
        "annotations": annotations_list,
        "versions": versions_list,
        "workflows": workflows_list,
        "activityLog": activities_list,
        "aiAnalysis": [ai_analysis_dict],  # Wrap the AI analysis in a list to match the frontend's expected format
        "relatedDocuments": related_documents_list,
        "content": content,
        "raw_content": raw_content
    }

def get_document_content(db: Session, document_id: int, current_user):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    def iterfile():
        with open(document.file_path, "rb") as file:
            yield from file

    return StreamingResponse(iterfile(), media_type=document.file_type)

def download_document(db: Session, document_id: int, current_user):
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.company_id == current_user.company_id,
        DocumentModel.is_deleted == False
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    def iterfile():
        with open(document.file_path, "rb") as file:
            yield from file

    # Create a filename without path components for security
    filename = os.path.basename(document.title)
    
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }

    return StreamingResponse(
        iterfile(), 
        media_type=document.file_type,
        headers=headers
    )
def update_document_metadata(db: Session, document_id: int, metadata: Dict[str, Any], current_user):
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        for key, value in metadata.items():
            existing_metadata = db.query(DocumentMetadata).filter(
                DocumentMetadata.document_id == document_id,
                DocumentMetadata.key == key
            ).first()

            if existing_metadata:
                existing_metadata.value = str(value)
            else:
                new_metadata = DocumentMetadata(
                    document_id=document_id,
                    key=key,
                    value=str(value)
                )
                db.add(new_metadata)

        document.updated_at = datetime.utcnow()
        db.commit()

        return {"message": "Metadata updated successfully", "metadata": metadata}
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in update_document_metadata: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error updating metadata")

def delete_document(db: Session, document_id: int, current_user):
    try:
        document = db.query(DocumentModel).filter(
            DocumentModel.id == document_id,
            DocumentModel.company_id == current_user.company_id,
            DocumentModel.is_deleted == False
        ).first()

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        document.is_deleted = True
        document.updated_at = datetime.utcnow()
        db.commit()

        return {"message": "Document deleted successfully"}
    except SQLAlchemyError as e:
        logger.error(f"Database Error in delete_document: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error deleting document")

def cleanup_deleted_documents(db: Session, current_user):
    try:
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        deleted_documents = db.query(DocumentModel).filter(
            DocumentModel.is_deleted == True,
            DocumentModel.updated_at < thirty_days_ago,
            DocumentModel.company_id == current_user.company_id
        ).all()

        deleted_count = 0
        for document in deleted_documents:
            db.query(DocumentMetadata).filter(
                DocumentMetadata.document_id == document.id
            ).delete()

            if os.path.exists(document.file_path):
                try:
                    os.remove(document.file_path)
                except OSError as e:
                    logger.error(f"Error deleting file {document.file_path}: {e}")

            db.delete(document)
            deleted_count += 1

        db.commit()
        return {
            "message": f"Successfully cleaned up {deleted_count} documents",
            "details": f"Removed documents deleted before {thirty_days_ago}"
        }
    
    except SQLAlchemyError as e:
        logger.error(f"Database Error in cleanup_documents: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error cleaning up documents")
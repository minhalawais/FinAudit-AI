from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime
import traceback
from app.database import get_db
from app.models import User, Document, DocumentVersion
from app.routers.auth import get_current_user
import os
import shutil
import logging
from fastapi.responses import StreamingResponse
from fastapi.responses import FileResponse

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/documents/{document_id}/versions", response_model=Dict[str, Any])
async def create_document_version(
    document_id: int,
    content: str = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new version of a document (without file upload)
    """
    try:
        # Check if document exists and user has access
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
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
        
        # Create new version - use the current document's file_path
        new_version = DocumentVersion(
            document_id=document_id,
            version_number=new_version_number,
            content=content,
            file_path=document.file_path,  # Store the current file path
            created_at=datetime.utcnow()
        )
        
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
        logger.error(f"Error creating document version: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create document version: {str(e)}")

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
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
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
        logger.error(f"Error creating document version with file: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to create document version: {str(e)}")

@router.get("/documents/{document_id}/versions", response_model=Dict[str, Any])
async def get_document_versions(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all versions of a document
    """
    try:
        # Check if document exists and user has access
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        versions = db.query(DocumentVersion).filter(
            DocumentVersion.document_id == document_id
        ).order_by(DocumentVersion.version_number.desc()).all()
        
        versions_list = [
            {
                "id": version.id,
                "version_number": version.version_number,
                "content": version.content,
                "file_path": version.file_path,
                "created_at": version.created_at.isoformat() if version.created_at else None
            }
            for version in versions
        ]
        
        return {
            "versions": versions_list
        }
    except Exception as e:
        logger.error(f"Error getting document versions: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get document versions: {str(e)}")

@router.get("/documents/{document_id}/versions/{version_id}/content", response_model=Dict[str, Any])
async def get_version_content(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the content of a specific document version
    """
    try:
        print('Getting version content')
        # Check if document exists and user has access
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        version = db.query(DocumentVersion).filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id
        ).first()
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        if not version.file_path or not os.path.exists(version.file_path):
            raise HTTPException(status_code=404, detail="Version file not found")
        
        def iterfile():
            with open(version.file_path, "rb") as file:
                yield from file
        
        # Get the file type from the document
        file_type = document.file_type
        
        # Create a filename without path components for security
        filename = os.path.basename(version.file_path)
        
        headers = {
            "Content-Disposition": f'inline; filename="{filename}"'
        }
        
        return StreamingResponse(
            iterfile(), 
            media_type=file_type,
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error getting version content: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get version content: {str(e)}")
    
@router.get("/documents/{document_id}/versions/{version_id}/download")
async def download_version(
    document_id: int,
    version_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download a specific document version
    """
    try:
        print('Downloading version content')
        # Check if document exists and user has access
        document = db.query(Document).filter(
            Document.id == document_id,
            Document.company_id == current_user.company_id,
            Document.is_deleted == False
        ).first()
        
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        version = db.query(DocumentVersion).filter(
            DocumentVersion.id == version_id,
            DocumentVersion.document_id == document_id
        ).first()
        
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
        
        if not version.file_path or not os.path.exists(version.file_path):
            raise HTTPException(status_code=404, detail="Version file not found")
        
        # Create a filename without path components for security
        filename = os.path.basename(version.file_path)
        
        # Ensure filename has extension
        if '.' not in filename:
            # If document has a file_type, use it to add extension
            if document.file_type:
                ext = document.file_type.split('/')[-1]
                filename = f"{filename}.{ext}"
        
        headers = {
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
        
        return FileResponse(
            path=version.file_path,
            media_type=document.file_type if document.file_type else "application/octet-stream",
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error downloading version content: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to download version content: {str(e)}")
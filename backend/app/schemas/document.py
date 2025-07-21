from datetime import datetime
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any

class DocumentBase(BaseModel):
    title: str
    file_type: str
    file_size: float
    owner_id: int
    company_id: int


class DocumentCreate(DocumentBase):
    file_path: str


class Document(DocumentBase):
    id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
class DocumentMetadataBase(BaseModel):
    """
    Base model for document metadata
    """
    key: str = Field(..., description="Metadata key", min_length=1, max_length=255)
    value: str = Field(..., description="Metadata value", min_length=1, max_length=1024)

class DocumentMetadata(DocumentMetadataBase):
    """
    Full document metadata model including document ID
    """
    id: int
    document_id: int

    class Config:
        from_attributes = True
        
class DocumentResponse(Document):
    workflow_status: Optional[str] = None
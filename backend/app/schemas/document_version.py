from pydantic import BaseModel
from datetime import datetime


class DocumentVersionBase(BaseModel):
    version_number: int
    file_path: str
    created_by_id: int
    changes: str


class DocumentVersionCreate(DocumentVersionBase):
    pass


class DocumentVersion(DocumentVersionBase):
    id: int
    document_id: int
    created_at: datetime

    class Config:
        orm_mode = True

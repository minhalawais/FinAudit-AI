from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime


class ActivityBase(BaseModel):
    action: str
    user_id: int
    document_id: int
    details: Dict[str, Any]


class ActivityCreate(ActivityBase):
    pass


class Activity(ActivityBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

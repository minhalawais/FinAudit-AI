from pydantic import BaseModel
from datetime import datetime

class CompanyBase(BaseModel):
    name: str
    address: str
    industry: str
    subscription_plan: str

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


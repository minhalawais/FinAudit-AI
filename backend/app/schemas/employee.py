from pydantic import BaseModel, EmailStr
from datetime import datetime


class EmployeeBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    position: str
    department: str
    company_id: int
    hire_date: datetime


class EmployeeCreate(EmployeeBase):
    pass


class Employee(EmployeeBase):
    id: int

    class Config:
        orm_mode = True

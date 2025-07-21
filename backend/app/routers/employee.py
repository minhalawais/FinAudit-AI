from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.employee import EmployeeCreate, Employee
from app.models import Employee as EmployeeModel

# In `app/routers/employee.py`
router = APIRouter(
    prefix='/employees',
    tags=['employees']
)


@router.post("/employees/", response_model=Employee)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = EmployeeModel(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.get("/employees/", response_model=List[Employee])
def list_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    employees = db.query(EmployeeModel).offset(skip).limit(limit).all()
    return employees


@router.get("/employees/{employee_id}", response_model=Employee)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/employees/{employee_id}", response_model=Employee)
def update_employee(employee_id: int, employee: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for key, value in employee.dict().items():
        setattr(db_employee, key, value)

    db.commit()
    db.refresh(db_employee)
    return db_employee


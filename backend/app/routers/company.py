from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.company import CompanyCreate, Company
from app.models import Company as CompanyModel

# In `app/routers/company.py`
router = APIRouter(
    prefix='/companies',
    tags=['companies']
)


@router.post("/companies/", response_model=Company)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    db_company = CompanyModel(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


@router.get("/companies/", response_model=List[Company])
def list_companies(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    companies = db.query(CompanyModel).offset(skip).limit(limit).all()
    return companies


@router.get("/companies/{company_id}", response_model=Company)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/companies/{company_id}", response_model=Company)
def update_company(company_id: int, company: CompanyCreate, db: Session = Depends(get_db)):
    db_company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    for key, value in company.dict().items():
        setattr(db_company, key, value)

    db.commit()
    db.refresh(db_company)
    return db_company


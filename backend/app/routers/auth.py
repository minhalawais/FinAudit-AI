from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from jose import JWTError, jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import logging

from app.database import get_db
from app.models import User, UserRole

router = APIRouter()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None  # Include role in the token response

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    company_id: Optional[int] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: UserRole
    f_name: str
    l_name: str
    phone_number: Optional[str] = None
    company_id: int

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError as e:
        logger.error(f"Error verifying password: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    try:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except ValueError as e:
        logger.error(f"Error hashing password: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing password")

def authenticate_user(db: Session, username: str, password: str):
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            return False
        if not verify_password(password, user.hashed_password):
            return False
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error during authentication: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=200)
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except JWTError as e:
        logger.error(f"Error creating access token: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create access token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        company_id: int = payload.get("company_id")
        print('Payload:', payload)
        if username is None or user_id is None or company_id is None:
            raise credentials_exception
        token_data = TokenData(username=username, user_id=user_id, company_id=company_id)
    except JWTError as e:
        print('JWTError:', e)
        logger.error(f"JWT decode error: {str(e)}")
        raise credentials_exception
    
    try:
        user = db.query(User).filter(User.id == token_data.user_id).first()
        if user is None:
            raise credentials_exception
        return user
    except SQLAlchemyError as e:
        logger.error(f"Database error while fetching user: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": user.username, 
                "user_id": user.id, 
                "company_id": user.company_id,
                "role": user.role.value  # Add role to token
            },
            expires_delta=access_token_expires
        )
        return {
            "access_token": access_token, 
            "token_type": "bearer",
            "role": user.role.value  # Also return role in response
        }
    except HTTPException as e:
        logger.error(f"HTTP exception during login: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(user: UserCreate, db: Session = Depends(get_db)):
    try:
        db_user = db.query(User).filter(User.username == user.username).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Username already registered")
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        hashed_password = get_password_hash(user.password)
        db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password,
            role=user.role,
            f_name=user.f_name,
            l_name=user.l_name,
            phone_number=user.phone_number,
            company_id=user.company_id
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return {"message": "User created successfully"}
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        logger.error(f"Database error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail="Error creating user")
    except Exception as e:
        logger.error(f"Unexpected error during signup: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@router.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


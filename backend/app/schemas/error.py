# app/schemas/error.py

from pydantic import BaseModel
from typing import Optional

class ErrorResponse(BaseModel):
    """
    Standard error response model for API errors.
    """
    error: str
    details: Optional[str] = None
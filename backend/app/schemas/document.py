"""
Document schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class DocumentResponse(BaseModel):
    """Document response schema"""

    id: int
    user_id: int
    title: str
    filename: str
    file_path: str
    file_type: str
    file_size: int
    category: Optional[str] = None
    summary: Optional[str] = None
    extracted_text: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentUploadResponse(BaseModel):
    """Document upload response schema"""

    message: str
    document: DocumentResponse



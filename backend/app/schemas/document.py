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


class DocumentUpdateRequest(BaseModel):
    """Document update request schema"""

    title: Optional[str] = None
    category: Optional[str] = None


class DocumentListResponse(BaseModel):
    """Document list response with pagination"""

    documents: list[DocumentResponse]
    total: int
    limit: int
    offset: int


class SemanticSearchRequest(BaseModel):
    """Semantic search request schema"""

    query: str
    limit: Optional[int] = 10
    threshold: Optional[float] = 0.7


class SemanticSearchResult(BaseModel):
    """Semantic search result with similarity score"""

    document: DocumentResponse
    similarity: float


class SemanticSearchResponse(BaseModel):
    """Semantic search response schema"""

    results: list[SemanticSearchResult]
    query: str
    total: int



"""
Document model
"""

from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
import enum
from app.core.database import Base


class FileType(str, enum.Enum):
    """File type enum"""
    PDF = "pdf"
    IMAGE = "image"
    DOCX = "docx"


class DocumentStatus(str, enum.Enum):
    """Document status enum"""
    UPLOADING = "uploading"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Document(Base):
    """Document model"""
    
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(Enum(FileType), nullable=False)
    file_size = Column(BigInteger, nullable=False)  # bytes
    category = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI embedding dimension
    status = Column(Enum(DocumentStatus), default=DocumentStatus.UPLOADING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="documents")
    chat_messages = relationship("ChatMessage", back_populates="document", cascade="all, delete-orphan")


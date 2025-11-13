"""
Document repository for database operations
"""

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document


class DocumentRepository:
    """Document repository class"""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, document_data: dict) -> Document:
        """Create a new document record"""
        document = Document(**document_data)
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document

    async def get_by_id(self, document_id: int) -> Optional[Document]:
        """Get document by ID"""
        result = await self.session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: int, limit: int = 20, offset: int = 0):
        """List documents for a user with pagination"""
        result = await self.session.execute(
            select(Document)
            .where(Document.user_id == user_id)
            .order_by(Document.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return result.scalars().all()

    async def update(self, document_id: int, update_data: dict) -> Optional[Document]:
        """Update document by ID"""
        document = await self.get_by_id(document_id)
        if not document:
            return None
        
        for key, value in update_data.items():
            setattr(document, key, value)
        
        await self.session.commit()
        await self.session.refresh(document)
        return document



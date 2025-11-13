"""
Document repository for database operations
"""

from typing import Optional, List
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentStatus, FileType


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

    async def list_by_user(
        self,
        user_id: int,
        limit: int = 20,
        offset: int = 0,
        status: Optional[DocumentStatus] = None,
        file_type: Optional[FileType] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> List[Document]:
        """List documents for a user with pagination, filtering, and sorting"""
        query = select(Document).where(Document.user_id == user_id)
        
        # Apply filters
        if status:
            query = query.where(Document.status == status)
        if file_type:
            query = query.where(Document.file_type == file_type)
        if category:
            query = query.where(Document.category == category)
        if search:
            search_filter = or_(
                Document.title.ilike(f"%{search}%"),
                Document.filename.ilike(f"%{search}%"),
                Document.extracted_text.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        # Apply sorting
        sort_column = getattr(Document, sort_by, Document.created_at)
        if sort_order.lower() == "asc":
            query = query.order_by(sort_column.asc())
        else:
            query = query.order_by(sort_column.desc())
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        return result.scalars().all()
    
    async def count_by_user(
        self,
        user_id: int,
        status: Optional[DocumentStatus] = None,
        file_type: Optional[FileType] = None,
        category: Optional[str] = None,
        search: Optional[str] = None
    ) -> int:
        """Count documents for a user with filters"""
        query = select(func.count(Document.id)).where(Document.user_id == user_id)
        
        # Apply filters
        if status:
            query = query.where(Document.status == status)
        if file_type:
            query = query.where(Document.file_type == file_type)
        if category:
            query = query.where(Document.category == category)
        if search:
            search_filter = or_(
                Document.title.ilike(f"%{search}%"),
                Document.filename.ilike(f"%{search}%"),
                Document.extracted_text.ilike(f"%{search}%")
            )
            query = query.where(search_filter)
        
        result = await self.session.execute(query)
        return result.scalar_one()

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
    
    async def delete(self, document_id: int) -> bool:
        """Delete document by ID"""
        document = await self.get_by_id(document_id)
        if not document:
            return False
        
        await self.session.delete(document)
        await self.session.commit()
        return True



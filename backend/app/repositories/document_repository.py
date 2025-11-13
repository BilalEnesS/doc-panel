"""
Document repository for database operations
"""

import logging
from typing import Optional, List
from sqlalchemy import select, func, and_, or_, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.document import Document, DocumentStatus, FileType

logger = logging.getLogger(__name__)


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
    
    async def semantic_search(
        self,
        user_id: int,
        query_embedding: list[float],
        limit: int = 10,
        threshold: float = 0.7
    ) -> List[tuple[Document, float]]:
        """
        Semantic search using vector similarity
        
        Args:
            user_id: User ID to filter documents
            query_embedding: Query embedding vector
            limit: Maximum number of results
            threshold: Minimum similarity threshold (0-1)
        
        Returns:
            List of tuples (document, similarity_score)
        """
        try:
            # Try to use pgvector for semantic search
            import numpy as np
            from pgvector.sqlalchemy import Vector
            
            # Convert list to string format for pgvector
            query_vec_str = '[' + ','.join(map(str, query_embedding)) + ']'
            
            # Use raw SQL for pgvector cosine similarity
            # 1 - cosine_distance = cosine_similarity
            sql_query = text("""
                SELECT id, user_id, title, filename, file_path, file_type, file_size,
                       category, summary, extracted_text, status, created_at, updated_at,
                       1 - (embedding <=> CAST(:query_vec AS vector)) AS similarity
                FROM documents
                WHERE user_id = :user_id
                  AND embedding IS NOT NULL
                  AND status = 'completed'
                  AND 1 - (embedding <=> CAST(:query_vec AS vector)) >= :threshold
                ORDER BY embedding <=> CAST(:query_vec AS vector)
                LIMIT :limit
            """)
            
            result = await self.session.execute(
                sql_query,
                {
                    "query_vec": query_vec_str,
                    "user_id": user_id,
                    "threshold": threshold,
                    "limit": limit
                }
            )
            
            results = []
            for row in result:
                # Reconstruct document object from row
                # Handle enum types properly
                file_type_enum = FileType(row.file_type) if isinstance(row.file_type, str) else row.file_type
                status_enum = DocumentStatus(row.status) if isinstance(row.status, str) else row.status
                
                doc = Document(
                    id=row.id,
                    user_id=row.user_id,
                    title=row.title,
                    filename=row.filename,
                    file_path=row.file_path,
                    file_type=file_type_enum,
                    file_size=row.file_size,
                    category=row.category,
                    summary=row.summary,
                    extracted_text=row.extracted_text,
                    status=status_enum,
                    created_at=row.created_at,
                    updated_at=row.updated_at
                )
                similarity = float(row.similarity)
                results.append((doc, similarity))
            
            return results
            
        except Exception as e:
            # Fallback to text-based search if pgvector is not available
            logger.warning(f"pgvector search failed: {str(e)}", exc_info=True)
            # Fallback: Use text search instead
            try:
                return await self._fallback_text_search(user_id, query_embedding, limit)
            except Exception as fallback_error:
                logger.error(f"Fallback search also failed: {str(fallback_error)}", exc_info=True)
                # Return empty results if both fail
                return []
    
    async def _fallback_text_search(
        self,
        user_id: int,
        query_embedding: list[float],
        limit: int
    ) -> List[tuple[Document, float]]:
        """
        Fallback text-based search when pgvector is not available
        Returns all completed documents (since we can't do vector similarity without pgvector)
        """
        logger.info("Using fallback text search (pgvector not available)")
        
        # Since we can't do vector similarity, return all completed documents
        # In a real scenario, you might want to use text-based search or
        # implement cosine similarity in Python (slower but works)
        query = select(Document).where(
            and_(
                Document.user_id == user_id,
                Document.status == DocumentStatus.COMPLETED,
                Document.extracted_text.isnot(None)
            )
        ).order_by(Document.created_at.desc()).limit(limit)
        
        result = await self.session.execute(query)
        documents = result.scalars().all()
        
        # Return with a default similarity score of 0.5
        # (since we can't calculate actual similarity without pgvector)
        return [(doc, 0.5) for doc in documents]



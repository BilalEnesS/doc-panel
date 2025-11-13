"""
Document service for handling business logic
"""

import os
import logging
import asyncio
from pathlib import Path
from typing import Optional
from uuid import uuid4

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.document import Document, DocumentStatus, FileType
from app.models.user import User
from app.repositories.document_repository import DocumentRepository
from app.services.ocr_service import ocr_service
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class DocumentService:
    """Document service class"""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = DocumentRepository(session)

    async def upload_document(
        self,
        *,
        user: User,
        title: str,
        file: UploadFile,
        category: Optional[str] = None,
    ):
        """
        Handle document upload

        Args:
            user: Authenticated user
            title: Document title
            file: Uploaded file
            category: Optional document category

        Returns:
            Created document instance
        """
        self._validate_file_extension(file)
        file_extension = self._get_file_extension(file)
        file_type = self._map_extension_to_file_type(file_extension)

        upload_path, relative_path, stored_filename = await self._save_file(
            user_id=user.id,
            file=file,
            extension=file_extension,
        )

        original_filename = file.filename or stored_filename

        document_data = {
            "user_id": user.id,
            "title": title,
            "filename": original_filename,
            "file_path": str(relative_path),
            "file_type": file_type,
            "file_size": upload_path.stat().st_size,
            "category": category,
            "status": DocumentStatus.PROCESSING,
        }

        document = await self.repository.create(document_data)
        return document

    async def process_ocr(self, document_id: int) -> None:
        """
        Process OCR for a document asynchronously
        
        Args:
            document_id: Document ID to process
        """
        logger.info(f"Starting OCR processing for document ID: {document_id}")
        
        # Create new session for background task
        async with AsyncSessionLocal() as session:
            try:
                repository = DocumentRepository(session)
                
                # Get document
                document = await repository.get_by_id(document_id)
                if not document:
                    logger.warning(f"Document {document_id} not found")
                    return
                
                logger.info(f"Document found: {document.title}, type: {document.file_type}")
                
                # Update status to processing
                await repository.update(document_id, {"status": DocumentStatus.PROCESSING})
                logger.info(f"Document {document_id} status updated to PROCESSING")
                
                # Get full file path
                file_path = Path(settings.UPLOAD_DIR) / document.file_path
                logger.info(f"Looking for file at: {file_path}")
                
                if not file_path.exists():
                    error_msg = f"File not found at path: {file_path}"
                    logger.error(error_msg)
                    await repository.update(
                        document_id,
                        {
                            "status": DocumentStatus.FAILED,
                            "extracted_text": error_msg
                        }
                    )
                    return
                
                logger.info(f"File found, starting OCR extraction...")
                
                # Extract text using OCR (run in thread pool to avoid blocking)
                try:
                    extracted_text = await asyncio.to_thread(
                        ocr_service.extract_text_sync,
                        file_path=file_path,
                        file_type=document.file_type
                    )
                    
                    if not extracted_text or len(extracted_text.strip()) == 0:
                        extracted_text = "No text could be extracted from the document."
                        logger.warning(f"No text extracted from document {document_id}")
                    
                    logger.info(f"OCR extraction completed for document {document_id}, text length: {len(extracted_text)}")
                    
                    # Generate embedding for semantic search
                    embedding = None
                    if embedding_service.is_available():
                        logger.info(f"Generating embedding for document {document_id}")
                        # Use title + extracted text for better semantic search
                        text_for_embedding = f"{document.title}\n\n{extracted_text}"
                        embedding = await embedding_service.generate_embedding(text_for_embedding)
                        if embedding:
                            logger.info(f"Embedding generated for document {document_id}")
                        else:
                            logger.warning(f"Failed to generate embedding for document {document_id}")
                    else:
                        logger.info("Embedding service not available, skipping embedding generation")
                    
                    # Update document with extracted text, embedding, and completed status
                    update_data = {
                        "extracted_text": extracted_text,
                        "status": DocumentStatus.COMPLETED
                    }
                    if embedding:
                        update_data["embedding"] = embedding
                    
                    await repository.update(document_id, update_data)
                    logger.info(f"Document {document_id} status updated to COMPLETED")
                    
                except Exception as ocr_error:
                    error_msg = f"OCR processing failed: {str(ocr_error)}"
                    logger.error(f"OCR error for document {document_id}: {error_msg}", exc_info=True)
                    await repository.update(
                        document_id,
                        {
                            "status": DocumentStatus.FAILED,
                            "extracted_text": error_msg
                        }
                    )
                    
            except Exception as e:
                logger.error(f"Unexpected error processing OCR for document {document_id}: {str(e)}", exc_info=True)
                # Try to update status even if there's an error
                try:
                    async with AsyncSessionLocal() as error_session:
                        error_repo = DocumentRepository(error_session)
                        await error_repo.update(
                            document_id,
                            {
                                "status": DocumentStatus.FAILED,
                                "extracted_text": f"Unexpected error: {str(e)}"
                            }
                        )
                except Exception as update_error:
                    logger.error(f"Failed to update document status after error: {str(update_error)}")

    def _validate_file_extension(self, file: UploadFile) -> None:
        """Validate file extension based on allowed types"""
        extension = self._get_file_extension(file)
        allowed_types = {file_type.lower() for file_type in settings.ALLOWED_FILE_TYPES}
        if extension not in allowed_types:
            raise ValueError(f"Unsupported file type: .{extension}")

    def _get_file_extension(self, file: UploadFile) -> str:
        """Extract file extension from filename"""
        if not file.filename:
            raise ValueError("Filename is required")
        return Path(file.filename).suffix.replace(".", "").lower()

    def _map_extension_to_file_type(self, extension: str) -> FileType:
        """Map file extension to FileType enum"""
        if extension == "pdf":
            return FileType.PDF
        if extension in {"png", "jpg", "jpeg"}:
            return FileType.IMAGE
        if extension == "docx":
            return FileType.DOCX
        raise ValueError(f"Unsupported file type: .{extension}")

    async def _save_file(self, user_id: int, file: UploadFile, extension: str) -> tuple[Path, Path, str]:
        """Save uploaded file to disk and return file path and filename"""
        upload_dir = Path(settings.UPLOAD_DIR) / str(user_id)
        os.makedirs(upload_dir, exist_ok=True)

        unique_filename = f"{uuid4().hex}.{extension}"
        file_path = upload_dir / unique_filename
        relative_path = Path(str(user_id)) / unique_filename

        # Reset file pointer to start
        await file.seek(0)

        total_size = 0
        max_size = settings.MAX_FILE_SIZE
        chunk_size = 1024 * 1024  # 1MB

        async with aiofiles.open(file_path, "wb") as output_file:
            while True:
                chunk = await file.read(chunk_size)
                if not chunk:
                    break

                total_size += len(chunk)
                if total_size > max_size:
                    await output_file.close()
                    if file_path.exists():
                        file_path.unlink(missing_ok=True)
                    raise ValueError(
                        f"File size exceeds the maximum allowed size of {max_size // (1024 * 1024)} MB"
                    )

                await output_file.write(chunk)

        # Reset file pointer for future operations if needed
        await file.seek(0)

        return file_path, relative_path, unique_filename
    
    async def update_document(
        self,
        document_id: int,
        user_id: int,
        update_data: dict
    ) -> Optional[Document]:
        """
        Update document metadata
        
        Args:
            document_id: Document ID to update
            user_id: User ID (for authorization)
            update_data: Dictionary with fields to update (title, category)
        
        Returns:
            Updated document or None if not found
        """
        document = await self.repository.get_by_id(document_id)
        if not document:
            return None
        
        # Check ownership
        if document.user_id != user_id:
            raise ValueError("Access denied: Document does not belong to user")
        
        # Only allow updating title and category
        allowed_fields = {"title", "category"}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            return document
        
        return await self.repository.update(document_id, filtered_data)
    
    async def delete_document(self, document_id: int, user_id: int) -> bool:
        """
        Delete document and its file
        
        Args:
            document_id: Document ID to delete
            user_id: User ID (for authorization)
        
        Returns:
            True if deleted, False if not found
        """
        document = await self.repository.get_by_id(document_id)
        if not document:
            return False
        
        # Check ownership
        if document.user_id != user_id:
            raise ValueError("Access denied: Document does not belong to user")
        
        # Delete file from disk
        file_path = Path(settings.UPLOAD_DIR) / document.file_path
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to delete file {file_path}: {str(e)}")
        
        # Delete from database
        return await self.repository.delete(document_id)
    
    async def semantic_search(
        self,
        user_id: int,
        query: str,
        limit: int = 10,
        threshold: float = 0.7
    ) -> list[tuple[Document, float]]:
        """
        Perform semantic search on user's documents
        
        Args:
            user_id: User ID
            query: Search query text
            limit: Maximum number of results
            threshold: Minimum similarity threshold (0-1)
        
        Returns:
            List of tuples (document, similarity_score)
        """
        # Generate embedding for query
        if not embedding_service.is_available():
            logger.warning("Embedding service not available, cannot perform semantic search")
            return []
        
        query_embedding = await embedding_service.generate_embedding(query)
        if not query_embedding:
            logger.warning("Failed to generate embedding for search query")
            return []
        
        # Perform semantic search
        results = await self.repository.semantic_search(
            user_id=user_id,
            query_embedding=query_embedding,
            limit=limit,
            threshold=threshold
        )
        
        return results



"""
Document service for handling business logic
"""

import os
from pathlib import Path
from typing import Optional
from uuid import uuid4

import aiofiles
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.document import DocumentStatus, FileType
from app.models.user import User
from app.repositories.document_repository import DocumentRepository


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



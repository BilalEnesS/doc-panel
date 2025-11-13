"""
Document API endpoints
"""

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import DocumentUploadResponse, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    file: UploadFile = File(...),
    category: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload a document

    Args:
        background_tasks: FastAPI background tasks
        title: Document title
        file: Uploaded file
        category: Optional document category
        db: Database session
        current_user: Authenticated user

    Returns:
        Document upload response
    """
    document_service = DocumentService(db)

    try:
        document = await document_service.upload_document(
            user=current_user,
            title=title,
            file=file,
            category=category,
        )
        
        # Start OCR processing in background
        background_tasks.add_task(document_service.process_ocr, document.id)
        
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document=DocumentResponse.model_validate(document),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get document by ID

    Args:
        document_id: Document ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Document response
    """
    document_service = DocumentService(db)
    document = await document_service.repository.get_by_id(document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document belongs to user
    if document.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List documents for current user

    Args:
        limit: Number of documents to return
        offset: Number of documents to skip
        db: Database session
        current_user: Authenticated user

    Returns:
        List of documents
    """
    document_service = DocumentService(db)
    documents = await document_service.repository.list_by_user(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    
    return [DocumentResponse.model_validate(doc) for doc in documents]


@router.post("/{document_id}/reprocess", response_model=DocumentResponse)
async def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Reprocess OCR for a document

    Args:
        document_id: Document ID to reprocess
        background_tasks: FastAPI background tasks
        db: Database session
        current_user: Authenticated user

    Returns:
        Document response
    """
    document_service = DocumentService(db)
    document = await document_service.repository.get_by_id(document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if document belongs to user
    if document.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    # Start OCR processing in background
    background_tasks.add_task(document_service.process_ocr, document.id)
    
    return DocumentResponse.model_validate(document)



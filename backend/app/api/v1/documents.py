"""
Document API endpoints
"""

from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.document import DocumentStatus, FileType
from app.schemas.document import (
    DocumentUploadResponse,
    DocumentResponse,
    DocumentUpdateRequest,
    DocumentListResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    SemanticSearchResult
)
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


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[DocumentStatus] = Query(None),
    file_type: Optional[FileType] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at", regex="^(created_at|title|file_type|status)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List documents for current user with filtering, sorting, and pagination

    Args:
        limit: Number of documents to return (1-100)
        offset: Number of documents to skip
        status: Filter by document status
        file_type: Filter by file type
        category: Filter by category
        search: Search in title, filename, or extracted text
        sort_by: Sort field (created_at, title, file_type, status)
        sort_order: Sort order (asc, desc)
        db: Database session
        current_user: Authenticated user

    Returns:
        Document list with pagination info
    """
    document_service = DocumentService(db)
    
    documents = await document_service.repository.list_by_user(
        user_id=current_user.id,
        limit=limit,
        offset=offset,
        status=status,
        file_type=file_type,
        category=category,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    total = await document_service.repository.count_by_user(
        user_id=current_user.id,
        status=status,
        file_type=file_type,
        category=category,
        search=search
    )
    
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=total,
        limit=limit,
        offset=offset
    )


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    update_data: DocumentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update document metadata (title, category)

    Args:
        document_id: Document ID to update
        update_data: Update data (title, category)
        db: Database session
        current_user: Authenticated user

    Returns:
        Updated document response
    """
    document_service = DocumentService(db)
    
    try:
        update_dict = update_data.model_dump(exclude_unset=True)
        document = await document_service.update_document(
            document_id=document_id,
            user_id=current_user.id,
            update_data=update_dict
        )
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return DocumentResponse.model_validate(document)
        
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        ) from exc


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a document

    Args:
        document_id: Document ID to delete
        db: Database session
        current_user: Authenticated user

    Returns:
        No content (204)
    """
    document_service = DocumentService(db)
    
    try:
        deleted = await document_service.delete_document(
            document_id=document_id,
            user_id=current_user.id
        )
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc)
        ) from exc


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


@router.post("/search", response_model=SemanticSearchResponse)
async def semantic_search(
    search_request: SemanticSearchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Perform semantic search on user's documents
    
    Args:
        search_request: Search query and parameters
        db: Database session
        current_user: Authenticated user
    
    Returns:
        Semantic search results with similarity scores
    """
    document_service = DocumentService(db)
    
    try:
        results = await document_service.semantic_search(
            user_id=current_user.id,
            query=search_request.query,
            limit=search_request.limit or 10,
            threshold=search_request.threshold or 0.7
        )
        
        # Convert results to response format
        search_results = [
            SemanticSearchResult(
                document=DocumentResponse.model_validate(doc),
                similarity=similarity
            )
            for doc, similarity in results
        ]
        
        return SemanticSearchResponse(
            results=search_results,
            query=search_request.query,
            total=len(search_results)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        ) from e



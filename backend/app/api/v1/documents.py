"""Documents API endpoints."""

import math
from fastapi import APIRouter, Query, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.common import Message
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentListResponse,
    DocumentSearchFilters,
)
from app.services.document_service import DocumentService

router = APIRouter()


def document_to_response(doc) -> DocumentResponse:
    """Convert Document model to response schema."""
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        content=doc.content_raw or "",
        doc_type=doc.doc_type,
        source_type=doc.source_type,
        source_url=doc.source_url,
        is_pinned=doc.is_pinned,
        is_archived=doc.is_archived,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        tags=[tag.name for tag in doc.tags] if doc.tags else [],
    )


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List documents",
)
async def list_documents(
    user: CurrentUser,
    db: DbSession,
    query: str | None = Query(default=None, description="Search query"),
    doc_type: str | None = Query(default=None, description="Filter by document type"),
    is_pinned: bool | None = Query(default=None, description="Filter by pinned status"),
    is_archived: bool | None = Query(default=None, description="Filter by archived status"),
    sort_by: str = Query(default="updated_at", description="Sort field"),
    sort_order: str = Query(default="desc", description="Sort order (asc/desc)"),
    page: int = Query(default=1, ge=1, description="Page number"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
) -> DocumentListResponse:
    """
    List all documents for the current user with filtering and pagination.
    """
    filters = DocumentSearchFilters(
        query=query,
        doc_type=doc_type,
        is_pinned=is_pinned,
        is_archived=is_archived,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )

    service = DocumentService(db)
    documents, total = await service.list(user, filters)

    return DocumentListResponse(
        items=[document_to_response(doc) for doc in documents],
        total=total,
        page=page,
        limit=limit,
        pages=math.ceil(total / limit) if total > 0 else 0,
    )


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create document",
)
async def create_document(
    data: DocumentCreate,
    user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """
    Create a new document.
    """
    service = DocumentService(db)
    document = await service.create(user, data)
    return document_to_response(document)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document by ID",
)
async def get_document(
    document_id: str,
    user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """
    Get a specific document by ID.
    """
    service = DocumentService(db)
    document = await service.get_by_id(user, document_id)
    return document_to_response(document)


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document",
)
async def update_document(
    document_id: str,
    data: DocumentUpdate,
    user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """
    Update a document.
    """
    service = DocumentService(db)
    document = await service.update(user, document_id, data)
    return document_to_response(document)


@router.delete(
    "/{document_id}",
    response_model=Message,
    summary="Delete document",
)
async def delete_document(
    document_id: str,
    user: CurrentUser,
    db: DbSession,
) -> Message:
    """
    Delete a document permanently.
    """
    service = DocumentService(db)
    await service.delete(user, document_id)
    return Message(message="Document deleted successfully")


@router.post(
    "/{document_id}/archive",
    response_model=DocumentResponse,
    summary="Archive/unarchive document",
)
async def archive_document(
    document_id: str,
    archived: bool,
    user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """
    Archive or unarchive a document.
    """
    service = DocumentService(db)
    document = await service.archive(user, document_id, archived)
    return document_to_response(document)


@router.post(
    "/{document_id}/pin",
    response_model=DocumentResponse,
    summary="Pin/unpin document",
)
async def pin_document(
    document_id: str,
    pinned: bool,
    user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """
    Pin or unpin a document.
    """
    service = DocumentService(db)
    document = await service.pin(user, document_id, pinned)
    return document_to_response(document)

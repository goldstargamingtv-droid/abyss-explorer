"""Documents API endpoints - placeholder for Phase 2."""

from fastapi import APIRouter

from app.dependencies import CurrentUser

router = APIRouter()


@router.get(
    "",
    summary="List documents",
)
async def list_documents(
    user: CurrentUser,
) -> dict:
    """
    List all documents for the current user.

    This is a placeholder endpoint that will be implemented in Phase 2.
    """
    return {
        "items": [],
        "total": 0,
        "page": 1,
        "limit": 20,
        "pages": 0,
    }


@router.get(
    "/{document_id}",
    summary="Get document by ID",
)
async def get_document(
    document_id: str,
    user: CurrentUser,
) -> dict:
    """
    Get a specific document by ID.

    This is a placeholder endpoint that will be implemented in Phase 2.
    """
    return {
        "id": document_id,
        "title": "Placeholder",
        "content": "",
        "message": "Document endpoints coming in Phase 2",
    }

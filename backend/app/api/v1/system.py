"""System API endpoints for health checks and status."""

from fastapi import APIRouter

from app.config import settings

router = APIRouter()


@router.get(
    "/health",
    summary="Health check endpoint",
)
async def health_check() -> dict:
    """
    Health check endpoint for monitoring and load balancers.

    Returns the application status and version.
    """
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": settings.app_env,
    }


@router.get(
    "/stats",
    summary="Get application statistics",
)
async def get_stats() -> dict:
    """
    Get basic application statistics.

    This is a placeholder that will be expanded with real stats.
    """
    return {
        "documents_count": 0,
        "tags_count": 0,
        "collections_count": 0,
        "storage_used_mb": 0,
    }

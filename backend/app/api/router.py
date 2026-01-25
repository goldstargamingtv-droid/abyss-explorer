"""Main API router that combines all endpoint routers."""

from fastapi import APIRouter

from app.api.v1 import auth, documents, system

api_router = APIRouter()

# Include all routers
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(system.router, tags=["System"])

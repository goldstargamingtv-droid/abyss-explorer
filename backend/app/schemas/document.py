"""Document-related Pydantic schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class DocumentBase(BaseModel):
    """Base document schema."""

    title: str = Field(min_length=1, max_length=500)
    content: str = Field(default="")
    doc_type: str = Field(default="note", max_length=50)  # note, bookmark, article, pdf, etc.
    source_url: str | None = Field(default=None, max_length=2000)
    is_pinned: bool = Field(default=False)


class DocumentCreate(DocumentBase):
    """Schema for creating a document."""

    tags: list[str] = Field(default_factory=list)  # Tag names to apply
    collection_id: str | None = None


class DocumentUpdate(BaseModel):
    """Schema for updating a document."""

    title: str | None = Field(default=None, min_length=1, max_length=500)
    content: str | None = None
    doc_type: str | None = Field(default=None, max_length=50)
    source_url: str | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None
    tags: list[str] | None = None
    collection_id: str | None = None


class DocumentResponse(BaseModel):
    """Schema for document response."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    content: str
    doc_type: str
    source_type: str | None
    source_url: str | None
    is_pinned: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    # Computed fields from relationships
    tags: list[str] = Field(default_factory=list)


class DocumentListResponse(BaseModel):
    """Schema for paginated document list."""

    items: list[DocumentResponse]
    total: int
    page: int
    limit: int
    pages: int


class DocumentSearchFilters(BaseModel):
    """Filters for document search/listing."""

    query: str | None = None
    doc_type: str | None = None
    tags: list[str] | None = None
    collection_id: str | None = None
    is_pinned: bool | None = None
    is_archived: bool | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    sort_by: str = Field(default="updated_at")  # updated_at, created_at, title
    sort_order: str = Field(default="desc")  # asc, desc
    page: int = Field(default=1, ge=1)
    limit: int = Field(default=20, ge=1, le=100)

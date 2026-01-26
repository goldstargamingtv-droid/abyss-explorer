"""Document service for CRUD operations."""
from __future__ import annotations

import logging
import math
from datetime import datetime, timezone

from sqlalchemy import func, select, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError, ForbiddenError
from app.models.document import Document
from app.models.tag import Tag, DocumentTag
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentUpdate,
    DocumentSearchFilters,
)

logger = logging.getLogger(__name__)


class DocumentService:
    """Service for handling document operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user: User, data: DocumentCreate) -> Document:
        """Create a new document."""
        # Create the document
        document = Document(
            user_id=user.id,
            title=data.title,
            content_raw=data.content,
            content_plain=data.content,  # TODO: Strip HTML/markdown for plain text
            doc_type=data.doc_type,
            source_type="manual",
            source_url=data.source_url,
            is_pinned=data.is_pinned,
        )

        self.db.add(document)
        await self.db.flush()  # Get the document ID

        # Handle tags
        if data.tags:
            await self._apply_tags(document, user, data.tags)

        await self.db.commit()
        await self.db.refresh(document)

        logger.info(f"Document created: {document.id} by user {user.username}")
        return document

    async def get_by_id(self, user: User, document_id: str) -> Document:
        """Get a document by ID."""
        result = await self.db.execute(
            select(Document)
            .where(Document.id == document_id)
            .options(selectinload(Document.document_tags))
        )
        document = result.scalar_one_or_none()

        if document is None:
            raise NotFoundError("Document not found")

        if document.user_id != user.id:
            raise ForbiddenError("Access denied")

        # Update last accessed
        document.last_accessed = datetime.now(timezone.utc)
        await self.db.commit()

        return document

    async def list(
        self,
        user: User,
        filters: DocumentSearchFilters,
    ) -> tuple[list[Document], int]:
        """List documents with filtering and pagination."""
        # Base query
        query = (
            select(Document)
            .where(Document.user_id == user.id)
            .options(selectinload(Document.document_tags))
        )

        # Apply filters
        if filters.query:
            search_term = f"%{filters.query}%"
            query = query.where(
                (Document.title.ilike(search_term)) |
                (Document.content_plain.ilike(search_term))
            )

        if filters.doc_type:
            query = query.where(Document.doc_type == filters.doc_type)

        if filters.is_pinned is not None:
            query = query.where(Document.is_pinned == filters.is_pinned)

        if filters.is_archived is not None:
            query = query.where(Document.is_archived == filters.is_archived)
        else:
            # Default: don't show archived
            query = query.where(Document.is_archived == False)

        if filters.date_from:
            query = query.where(Document.created_at >= filters.date_from)

        if filters.date_to:
            query = query.where(Document.created_at <= filters.date_to)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Apply sorting
        sort_column = getattr(Document, filters.sort_by, Document.updated_at)
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Apply pagination
        offset = (filters.page - 1) * filters.limit
        query = query.offset(offset).limit(filters.limit)

        # Execute
        result = await self.db.execute(query)
        documents = list(result.scalars().all())

        return documents, total

    async def update(
        self,
        user: User,
        document_id: str,
        data: DocumentUpdate,
    ) -> Document:
        """Update a document."""
        document = await self.get_by_id(user, document_id)

        # Update fields
        if data.title is not None:
            document.title = data.title

        if data.content is not None:
            document.content_raw = data.content
            document.content_plain = data.content  # TODO: Strip HTML/markdown

        if data.doc_type is not None:
            document.doc_type = data.doc_type

        if data.source_url is not None:
            document.source_url = data.source_url

        if data.is_pinned is not None:
            document.is_pinned = data.is_pinned

        if data.is_archived is not None:
            document.is_archived = data.is_archived

        # Handle tags
        if data.tags is not None:
            await self._apply_tags(document, user, data.tags)

        document.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(document)

        logger.info(f"Document updated: {document.id}")
        return document

    async def delete(self, user: User, document_id: str) -> None:
        """Delete a document."""
        document = await self.get_by_id(user, document_id)

        await self.db.delete(document)
        await self.db.commit()

        logger.info(f"Document deleted: {document_id}")

    async def archive(self, user: User, document_id: str, archived: bool) -> Document:
        """Archive or unarchive a document."""
        document = await self.get_by_id(user, document_id)
        document.is_archived = archived
        document.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(document)

        logger.info(f"Document {'archived' if archived else 'unarchived'}: {document_id}")
        return document

    async def pin(self, user: User, document_id: str, pinned: bool) -> Document:
        """Pin or unpin a document."""
        document = await self.get_by_id(user, document_id)
        document.is_pinned = pinned
        document.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(document)

        logger.info(f"Document {'pinned' if pinned else 'unpinned'}: {document_id}")
        return document

    async def _apply_tags(
        self,
        document: Document,
        user: User,
        tag_names: list[str],
    ) -> None:
        """Apply tags to a document, creating new tags if needed."""
        # Clear existing tags
        await self.db.execute(
            DocumentTag.__table__.delete().where(
                DocumentTag.document_id == document.id
            )
        )

        for tag_name in tag_names:
            tag_name = tag_name.strip().lower()
            if not tag_name:
                continue

            # Find or create tag
            result = await self.db.execute(
                select(Tag).where(Tag.user_id == user.id, Tag.name == tag_name)
            )
            tag = result.scalar_one_or_none()

            if tag is None:
                tag = Tag(user_id=user.id, name=tag_name)
                self.db.add(tag)
                await self.db.flush()

            # Create document-tag association
            doc_tag = DocumentTag(
                document_id=document.id,
                tag_id=tag.id,
                is_auto=False,
            )
            self.db.add(doc_tag)

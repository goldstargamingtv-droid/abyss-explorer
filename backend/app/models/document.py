"""Document and DocumentChunk models."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin, utc_now

if TYPE_CHECKING:
    from app.models.attachment import Attachment
    from app.models.collection import DocumentCollection
    from app.models.link import DocumentLink
    from app.models.tag import DocumentTag
    from app.models.user import User


class Document(Base, UUIDMixin, TimestampMixin):
    """Main document/note model."""

    __tablename__ = "documents"

    # Foreign keys
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Content
    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        index=True,
    )

    content_raw: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    content_html: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    content_plain: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Metadata
    doc_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="note",
        index=True,
    )  # note, article, bookmark, pdf, image, email, tweet

    source_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="manual",
    )  # manual, upload, import, api

    source_url: Mapped[str | None] = mapped_column(
        String(2048),
        nullable=True,
    )

    metadata_json: Mapped[str | None] = mapped_column(
        Text,  # Store as JSON string
        nullable=True,
        default="{}",
    )

    # Vector embedding (stored as JSON array of floats)
    embedding: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Scoring and organization
    importance_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
        nullable=False,
    )

    # Dates
    source_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_accessed: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )

    # Status flags
    is_archived: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    is_pinned: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    is_processed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="documents",
    )

    chunks: Mapped[list["DocumentChunk"]] = relationship(
        "DocumentChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    document_tags: Mapped[list["DocumentTag"]] = relationship(
        "DocumentTag",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    outgoing_links: Mapped[list["DocumentLink"]] = relationship(
        "DocumentLink",
        back_populates="source",
        foreign_keys="DocumentLink.source_id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    incoming_links: Mapped[list["DocumentLink"]] = relationship(
        "DocumentLink",
        back_populates="target",
        foreign_keys="DocumentLink.target_id",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    document_collections: Mapped[list["DocumentCollection"]] = relationship(
        "DocumentCollection",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    attachments: Mapped[list["Attachment"]] = relationship(
        "Attachment",
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Document {self.title[:50]}>"


class DocumentChunk(Base, UUIDMixin):
    """Document chunk for granular embeddings."""

    __tablename__ = "document_chunks"

    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Vector embedding (stored as JSON array)
    embedding: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    metadata_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default="{}",
    )

    # Relationship
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="chunks",
    )

    def __repr__(self) -> str:
        return f"<DocumentChunk {self.document_id}:{self.chunk_index}>"

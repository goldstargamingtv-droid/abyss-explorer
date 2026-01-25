"""Collection and DocumentCollection models."""

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.user import User


class Collection(Base, UUIDMixin, TimestampMixin):
    """Collection/folder model for organizing documents."""

    __tablename__ = "collections"
    __table_args__ = (
        UniqueConstraint("user_id", "name", "parent_id", name="uq_user_collection_name"),
    )

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    parent_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("collections.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
    )

    icon: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="folder",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    settings_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        default="{}",
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="collections",
    )

    parent: Mapped["Collection | None"] = relationship(
        "Collection",
        back_populates="children",
        remote_side="Collection.id",
    )

    children: Mapped[list["Collection"]] = relationship(
        "Collection",
        back_populates="parent",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    document_collections: Mapped[list["DocumentCollection"]] = relationship(
        "DocumentCollection",
        back_populates="collection",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Collection {self.name}>"


class DocumentCollection(Base):
    """Association table for Document-Collection many-to-many relationship."""

    __tablename__ = "document_collections"
    __table_args__ = (
        UniqueConstraint("document_id", "collection_id", name="uq_document_collection"),
    )

    document_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        primary_key=True,
    )

    collection_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("collections.id", ondelete="CASCADE"),
        primary_key=True,
    )

    position: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document",
        back_populates="document_collections",
    )

    collection: Mapped["Collection"] = relationship(
        "Collection",
        back_populates="document_collections",
    )

    def __repr__(self) -> str:
        return f"<DocumentCollection {self.document_id}:{self.collection_id}>"

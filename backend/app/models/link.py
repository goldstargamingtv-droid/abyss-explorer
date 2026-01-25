"""DocumentLink model for knowledge graph edges."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.document import Document


class DocumentLink(Base, UUIDMixin, TimestampMixin):
    """Link between two documents (knowledge graph edge)."""

    __tablename__ = "document_links"
    __table_args__ = (
        UniqueConstraint(
            "source_id", "target_id", "link_type",
            name="uq_document_link"
        ),
    )

    source_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    target_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    link_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # backlink, semantic, entity, tag_overlap, manual

    similarity_score: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    context: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_auto: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Relationships
    source: Mapped["Document"] = relationship(
        "Document",
        back_populates="outgoing_links",
        foreign_keys=[source_id],
    )

    target: Mapped["Document"] = relationship(
        "Document",
        back_populates="incoming_links",
        foreign_keys=[target_id],
    )

    def __repr__(self) -> str:
        return f"<DocumentLink {self.source_id} -> {self.target_id} ({self.link_type})>"

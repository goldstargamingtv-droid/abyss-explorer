"""Job and history tracking models."""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.user import User


class IngestionJob(Base, UUIDMixin, TimestampMixin):
    """Background job for document ingestion."""

    __tablename__ = "ingestion_jobs"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    job_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )  # upload, url, bookmark, folder, reindex

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
        index=True,
    )  # pending, processing, completed, failed, cancelled

    input_data_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    result_data_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="ingestion_jobs",
    )

    def __repr__(self) -> str:
        return f"<IngestionJob {self.id} ({self.status})>"


class SearchHistory(Base, UUIDMixin):
    """Search history tracking."""

    __tablename__ = "search_history"

    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    query: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    search_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="hybrid",
    )  # hybrid, semantic, keyword

    filters_json: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    result_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Relationship
    user: Mapped["User"] = relationship(
        "User",
        back_populates="search_history",
    )

    def __repr__(self) -> str:
        return f"<SearchHistory {self.query[:30]}>"

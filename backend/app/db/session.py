"""Database session and engine configuration."""

import logging
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

logger = logging.getLogger(__name__)

# Convert sqlite:/// to sqlite+aiosqlite:/// for async support
database_url = settings.database_url
if database_url.startswith("sqlite:///"):
    database_url = database_url.replace("sqlite:///", "sqlite+aiosqlite:///")

# Create async engine
engine = create_async_engine(
    database_url,
    echo=settings.debug,
    future=True,
)

# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def init_db() -> None:
    """Initialize the database, creating all tables."""
    from app.models.base import Base

    # Import all models to register them with Base
    from app.models import (  # noqa: F401
        attachment,
        collection,
        document,
        job,
        link,
        tag,
        user,
    )

    # Ensure the data directory exists
    db_path = settings.database_url.replace("sqlite:///", "")
    if db_path.startswith("./"):
        db_path = db_path[2:]
    db_dir = Path(db_path).parent
    db_dir.mkdir(parents=True, exist_ok=True)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created successfully")


async def get_db_session() -> AsyncSession:
    """Get a new database session."""
    async with async_session_maker() as session:
        return session

"""Authentication service."""

import json
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import (
    create_token_pair,
    hash_password,
    verify_password,
    verify_token,
)
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserUpdate

logger = logging.getLogger(__name__)


class AuthService:
    """Service for handling authentication operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserCreate) -> tuple[User, dict[str, str]]:
        """Register a new user."""
        # Check if email already exists
        existing_email = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing_email.scalar_one_or_none():
            raise ConflictError("Email already registered")

        # Check if username already exists
        existing_username = await self.db.execute(
            select(User).where(User.username == data.username)
        )
        if existing_username.scalar_one_or_none():
            raise ConflictError("Username already taken")

        # Create new user
        user = User(
            email=data.email,
            username=data.username,
            password_hash=hash_password(data.password),
            settings=json.dumps({"theme": "system", "editor": "default"}),
        )

        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Generate tokens
        tokens = create_token_pair(user.id)

        logger.info(f"New user registered: {user.username}")
        return user, tokens

    async def login(self, data: UserLogin) -> tuple[User, dict[str, str]]:
        """Authenticate a user and return tokens."""
        # Find user by email
        result = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        user = result.scalar_one_or_none()

        if user is None:
            raise UnauthorizedError("Invalid email or password")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password")

        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        # Generate tokens
        tokens = create_token_pair(user.id)

        logger.info(f"User logged in: {user.username}")
        return user, tokens

    async def refresh_tokens(self, refresh_token: str) -> dict[str, str]:
        """Refresh access token using refresh token."""
        payload = verify_token(refresh_token, token_type="refresh")

        if payload is None:
            raise UnauthorizedError("Invalid or expired refresh token")

        user_id = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError("Invalid token payload")

        # Verify user still exists and is active
        user = await self.db.get(User, user_id)
        if user is None:
            raise UnauthorizedError("User not found")

        if not user.is_active:
            raise UnauthorizedError("Account is disabled")

        # Generate new tokens
        tokens = create_token_pair(user.id)

        logger.info(f"Tokens refreshed for user: {user.username}")
        return tokens

    async def update_user(self, user: User, data: UserUpdate) -> User:
        """Update user profile."""
        if data.username is not None:
            # Check if new username is taken by another user
            existing = await self.db.execute(
                select(User).where(
                    User.username == data.username,
                    User.id != user.id,
                )
            )
            if existing.scalar_one_or_none():
                raise ConflictError("Username already taken")
            user.username = data.username

        if data.settings is not None:
            user.settings = json.dumps(data.settings)

        user.updated_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(user)

        logger.info(f"User updated: {user.username}")
        return user

    async def change_password(
        self,
        user: User,
        old_password: str,
        new_password: str,
    ) -> None:
        """Change user password."""
        if not verify_password(old_password, user.password_hash):
            raise BadRequestError("Current password is incorrect")

        user.password_hash = hash_password(new_password)
        user.updated_at = datetime.now(timezone.utc)

        await self.db.commit()

        logger.info(f"Password changed for user: {user.username}")

    async def get_user_by_id(self, user_id: str) -> User | None:
        """Get user by ID."""
        return await self.db.get(User, user_id)

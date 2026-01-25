"""Authentication API endpoints."""

from fastapi import APIRouter, Response, status

from app.dependencies import CurrentUser, DbSession
from app.schemas.common import Message
from app.schemas.user import (
    AuthResponse,
    PasswordChange,
    TokenPair,
    TokenRefresh,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from app.services.auth_service import AuthService

router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def register(
    data: UserCreate,
    db: DbSession,
) -> AuthResponse:
    """
    Register a new user account.

    - **email**: Valid email address (must be unique)
    - **username**: 3-100 characters, alphanumeric with underscores/hyphens
    - **password**: 8-100 characters, must contain uppercase, lowercase, and digit
    """
    service = AuthService(db)
    user, tokens = await service.register(data)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenPair(**tokens),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login to get access tokens",
)
async def login(
    data: UserLogin,
    response: Response,
    db: DbSession,
) -> AuthResponse:
    """
    Authenticate with email and password.

    Returns access and refresh tokens. The refresh token is also set as an httpOnly cookie.
    """
    service = AuthService(db)
    user, tokens = await service.login(data)

    # Set refresh token as httpOnly cookie for security
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return AuthResponse(
        user=UserResponse.model_validate(user),
        tokens=TokenPair(**tokens),
    )


@router.post(
    "/logout",
    response_model=Message,
    summary="Logout and clear tokens",
)
async def logout(
    response: Response,
    _: CurrentUser,  # Require authentication
) -> Message:
    """
    Logout the current user.

    Clears the refresh token cookie. Client should also discard the access token.
    """
    response.delete_cookie("refresh_token")
    return Message(message="Successfully logged out")


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
)
async def refresh_token(
    data: TokenRefresh,
    response: Response,
    db: DbSession,
) -> TokenPair:
    """
    Get a new access token using a refresh token.

    The refresh token is also rotated for security.
    """
    service = AuthService(db)
    tokens = await service.refresh_tokens(data.refresh_token)

    # Update refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return TokenPair(**tokens)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_current_user(
    user: CurrentUser,
) -> UserResponse:
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(user)


@router.patch(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
)
async def update_current_user(
    data: UserUpdate,
    user: CurrentUser,
    db: DbSession,
) -> UserResponse:
    """
    Update the current user's profile.

    - **username**: New username (optional)
    - **settings**: User preferences JSON (optional)
    """
    service = AuthService(db)
    updated_user = await service.update_user(user, data)
    return UserResponse.model_validate(updated_user)


@router.post(
    "/password",
    response_model=Message,
    summary="Change password",
)
async def change_password(
    data: PasswordChange,
    user: CurrentUser,
    db: DbSession,
) -> Message:
    """
    Change the current user's password.

    Requires the current password for verification.
    """
    service = AuthService(db)
    await service.change_password(user, data.old_password, data.new_password)
    return Message(message="Password changed successfully")

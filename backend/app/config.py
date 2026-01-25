"""Application configuration using Pydantic Settings."""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = "PKM Vault"
    app_env: Literal["development", "production", "test"] = "development"
    debug: bool = False

    # Security
    secret_key: str = Field(
        default="dev-secret-key-change-in-production-minimum-32-characters",
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    # Database
    database_url: str = "sqlite:///./data/pkm_vault.db"

    # Embeddings
    embedding_provider: Literal["huggingface", "openai"] = "huggingface"
    huggingface_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    huggingface_api_url: str = "https://api-inference.huggingface.co/pipeline/feature-extraction"
    openai_api_key: str | None = None
    openai_embedding_model: str = "text-embedding-3-small"
    embedding_dimension: int = 384  # MiniLM-L6-v2 dimension

    # File Storage
    upload_dir: Path = Path("./data/uploads")
    backup_dir: Path = Path("./data/backups")
    max_upload_size_mb: int = 50
    allowed_extensions: str = "md,txt,pdf,epub,png,jpg,jpeg,gif,html,json"

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Rate Limiting
    rate_limit_per_minute: int = 100

    # Background Tasks
    enable_background_tasks: bool = True

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @field_validator("upload_dir", "backup_dir", mode="before")
    @classmethod
    def ensure_path(cls, v: str | Path) -> Path:
        """Convert string to Path and ensure directory exists."""
        path = Path(v) if isinstance(v, str) else v
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def allowed_extensions_list(self) -> list[str]:
        """Get allowed extensions as a list."""
        return [ext.strip().lower() for ext in self.allowed_extensions.split(",")]

    @property
    def cors_origins_list(self) -> list[str]:
        """Get CORS origins as a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    @property
    def max_upload_size_bytes(self) -> int:
        """Get max upload size in bytes."""
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Export settings instance for convenience
settings = get_settings()

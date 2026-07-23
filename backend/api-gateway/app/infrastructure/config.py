from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ingestion_service_url: str = "http://localhost:8001"
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-haiku-4-5-20251001"

    ingestion_breaker_failure_threshold: int = 5
    ingestion_breaker_reset_timeout_seconds: float = 30.0

    anthropic_breaker_failure_threshold: int = 3
    anthropic_breaker_reset_timeout_seconds: float = 60.0


settings = Settings()

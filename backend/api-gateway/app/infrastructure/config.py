from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    ingestion_service_url: str = "http://localhost:8001"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    ingestion_breaker_failure_threshold: int = 5
    ingestion_breaker_reset_timeout_seconds: float = 30.0

    gemini_breaker_failure_threshold: int = 3
    gemini_breaker_reset_timeout_seconds: float = 60.0

    vehicle_stream_interval_seconds: float = 3.0

    cors_allowed_origins: str = "http://localhost:5173"

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


settings = Settings()

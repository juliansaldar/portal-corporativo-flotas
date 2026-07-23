from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    redpanda_brokers: str = "localhost:19092"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/fleet"
    stop_speed_threshold_kmh: float = 2.0
    kafka_topic: str = "telemetry.raw"
    kafka_consumer_group: str = "ingestion-service"


settings = Settings()

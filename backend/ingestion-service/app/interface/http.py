from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status
from shared.models import TelemetryEvent, VehicleState
from shared.resilience import CircuitBreaker, CircuitBreakerOpenError

from app.application.get_vehicle_states import get_vehicle_states
from app.application.ingest_telemetry import ingest_telemetry
from app.application.process_telemetry_event import process_telemetry_event
from app.infrastructure.config import settings
from app.infrastructure.event_bus import KafkaEventConsumer, KafkaEventPublisher
from app.infrastructure.timescale_repository import TimescaleVehicleRepository

logger = logging.getLogger("ingestion-service")

_publish_breaker = CircuitBreaker(failure_threshold=5, reset_timeout_seconds=30.0)


class AppState:
    repo: TimescaleVehicleRepository
    publisher: KafkaEventPublisher
    consumer: KafkaEventConsumer
    consumer_task: asyncio.Task


state = AppState()


async def _consume_loop() -> None:
    async for event in state.consumer.events():
        try:
            await process_telemetry_event(event, state.repo, settings.stop_speed_threshold_kmh)
        except Exception:  # noqa: BLE001 - un evento invalido no debe tumbar el consumer
            logger.exception("failed to process telemetry event %s", event.event_id)


@asynccontextmanager
async def lifespan(_: FastAPI):
    state.repo = await TimescaleVehicleRepository.connect(settings.database_url)
    state.publisher = KafkaEventPublisher(settings.redpanda_brokers, settings.kafka_topic)
    await state.publisher.start()
    state.consumer = KafkaEventConsumer(
        settings.redpanda_brokers, settings.kafka_topic, settings.kafka_consumer_group
    )
    await state.consumer.start()
    state.consumer_task = asyncio.create_task(_consume_loop())

    yield

    state.consumer_task.cancel()
    await state.consumer.stop()
    await state.publisher.stop()
    await state.repo.close()


app = FastAPI(title="ingestion-service", lifespan=lifespan)


@app.get("/healthz")
async def healthz() -> dict:
    return {"status": "ok"}


@app.post("/v1/telemetry", status_code=status.HTTP_202_ACCEPTED)
async def post_telemetry(event: TelemetryEvent) -> dict:
    try:
        await _publish_breaker.call(ingest_telemetry, event, state.publisher)
    except CircuitBreakerOpenError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    return {"accepted": True, "event_id": event.event_id}


@app.get("/internal/vehicles/state", response_model=list[VehicleState])
async def get_internal_vehicles_state() -> list[VehicleState]:
    return await get_vehicle_states(state.repo)

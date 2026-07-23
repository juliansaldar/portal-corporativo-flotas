from __future__ import annotations

from shared.models import TelemetryEvent

from app.application.ports import EventPublisherPort


async def ingest_telemetry(event: TelemetryEvent, publisher: EventPublisherPort) -> None:
    """Publica el evento validado en el bus de eventos. No espera a la persistencia."""
    await publisher.publish(event)

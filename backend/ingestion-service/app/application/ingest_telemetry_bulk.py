from __future__ import annotations

from shared.models import TelemetryEvent

from app.application.ingest_telemetry import ingest_telemetry
from app.application.ports import EventPublisherPort


async def ingest_telemetry_bulk(events: list[TelemetryEvent], publisher: EventPublisherPort) -> int:
    """Publica cada evento del lote reutilizando ingest_telemetry.

    Si un evento falla a mitad de camino, el cliente puede reenviar el lote
    completo sin duplicar datos: la deduplicacion por event_id ocurre en el
    consumer (ver telemetry-ingestion, capability service-resilience).
    """
    for event in events:
        await ingest_telemetry(event, publisher)
    return len(events)

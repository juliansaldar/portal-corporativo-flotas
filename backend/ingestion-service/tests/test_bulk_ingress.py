from datetime import datetime, timezone

from shared.models import TelemetryEvent

from app.application.ingest_telemetry_bulk import ingest_telemetry_bulk
from tests.fakes import FakeEventPublisher


def _event(event_id: str) -> TelemetryEvent:
    return TelemetryEvent(
        event_id=event_id,
        vehicle_id="veh-mobile-1",
        lat=4.61,
        lon=-74.08,
        speed_kmh=20.0,
        timestamp=datetime.now(timezone.utc),
    )


async def test_bulk_publishes_every_event_in_the_batch():
    publisher = FakeEventPublisher()
    events = [_event("evt-bulk-1"), _event("evt-bulk-2")]

    count = await ingest_telemetry_bulk(events, publisher)

    assert count == 2
    assert publisher.published == events


async def test_bulk_resending_same_event_id_does_not_raise():
    """La dedup real ocurre en el consumer (ver test_dedup.py); el ingress solo
    debe aceptar y publicar sin fallar si el cliente reintenta un lote tras
    una falla parcial de red (mismos event_id)."""
    publisher = FakeEventPublisher()
    events = [_event("evt-bulk-retry")]

    first = await ingest_telemetry_bulk(events, publisher)
    second = await ingest_telemetry_bulk(events, publisher)

    assert first == 1
    assert second == 1

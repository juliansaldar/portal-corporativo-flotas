from datetime import datetime, timezone

import pytest
from pydantic import ValidationError
from shared.models import TelemetryEvent

from app.application.ingest_telemetry import ingest_telemetry
from tests.fakes import FakeEventPublisher


def _event(**overrides) -> TelemetryEvent:
    payload = dict(
        event_id="evt-1",
        vehicle_id="veh-1",
        lat=4.61,
        lon=-74.08,
        speed_kmh=40.0,
        timestamp=datetime.now(timezone.utc),
    )
    payload.update(overrides)
    return TelemetryEvent(**payload)


async def test_valid_payload_is_published():
    publisher = FakeEventPublisher()
    event = _event()

    await ingest_telemetry(event, publisher)

    assert publisher.published == [event]


def test_payload_missing_required_fields_is_rejected():
    with pytest.raises(ValidationError):
        TelemetryEvent(event_id="evt-1", vehicle_id="veh-1")

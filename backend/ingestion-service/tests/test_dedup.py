from datetime import datetime, timezone

from shared.models import TelemetryEvent

from app.application.process_telemetry_event import process_telemetry_event
from tests.fakes import FakeVehicleRepository


def _event(**overrides) -> TelemetryEvent:
    payload = dict(
        event_id="evt-dup-1",
        vehicle_id="veh-1",
        lat=4.61,
        lon=-74.08,
        speed_kmh=40.0,
        timestamp=datetime.now(timezone.utc),
    )
    payload.update(overrides)
    return TelemetryEvent(**payload)


async def test_duplicate_event_id_is_ignored():
    repo = FakeVehicleRepository()
    event = _event()

    first = await process_telemetry_event(event, repo)
    second = await process_telemetry_event(event, repo)

    assert first is not None
    assert second is None
    assert len(repo.telemetry) == 1

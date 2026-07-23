import json
from datetime import datetime, timezone

from shared.models import VehicleState

from app.interface.http import _vehicle_stream_tick, state
from tests.fakes import FakeVehicleStateReader


def _state(vehicle_id: str) -> VehicleState:
    return VehicleState(
        vehicle_id=vehicle_id,
        lat=4.61,
        lon=-74.08,
        speed_kmh=0.0,
        updated_at=datetime.now(timezone.utc),
        stopped_since=None,
        stopped_duration_seconds=0,
        current_zone_ids=[],
    )


async def test_tick_emits_vehicle_state_as_sse_data_event():
    state.ingestion_client = FakeVehicleStateReader(states=[_state("veh-1")])

    event = await _vehicle_stream_tick()

    assert event.startswith("data: ")
    payload = json.loads(event.removeprefix("data: ").strip())
    assert payload[0]["vehicle_id"] == "veh-1"


async def test_tick_emits_error_event_without_raising_when_breaker_open():
    from shared.resilience import CircuitBreakerOpenError

    class _OpenBreakerReader:
        async def list_vehicle_states(self):
            raise CircuitBreakerOpenError("circuit is open, failing fast")

    state.ingestion_client = _OpenBreakerReader()

    event = await _vehicle_stream_tick()

    assert event.startswith("event: stream-error")
    assert "circuit breaker" in event

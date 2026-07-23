from datetime import datetime, timezone

from shared.models import VehicleState

from app.domain.query import filter_vehicle_states


def _state(vehicle_id: str, stopped_duration_seconds: int, zone_ids: list[str]) -> VehicleState:
    return VehicleState(
        vehicle_id=vehicle_id,
        lat=4.61,
        lon=-74.08,
        speed_kmh=0.0,
        updated_at=datetime.now(timezone.utc),
        stopped_since=datetime.now(timezone.utc),
        stopped_duration_seconds=stopped_duration_seconds,
        current_zone_ids=zone_ids,
    )


def test_filters_by_zone_and_min_stopped_seconds():
    states = [
        _state("veh-1", 1500, ["zona-x"]),
        _state("veh-2", 500, ["zona-x"]),
        _state("veh-3", 2000, ["zona-y"]),
    ]

    result = filter_vehicle_states(states, zone_id="zona-x", min_stopped_seconds=1200)

    assert [s.vehicle_id for s in result] == ["veh-1"]


def test_no_filters_returns_all():
    states = [_state("veh-1", 10, ["zona-x"])]

    assert filter_vehicle_states(states) == states

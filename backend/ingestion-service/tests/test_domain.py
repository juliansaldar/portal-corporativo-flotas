from datetime import datetime, timedelta, timezone

from shared.models import CriticalZone, TelemetryEvent

from app.domain.stop_detection import compute_next_state
from app.domain.zone import zone_contains

ZONE = CriticalZone(
    id="z1", name="Zona Test", severity="high", center_lat=4.61, center_lon=-74.08, radius_m=500
)


def test_zone_contains_point_inside_radius():
    assert zone_contains(ZONE, lat=4.611, lon=-74.081) is True


def test_zone_contains_point_outside_radius():
    assert zone_contains(ZONE, lat=4.90, lon=-74.50) is False


def _event(speed_kmh: float, ts: datetime) -> TelemetryEvent:
    return TelemetryEvent(
        event_id=f"evt-{ts.isoformat()}",
        vehicle_id="veh-1",
        lat=4.611,
        lon=-74.081,
        speed_kmh=speed_kmh,
        timestamp=ts,
    )


def test_stopped_duration_increases_across_consecutive_stopped_samples():
    t0 = datetime.now(timezone.utc)

    first = compute_next_state(_event(0.0, t0), previous=None, zones=[ZONE])
    assert first.stopped_since == t0
    assert first.stopped_duration_seconds == 0
    assert first.current_zone_ids == ["z1"]

    t1 = t0 + timedelta(minutes=21)
    second = compute_next_state(_event(0.5, t1), previous=first, zones=[ZONE])
    assert second.stopped_since == t0
    assert second.stopped_duration_seconds == 21 * 60


def test_resuming_movement_resets_stopped_state():
    t0 = datetime.now(timezone.utc)
    stopped = compute_next_state(_event(0.0, t0), previous=None, zones=[ZONE])

    t1 = t0 + timedelta(minutes=5)
    moving = compute_next_state(_event(35.0, t1), previous=stopped, zones=[ZONE])

    assert moving.stopped_since is None
    assert moving.stopped_duration_seconds == 0

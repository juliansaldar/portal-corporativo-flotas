"""Calculo incremental de stopped_since / stopped_duration por vehiculo."""

from __future__ import annotations

from shared.models import CriticalZone, TelemetryEvent, VehicleState

from app.domain.zone import matching_zone_ids

DEFAULT_STOP_SPEED_THRESHOLD_KMH = 2.0


def compute_next_state(
    event: TelemetryEvent,
    previous: VehicleState | None,
    zones: list[CriticalZone],
    stop_speed_threshold_kmh: float = DEFAULT_STOP_SPEED_THRESHOLD_KMH,
) -> VehicleState:
    zone_ids = matching_zone_ids(zones, event.lat, event.lon)

    if event.speed_kmh <= stop_speed_threshold_kmh:
        stopped_since = previous.stopped_since if previous and previous.stopped_since else event.timestamp
        stopped_duration_seconds = max(0, int((event.timestamp - stopped_since).total_seconds()))
    else:
        stopped_since = None
        stopped_duration_seconds = 0

    return VehicleState(
        vehicle_id=event.vehicle_id,
        lat=event.lat,
        lon=event.lon,
        speed_kmh=event.speed_kmh,
        updated_at=event.timestamp,
        stopped_since=stopped_since,
        stopped_duration_seconds=stopped_duration_seconds,
        current_zone_ids=zone_ids,
    )

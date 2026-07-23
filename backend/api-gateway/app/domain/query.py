"""Filtrado puro sobre el estado de vehiculos ya calculado por ingestion-service."""

from __future__ import annotations

from shared.models import VehicleState


def filter_vehicle_states(
    states: list[VehicleState],
    zone_id: str | None = None,
    min_stopped_seconds: int | None = None,
) -> list[VehicleState]:
    result = states
    if zone_id:
        result = [s for s in result if zone_id in s.current_zone_ids]
    if min_stopped_seconds is not None:
        result = [s for s in result if s.stopped_duration_seconds >= min_stopped_seconds]
    return result

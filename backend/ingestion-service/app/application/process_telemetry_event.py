from __future__ import annotations

from shared.models import TelemetryEvent, VehicleState

from app.application.ports import VehicleRepositoryPort
from app.domain.stop_detection import DEFAULT_STOP_SPEED_THRESHOLD_KMH, compute_next_state


async def process_telemetry_event(
    event: TelemetryEvent,
    repo: VehicleRepositoryPort,
    stop_speed_threshold_kmh: float = DEFAULT_STOP_SPEED_THRESHOLD_KMH,
) -> VehicleState | None:
    """Deduplica, persiste y actualiza el estado derivado del vehiculo.

    Retorna None si el evento ya habia sido procesado (duplicado ignorado).
    """
    is_new = await repo.try_mark_processed(event.event_id)
    if not is_new:
        return None

    await repo.insert_telemetry(event)

    previous = await repo.get_vehicle_state(event.vehicle_id)
    zones = await repo.list_critical_zones()
    new_state = compute_next_state(event, previous, zones, stop_speed_threshold_kmh)
    await repo.upsert_vehicle_state(new_state)
    return new_state

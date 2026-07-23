from __future__ import annotations

from shared.models import VehicleState

from app.application.ports import VehicleStateReaderPort
from app.domain.query import filter_vehicle_states


async def query_vehicle_state(
    reader: VehicleStateReaderPort,
    zone_id: str | None = None,
    min_stopped_seconds: int | None = None,
) -> list[VehicleState]:
    states = await reader.list_vehicle_states()
    return filter_vehicle_states(states, zone_id, min_stopped_seconds)

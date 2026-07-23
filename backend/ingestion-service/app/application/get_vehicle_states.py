from __future__ import annotations

from shared.models import VehicleState

from app.application.ports import VehicleRepositoryPort


async def get_vehicle_states(repo: VehicleRepositoryPort) -> list[VehicleState]:
    return await repo.list_vehicle_states()

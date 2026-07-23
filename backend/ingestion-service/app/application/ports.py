"""Puertos (interfaces) que la capa de aplicacion espera de infraestructura.

Clean Architecture: application/domain no conocen aiokafka ni asyncpg,
solo estos Protocols. Los tests usan fakes en memoria de estos mismos puertos.
"""

from __future__ import annotations

from typing import Protocol

from shared.models import CriticalZone, TelemetryEvent, VehicleState


class EventPublisherPort(Protocol):
    async def publish(self, event: TelemetryEvent) -> None: ...


class VehicleRepositoryPort(Protocol):
    async def try_mark_processed(self, event_id: str) -> bool:
        """Retorna True si event_id es nuevo (y queda marcado), False si ya se proceso (duplicado)."""
        ...

    async def insert_telemetry(self, event: TelemetryEvent) -> None: ...

    async def get_vehicle_state(self, vehicle_id: str) -> VehicleState | None: ...

    async def upsert_vehicle_state(self, state: VehicleState) -> None: ...

    async def list_vehicle_states(self) -> list[VehicleState]: ...

    async def list_critical_zones(self) -> list[CriticalZone]: ...

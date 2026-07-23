from __future__ import annotations

from shared.models import CriticalZone, TelemetryEvent, VehicleState


class FakeEventPublisher:
    def __init__(self, fail_times: int = 0) -> None:
        self.published: list[TelemetryEvent] = []
        self._fail_times = fail_times

    async def publish(self, event: TelemetryEvent) -> None:
        if self._fail_times > 0:
            self._fail_times -= 1
            raise ConnectionError("simulated broker outage")
        self.published.append(event)


class FakeVehicleRepository:
    def __init__(self, zones: list[CriticalZone] | None = None) -> None:
        self._processed_ids: set[str] = set()
        self.telemetry: list[TelemetryEvent] = []
        self._states: dict[str, VehicleState] = {}
        self._zones = zones or []

    async def try_mark_processed(self, event_id: str) -> bool:
        if event_id in self._processed_ids:
            return False
        self._processed_ids.add(event_id)
        return True

    async def insert_telemetry(self, event: TelemetryEvent) -> None:
        self.telemetry.append(event)

    async def get_vehicle_state(self, vehicle_id: str) -> VehicleState | None:
        return self._states.get(vehicle_id)

    async def upsert_vehicle_state(self, state: VehicleState) -> None:
        self._states[state.vehicle_id] = state

    async def list_vehicle_states(self) -> list[VehicleState]:
        return list(self._states.values())

    async def list_critical_zones(self) -> list[CriticalZone]:
        return self._zones

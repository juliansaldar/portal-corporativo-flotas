from __future__ import annotations

from shared.models import VehicleState

from app.application.ports import ModelTurn


class FakeVehicleStateReader:
    def __init__(self, states: list[VehicleState] | None = None, fail_times: int = 0) -> None:
        self._states = states or []
        self._fail_times = fail_times

    async def list_vehicle_states(self) -> list[VehicleState]:
        if self._fail_times > 0:
            self._fail_times -= 1
            raise ConnectionError("simulated ingestion-service outage")
        return self._states


class ScriptedChatModel:
    """Fake de ChatModelPort que reproduce una secuencia fija de turnos."""

    def __init__(self, turns: list[ModelTurn]) -> None:
        self._turns = list(turns)
        self.calls: list[list[dict]] = []

    async def send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn:
        self.calls.append(messages)
        return self._turns.pop(0)

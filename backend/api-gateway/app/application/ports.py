from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from shared.models import VehicleState


class VehicleStateReaderPort(Protocol):
    async def list_vehicle_states(self) -> list[VehicleState]: ...


@dataclass
class ModelTurn:
    """Vista minima de un turno de respuesta del modelo, desacoplada del SDK de Anthropic."""

    stop_reason: str
    content: list[dict]


class ChatModelPort(Protocol):
    async def send(self, messages: list[dict], tools: list[dict], system: str) -> ModelTurn: ...

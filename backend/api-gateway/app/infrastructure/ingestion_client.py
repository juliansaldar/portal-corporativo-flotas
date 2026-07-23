"""Cliente HTTP hacia el endpoint interno de lectura de ingestion-service."""

from __future__ import annotations

import httpx
from shared.models import VehicleState
from shared.resilience import CircuitBreaker


class IngestionServiceClient:
    def __init__(self, base_url: str, breaker: CircuitBreaker) -> None:
        self._base_url = base_url.rstrip("/")
        self._breaker = breaker
        self._http = httpx.AsyncClient(timeout=5.0)

    async def list_vehicle_states(self) -> list[VehicleState]:
        return await self._breaker.call(self._fetch)

    async def _fetch(self) -> list[VehicleState]:
        response = await self._http.get(f"{self._base_url}/internal/vehicles/state")
        response.raise_for_status()
        return [VehicleState.model_validate(item) for item in response.json()]

    async def aclose(self) -> None:
        await self._http.aclose()

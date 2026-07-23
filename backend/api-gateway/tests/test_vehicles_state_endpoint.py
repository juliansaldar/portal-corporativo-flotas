from fastapi.testclient import TestClient

from app.interface.http import app, state


class _AlwaysOpenBreakerReader:
    """Simula el reader ya con el circuit breaker abierto hacia ingestion-service."""

    async def list_vehicle_states(self):
        from shared.resilience import CircuitBreakerOpenError

        raise CircuitBreakerOpenError("circuit is open, failing fast")

    async def aclose(self) -> None:
        pass


def test_vehicles_state_returns_503_when_breaker_is_open():
    with TestClient(app) as client:
        state.ingestion_client = _AlwaysOpenBreakerReader()

        response = client.get("/v1/vehicles/state")

        assert response.status_code == 503
        assert "circuit breaker" in response.json()["detail"]

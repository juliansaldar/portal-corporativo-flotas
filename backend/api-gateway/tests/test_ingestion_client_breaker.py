import pytest
from shared.resilience import CircuitBreaker, CircuitBreakerOpenError, CircuitState

from app.infrastructure.ingestion_client import IngestionServiceClient


async def _failing() -> list:
    raise ConnectionError("simulated ingestion-service outage")


async def test_breaker_opens_after_repeated_ingestion_failures():
    breaker = CircuitBreaker(failure_threshold=2, reset_timeout_seconds=60.0)
    client = IngestionServiceClient("http://example.invalid", breaker)
    client._fetch = _failing  # type: ignore[method-assign]

    for _ in range(2):
        with pytest.raises(ConnectionError):
            await client.list_vehicle_states()

    assert breaker.state == CircuitState.OPEN

    with pytest.raises(CircuitBreakerOpenError):
        await client.list_vehicle_states()

    await client.aclose()

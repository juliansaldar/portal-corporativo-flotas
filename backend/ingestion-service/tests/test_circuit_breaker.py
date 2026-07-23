import asyncio

import pytest
from shared.resilience import CircuitBreaker, CircuitBreakerOpenError, CircuitState


class _Failing:
    def __init__(self) -> None:
        self.calls = 0

    async def __call__(self) -> str:
        self.calls += 1
        raise ConnectionError("boom")


class _Succeeding:
    async def __call__(self) -> str:
        return "ok"


async def test_breaker_opens_after_failure_threshold_and_fails_fast():
    breaker = CircuitBreaker(failure_threshold=3, reset_timeout_seconds=60.0)
    failing = _Failing()

    for _ in range(3):
        with pytest.raises(ConnectionError):
            await breaker.call(failing)

    assert breaker.state == CircuitState.OPEN

    with pytest.raises(CircuitBreakerOpenError):
        await breaker.call(failing)

    # el breaker abierto no debe volver a invocar la dependencia
    assert failing.calls == 3


async def test_breaker_half_opens_and_closes_after_reset_timeout():
    breaker = CircuitBreaker(failure_threshold=1, reset_timeout_seconds=0.05)
    failing = _Failing()

    with pytest.raises(ConnectionError):
        await breaker.call(failing)
    assert breaker.state == CircuitState.OPEN

    await asyncio.sleep(0.1)
    assert breaker.state == CircuitState.HALF_OPEN

    result = await breaker.call(_Succeeding())
    assert result == "ok"
    assert breaker.state == CircuitState.CLOSED

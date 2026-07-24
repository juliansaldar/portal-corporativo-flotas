"""Circuit breaker async minimalista, sin dependencias externas.

Se implementa a mano (en vez de sumar una libreria como `purgatory` o
`aiobreaker`) porque el requisito es un unico patron closed/open/half-open
reutilizable entre `api-gateway` -> `ingestion-service` y `api-gateway` ->
Gemini: una dependencia extra no aporta nada que no se pueda auditar en
~60 lineas propias.
"""

from __future__ import annotations

import asyncio
import time
from enum import Enum
from typing import Awaitable, Callable, TypeVar

T = TypeVar("T")


class CircuitState(str, Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreakerOpenError(Exception):
    """Se lanza cuando el breaker esta abierto y falla rapido sin invocar la dependencia."""


class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, reset_timeout_seconds: float = 30.0) -> None:
        self.failure_threshold = failure_threshold
        self.reset_timeout_seconds = reset_timeout_seconds
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._opened_at: float | None = None
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        if self._state == CircuitState.OPEN and self._opened_at is not None:
            if time.monotonic() - self._opened_at >= self.reset_timeout_seconds:
                return CircuitState.HALF_OPEN
        return self._state

    async def call(self, func: Callable[..., Awaitable[T]], *args, **kwargs) -> T:
        current = self.state
        if current == CircuitState.OPEN:
            raise CircuitBreakerOpenError("circuit is open, failing fast")

        try:
            result = await func(*args, **kwargs)
        except Exception:
            await self._on_failure(current)
            raise
        else:
            await self._on_success()
            return result

    async def _on_failure(self, observed_state: CircuitState) -> None:
        async with self._lock:
            self._failure_count += 1
            if observed_state == CircuitState.HALF_OPEN or self._failure_count >= self.failure_threshold:
                self._state = CircuitState.OPEN
                self._opened_at = time.monotonic()

    async def _on_success(self) -> None:
        async with self._lock:
            self._failure_count = 0
            self._state = CircuitState.CLOSED
            self._opened_at = None

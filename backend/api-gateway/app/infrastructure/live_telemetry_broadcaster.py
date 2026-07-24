"""Fan-out en memoria de eventos crudos de telemetria por vehicle_id.

Un unico KafkaEventConsumer en background alimenta N suscriptores (una
asyncio.Queue por conexion SSE activa) — nunca un consumer de Kafka nuevo
por cliente conectado. Efimero: no persiste nada, solo reenvia eventos
desde que cada suscriptor se conecta (ver design.md, Non-Goals).
"""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from collections.abc import AsyncIterator

from shared.messaging import KafkaEventConsumer
from shared.models import TelemetryEvent

logger = logging.getLogger("api-gateway")

SUBSCRIBER_QUEUE_MAXSIZE = 100


class LiveTelemetryBroadcaster:
    def __init__(self, brokers: str, topic: str, group_id: str) -> None:
        # auto_offset_reset="latest": a diferencia del consumer de
        # ingestion-service (que necesita "earliest" para no perder eventos
        # de persistencia), este feed es "en vivo desde que te conectas" —
        # con "earliest" reproduciria todo el historial del topico de golpe.
        self._consumer = KafkaEventConsumer(brokers, topic, group_id, auto_offset_reset="latest")
        self._subscribers: dict[str, list[asyncio.Queue[TelemetryEvent]]] = defaultdict(list)
        self._consume_task: asyncio.Task | None = None

    async def start(self) -> None:
        await self._consumer.start()
        self._consume_task = asyncio.create_task(self._consume_loop())

    async def stop(self) -> None:
        if self._consume_task is not None:
            self._consume_task.cancel()
        await self._consumer.stop()

    async def _consume_loop(self) -> None:
        try:
            async for event in self._consumer.events():
                for queue in self._subscribers.get(event.vehicle_id, []):
                    if queue.full():
                        queue.get_nowait()  # descarta el mas viejo, prioriza lo reciente
                    queue.put_nowait(event)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001 - un consumer caido no debe tumbar api-gateway
            logger.exception("live telemetry consumer loop stopped unexpectedly")

    async def subscribe(self, vehicle_id: str) -> AsyncIterator[TelemetryEvent]:
        queue: asyncio.Queue[TelemetryEvent] = asyncio.Queue(maxsize=SUBSCRIBER_QUEUE_MAXSIZE)
        self._subscribers[vehicle_id].append(queue)
        try:
            while True:
                yield await queue.get()
        finally:
            self._subscribers[vehicle_id].remove(queue)

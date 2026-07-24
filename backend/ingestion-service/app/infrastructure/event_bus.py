"""Adaptador Redpanda/Kafka (aiokafka) para el puerto EventPublisherPort.

`KafkaEventConsumer` vive en `shared.messaging` porque ahora lo usan tanto
este servicio como `api-gateway` (ver change vehicle-live-telemetry-feed),
cada uno con su propio `group_id`.
"""

from __future__ import annotations

import json
from datetime import datetime

from aiokafka import AIOKafkaProducer
from shared.messaging import KafkaEventConsumer
from shared.models import TelemetryEvent

__all__ = ["KafkaEventConsumer", "KafkaEventPublisher"]


def _json_default(value: object) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    raise TypeError(f"Object of type {type(value)} is not JSON serializable")


class KafkaEventPublisher:
    def __init__(self, bootstrap_servers: str, topic: str) -> None:
        self._topic = topic
        self._producer = AIOKafkaProducer(
            bootstrap_servers=bootstrap_servers,
            value_serializer=lambda v: json.dumps(v, default=_json_default).encode("utf-8"),
        )

    async def start(self) -> None:
        await self._producer.start()

    async def stop(self) -> None:
        await self._producer.stop()

    async def publish(self, event: TelemetryEvent) -> None:
        await self._producer.send_and_wait(self._topic, event.model_dump(mode="json"))

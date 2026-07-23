"""Adaptador Redpanda/Kafka (aiokafka) para el puerto EventPublisherPort y el consumo async."""

from __future__ import annotations

import json
from datetime import datetime

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from shared.models import TelemetryEvent


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


class KafkaEventConsumer:
    def __init__(self, bootstrap_servers: str, topic: str, group_id: str) -> None:
        self._consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset="earliest",
            enable_auto_commit=True,
        )

    async def start(self) -> None:
        await self._consumer.start()

    async def stop(self) -> None:
        await self._consumer.stop()

    async def events(self):
        async for message in self._consumer:
            yield TelemetryEvent.model_validate(message.value)

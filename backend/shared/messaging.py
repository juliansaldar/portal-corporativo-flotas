"""Adaptador Redpanda/Kafka (aiokafka) de consumo async, compartido entre servicios.

Cada servicio que lo use debe pasar su propio `group_id` (nunca compartirlo
entre servicios): consumer groups distintos leen el mismo topico de forma
independiente, sin competir por particiones ni afectar el offset ajeno.
"""

from __future__ import annotations

import json

from aiokafka import AIOKafkaConsumer
from shared.models import TelemetryEvent


class KafkaEventConsumer:
    def __init__(
        self,
        bootstrap_servers: str,
        topic: str,
        group_id: str,
        auto_offset_reset: str = "earliest",
    ) -> None:
        self._consumer = AIOKafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
            auto_offset_reset=auto_offset_reset,
            enable_auto_commit=True,
        )

    async def start(self) -> None:
        await self._consumer.start()

    async def stop(self) -> None:
        await self._consumer.stop()

    async def events(self):
        async for message in self._consumer:
            yield TelemetryEvent.model_validate(message.value)

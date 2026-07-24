import asyncio
from datetime import datetime, timezone

from shared.models import TelemetryEvent

from app.infrastructure.live_telemetry_broadcaster import LiveTelemetryBroadcaster


class _FakeConsumer:
    """Reemplaza KafkaEventConsumer con una secuencia finita de eventos ya conocida."""

    def __init__(self, events: list[TelemetryEvent]) -> None:
        self._events = events

    async def events(self):
        for event in self._events:
            yield event


def _event(vehicle_id: str, event_id: str) -> TelemetryEvent:
    return TelemetryEvent(
        event_id=event_id,
        vehicle_id=vehicle_id,
        lat=4.6,
        lon=-74.08,
        speed_kmh=10.0,
        timestamp=datetime.now(timezone.utc),
    )


def _broadcaster_with_events(events: list[TelemetryEvent]) -> LiveTelemetryBroadcaster:
    broadcaster = LiveTelemetryBroadcaster("localhost:9092", "telemetry.raw", "test-group")
    broadcaster._consumer = _FakeConsumer(events)  # type: ignore[assignment]
    return broadcaster


async def test_subscriber_only_receives_events_for_its_vehicle_id():
    broadcaster = _broadcaster_with_events(
        [_event("veh-a", "e1"), _event("veh-b", "e2"), _event("veh-a", "e3")]
    )

    gen = broadcaster.subscribe("veh-a")
    first = asyncio.ensure_future(gen.__anext__())
    await asyncio.sleep(0)  # deja que el generador registre su queue antes de consumir

    await broadcaster._consume_loop()

    received = [await first, await gen.__anext__()]
    assert [e.event_id for e in received] == ["e1", "e3"]

    await gen.aclose()


async def test_subscriber_is_removed_from_broadcaster_on_close():
    broadcaster = _broadcaster_with_events([_event("veh-a", "e1")])

    gen = broadcaster.subscribe("veh-a")
    first = asyncio.ensure_future(gen.__anext__())
    await asyncio.sleep(0)
    assert len(broadcaster._subscribers["veh-a"]) == 1

    await broadcaster._consume_loop()
    await first
    await gen.aclose()

    assert len(broadcaster._subscribers["veh-a"]) == 0


async def test_full_queue_drops_oldest_event_in_favor_of_the_newest():
    from app.infrastructure import live_telemetry_broadcaster as module

    events = [_event("veh-a", f"e{i}") for i in range(module.SUBSCRIBER_QUEUE_MAXSIZE + 1)]
    broadcaster = _broadcaster_with_events(events)

    gen = broadcaster.subscribe("veh-a")
    first = asyncio.ensure_future(gen.__anext__())
    await asyncio.sleep(0)

    await broadcaster._consume_loop()

    received = [await first]
    for _ in range(module.SUBSCRIBER_QUEUE_MAXSIZE - 1):
        received.append(await gen.__anext__())

    # el evento mas viejo (e0) se descarto para dejar espacio al mas reciente
    assert received[0].event_id == "e1"
    assert received[-1].event_id == f"e{module.SUBSCRIBER_QUEUE_MAXSIZE}"

    await gen.aclose()

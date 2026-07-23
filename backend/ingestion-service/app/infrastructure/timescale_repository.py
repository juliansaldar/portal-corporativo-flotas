"""Adaptador Postgres/TimescaleDB (asyncpg) para VehicleRepositoryPort."""

from __future__ import annotations

from pathlib import Path

import asyncpg
from shared.models import CriticalZone, TelemetryEvent, VehicleState

from app.infrastructure.seed_zones import SEED_CRITICAL_ZONES

_MIGRATIONS_DIR = Path(__file__).resolve().parent.parent.parent / "migrations"


class TimescaleVehicleRepository:
    def __init__(self, pool: asyncpg.Pool) -> None:
        self._pool = pool

    @classmethod
    async def connect(cls, database_url: str) -> "TimescaleVehicleRepository":
        pool = await asyncpg.create_pool(database_url)
        repo = cls(pool)
        await repo.run_migrations()
        await repo.seed_critical_zones()
        return repo

    async def close(self) -> None:
        await self._pool.close()

    async def run_migrations(self) -> None:
        async with self._pool.acquire() as conn:
            for sql_file in sorted(_MIGRATIONS_DIR.glob("*.sql")):
                await conn.execute(sql_file.read_text())

    async def seed_critical_zones(self) -> None:
        async with self._pool.acquire() as conn:
            for zone in SEED_CRITICAL_ZONES:
                await conn.execute(
                    """
                    INSERT INTO critical_zones (id, name, severity, center_lat, center_lon, radius_m)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (id) DO NOTHING
                    """,
                    zone.id,
                    zone.name,
                    zone.severity,
                    zone.center_lat,
                    zone.center_lon,
                    zone.radius_m,
                )

    async def try_mark_processed(self, event_id: str) -> bool:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO processed_events (event_id)
                VALUES ($1)
                ON CONFLICT (event_id) DO NOTHING
                RETURNING event_id
                """,
                event_id,
            )
            return row is not None

    async def insert_telemetry(self, event: TelemetryEvent) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO vehicle_telemetry (event_id, vehicle_id, lat, lon, speed_kmh, ts)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (vehicle_id, ts) DO NOTHING
                """,
                event.event_id,
                event.vehicle_id,
                event.lat,
                event.lon,
                event.speed_kmh,
                event.timestamp,
            )

    async def get_vehicle_state(self, vehicle_id: str) -> VehicleState | None:
        async with self._pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT * FROM vehicle_state WHERE vehicle_id = $1", vehicle_id
            )
            return _row_to_vehicle_state(row) if row else None

    async def upsert_vehicle_state(self, state: VehicleState) -> None:
        async with self._pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO vehicle_state (
                    vehicle_id, lat, lon, speed_kmh, updated_at,
                    stopped_since, stopped_duration_seconds, current_zone_ids
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                ON CONFLICT (vehicle_id) DO UPDATE SET
                    lat = EXCLUDED.lat,
                    lon = EXCLUDED.lon,
                    speed_kmh = EXCLUDED.speed_kmh,
                    updated_at = EXCLUDED.updated_at,
                    stopped_since = EXCLUDED.stopped_since,
                    stopped_duration_seconds = EXCLUDED.stopped_duration_seconds,
                    current_zone_ids = EXCLUDED.current_zone_ids
                """,
                state.vehicle_id,
                state.lat,
                state.lon,
                state.speed_kmh,
                state.updated_at,
                state.stopped_since,
                state.stopped_duration_seconds,
                state.current_zone_ids,
            )

    async def list_vehicle_states(self) -> list[VehicleState]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM vehicle_state ORDER BY vehicle_id")
            return [_row_to_vehicle_state(row) for row in rows]

    async def list_critical_zones(self) -> list[CriticalZone]:
        async with self._pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM critical_zones ORDER BY id")
            return [CriticalZone(**dict(row)) for row in rows]


def _row_to_vehicle_state(row: asyncpg.Record) -> VehicleState:
    return VehicleState(**dict(row))

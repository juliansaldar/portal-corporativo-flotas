CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS vehicle_telemetry (
    event_id UUID NOT NULL,
    vehicle_id TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION NOT NULL,
    ts TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (vehicle_id, ts)
);

SELECT create_hypertable('vehicle_telemetry', 'ts', if_not_exists => TRUE);
SELECT add_retention_policy('vehicle_telemetry', INTERVAL '7 days', if_not_exists => TRUE);

ALTER TABLE vehicle_telemetry SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'vehicle_id'
);
SELECT add_compression_policy('vehicle_telemetry', INTERVAL '1 day', if_not_exists => TRUE);

-- Tabla de dedup: separada del hypertable porque Timescale exige que las
-- constraints unicas incluyan la columna de particion (ts), lo que no sirve
-- para deduplicar por event_id solo. Ver design.md, decision 5.
CREATE TABLE IF NOT EXISTS processed_events (
    event_id UUID PRIMARY KEY,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS critical_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    severity TEXT NOT NULL,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lon DOUBLE PRECISION NOT NULL,
    radius_m DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS vehicle_state (
    vehicle_id TEXT PRIMARY KEY,
    lat DOUBLE PRECISION NOT NULL,
    lon DOUBLE PRECISION NOT NULL,
    speed_kmh DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    stopped_since TIMESTAMPTZ,
    stopped_duration_seconds INTEGER NOT NULL DEFAULT 0,
    current_zone_ids TEXT[] NOT NULL DEFAULT '{}'
);

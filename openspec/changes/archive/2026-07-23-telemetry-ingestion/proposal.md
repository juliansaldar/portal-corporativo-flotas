## Why

El portal necesita una base de datos de estado de flota confiable antes de que el agente de IA o el dashboard puedan existir: hoy no hay ningún pipeline de ingesta, persistencia ni servicio backend. Este change entrega el Bloque A del PDF (arquitectura de ingesta orientada a eventos) y es prerequisito de todos los demás bloques (agente, portal web, app móvil, caos/carga).

## What Changes

- Nuevo servicio `ingestion-service` (FastAPI) con endpoint `POST /v1/telemetry` que valida el payload y lo publica de forma asíncrona a un tópico Redpanda (`telemetry.raw`), desacoplando ingreso de procesamiento.
- Consumer (mismo servicio, proceso separado) que lee `telemetry.raw`, deduplica por `event_id` (idempotency key) y persiste en TimescaleDB.
- Modelo de dominio de vehículo con estado derivado `stopped_since`/`stopped_duration`, y entidad `CriticalZone` (geofence) con datos semilla — necesarios para que el agente (change `fleet-ai-agent`) pueda responder "¿qué vehículos llevan detenidos +20 min en zonas críticas?".
- Endpoint interno de lectura `GET /internal/vehicles/state` consumido por `api-gateway` en changes futuros.
- Circuit breaker de base (librería `purgatory`/`aiobreaker`) en las llamadas salientes del servicio, listo para que `api-gateway` lo use al llamar a este endpoint interno.
- Skeleton Docker Compose con Redpanda + TimescaleDB + `ingestion-service`.

## Capabilities

### New Capabilities
- `telemetry-ingestion`: ingress HTTP asíncrono, bus de eventos (Redpanda) y consumer idempotente que persiste telemetría de vehículos.
- `vehicle-state-model`: modelo de dominio de vehículo (posición, velocidad, `stopped_since`/`stopped_duration`) y `CriticalZone` (geofences), persistidos en TimescaleDB.
- `service-resilience`: patrón de Circuit Breaker reutilizable para llamadas entre microservicios y a dependencias externas.

### Modified Capabilities
_Ninguna — no existen specs previas en `openspec/specs/`._

## Impact

- Código nuevo: `backend/ingestion-service/` (completo), `backend/shared/` (DTOs Pydantic compartidos: `TelemetryEvent`, `VehicleState`, `CriticalZone`).
- Infraestructura: `docker-compose.yml` (servicios `redpanda`, `timescaledb`, `ingestion-service`).
- Dependencias nuevas: `fastapi`, `aiokafka` (cliente Redpanda), `asyncpg`/`sqlalchemy`, `purgatory-circuitbreaker` (o `aiobreaker`).
- Habilita: `fleet-ai-agent` (lee este estado), `web-portal-dashboard` (consume vía `api-gateway`), `driver-mobile-app` (envía a este ingress), `chaos-load-testing-iac` (carga contra este ingress).

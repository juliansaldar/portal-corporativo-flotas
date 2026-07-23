# telemetry-ingestion Specification

## Purpose
TBD - created by archiving change telemetry-ingestion. Update Purpose after archive.
## Requirements
### Requirement: Ingreso asíncrono desacoplado
El sistema SHALL exponer `POST /v1/telemetry`, que valida el payload, lo publica en el tópico `telemetry.raw` del bus de eventos (Redpanda) y responde sin esperar a que el evento sea persistido en la base de datos.

#### Scenario: Ingreso exitoso
- **WHEN** un cliente envía un payload de telemetría válido a `POST /v1/telemetry`
- **THEN** el servicio publica el evento en el tópico `telemetry.raw` y responde `202 Accepted` sin esperar la escritura en TimescaleDB

#### Scenario: Ingesta continúa aunque la persistencia esté caída
- **WHEN** TimescaleDB no está disponible temporalmente
- **THEN** el ingress sigue aceptando y encolando eventos en Redpanda sin fallar las peticiones entrantes

### Requirement: Validación de payloads
El sistema SHALL rechazar payloads mal formados antes de publicarlos en el bus de eventos.

#### Scenario: Payload inválido rechazado
- **WHEN** el payload no incluye `vehicle_id`, `lat`, `lon` o `timestamp`
- **THEN** el servicio responde `422 Unprocessable Entity` y no publica ningún evento

### Requirement: Consumo idempotente
El sistema SHALL deduplicar eventos por `event_id` (idempotency key), de modo que un mismo evento entregado más de una vez solo se persista una vez.

#### Scenario: Duplicado ignorado
- **WHEN** el consumer recibe dos eventos con el mismo `event_id`
- **THEN** solo el primero se persiste en TimescaleDB y el segundo se descarta sin error visible para el productor


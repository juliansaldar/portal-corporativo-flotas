## ADDED Requirements

### Requirement: Ingreso en bloque
El sistema SHALL exponer `POST /v1/telemetry/bulk`, que acepta una lista de eventos de telemetría y los valida/publica individualmente reutilizando la misma ruta de ingesta que `POST /v1/telemetry` (misma deduplicación por `event_id`).

#### Scenario: Lote aceptado
- **WHEN** un cliente envía un arreglo de eventos válidos a `POST /v1/telemetry/bulk`
- **THEN** el servicio publica cada evento en `telemetry.raw` y responde `202 Accepted` con el conteo de eventos aceptados

#### Scenario: Reintento seguro de un lote parcialmente fallido
- **WHEN** un cliente reenvía el mismo lote (incluyendo eventos ya procesados exitosamente antes) tras un fallo parcial
- **THEN** los eventos ya procesados se ignoran por deduplicación y solo los nuevos se persisten, sin duplicar datos

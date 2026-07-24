## ADDED Requirements

### Requirement: Stream de eventos crudos por vehículo
`api-gateway` SHALL exponer `GET /v1/vehicles/{vehicle_id}/events/stream` (SSE) que reenvía cada evento de telemetría crudo (`event_id`, `vehicle_id`, `lat`, `lon`, `speed_kmh`, `timestamp`) publicado en el tópico `telemetry.raw` de Redpanda para ese `vehicle_id`, consumido mediante un consumer group propio e independiente del de `ingestion-service`.

#### Scenario: Un evento nuevo se reenvía al cliente conectado
- **WHEN** se publica un evento de telemetría en `telemetry.raw` para un `vehicle_id` con al menos un cliente conectado a `GET /v1/vehicles/{vehicle_id}/events/stream`
- **THEN** ese cliente recibe el evento por SSE sin esperar al próximo ciclo de polling del stream de estado agregado

#### Scenario: Eventos de otro vehículo no se filtran incorrectamente
- **WHEN** se publican eventos de varios `vehicle_id` distintos mientras un cliente está conectado al stream de un `vehicle_id` específico
- **THEN** el cliente solo recibe los eventos cuyo `vehicle_id` coincide con el de su conexión

#### Scenario: Un único consumer de Redpanda sirve a múltiples clientes SSE
- **WHEN** varios clientes abren conexiones SSE a `GET /v1/vehicles/{vehicle_id}/events/stream` (mismo o distinto `vehicle_id`) simultáneamente
- **THEN** `api-gateway` sigue usando un único consumer de Redpanda en background (no uno nuevo por conexión) para atender a todos

#### Scenario: Desconexión de un cliente no afecta a los demás
- **WHEN** un cliente cierra su conexión SSE
- **THEN** su suscripción se elimina del broadcaster interno sin interrumpir el stream de otros clientes conectados

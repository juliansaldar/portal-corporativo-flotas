# api-gateway-core Specification

## Purpose
TBD - created by archiving change fleet-ai-agent. Update Purpose after archive.
## Requirements
### Requirement: Servicio independiente
`api-gateway` SHALL correr como un proceso/contenedor independiente de `ingestion-service`, con su propio healthcheck.

#### Scenario: Healthcheck independiente
- **WHEN** se llama `GET /healthz` en `api-gateway`
- **THEN** responde `200 OK` sin depender de que `ingestion-service` esté arriba en ese instante

### Requirement: Llamada resiliente al estado de vehículos
`api-gateway` SHALL envolver su llamada al endpoint interno de `ingestion-service` (`GET /internal/vehicles/state`) en el `CircuitBreaker` compartido.

#### Scenario: El breaker se abre si ingestion-service falla repetidamente
- **WHEN** N llamadas consecutivas a `GET /internal/vehicles/state` fallan
- **THEN** el breaker se abre y las llamadas siguientes de `api-gateway` fallan rápido sin llegar a `ingestion-service`

### Requirement: Manejo seguro de secretos
`api-gateway` SHALL leer `GEMINI_API_KEY` únicamente desde variables de entorno server-side y SHALL NOT exponerla en ninguna respuesta.

#### Scenario: La API key nunca se expone
- **WHEN** un cliente llama a cualquier endpoint público de `api-gateway`
- **THEN** ninguna respuesta (incluyendo errores) contiene el valor de `GEMINI_API_KEY`

### Requirement: Stream de estado de vehículos
`api-gateway` SHALL exponer `GET /v1/vehicles/stream` (SSE) que empuja periódicamente el estado actual de todos los vehículos, reutilizando el mismo cliente y `CircuitBreaker` hacia `ingestion-service` que ya usa el resto del servicio.

#### Scenario: El cliente recibe actualizaciones sin hacer polling
- **WHEN** un cliente abre una conexión SSE a `GET /v1/vehicles/stream`
- **THEN** recibe un evento con el estado de la flota cada pocos segundos, sin tener que volver a solicitar `GET /v1/vehicles/state` manualmente

#### Scenario: Circuit breaker abierto durante el stream
- **WHEN** el circuit breaker hacia `ingestion-service` está abierto mientras el stream está activo
- **THEN** el stream sigue vivo y notifica un evento de error legible, en vez de cerrar la conexión abruptamente

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


## ADDED Requirements

### Requirement: Stream de estado de vehículos
`api-gateway` SHALL exponer `GET /v1/vehicles/stream` (SSE) que empuja periódicamente el estado actual de todos los vehículos, reutilizando el mismo cliente y `CircuitBreaker` hacia `ingestion-service` que ya usa el resto del servicio.

#### Scenario: El cliente recibe actualizaciones sin hacer polling
- **WHEN** un cliente abre una conexión SSE a `GET /v1/vehicles/stream`
- **THEN** recibe un evento con el estado de la flota cada pocos segundos, sin tener que volver a solicitar `GET /v1/vehicles/state` manualmente

#### Scenario: Circuit breaker abierto durante el stream
- **WHEN** el circuit breaker hacia `ingestion-service` está abierto mientras el stream está activo
- **THEN** el stream sigue vivo y notifica un evento de error legible, en vez de cerrar la conexión abruptamente

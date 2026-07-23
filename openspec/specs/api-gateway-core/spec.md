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
`api-gateway` SHALL leer `ANTHROPIC_API_KEY` únicamente desde variables de entorno server-side y SHALL NOT exponerla en ninguna respuesta.

#### Scenario: La API key nunca se expone
- **WHEN** un cliente llama a cualquier endpoint público de `api-gateway`
- **THEN** ninguna respuesta (incluyendo errores) contiene el valor de `ANTHROPIC_API_KEY`


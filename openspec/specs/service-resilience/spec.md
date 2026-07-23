# service-resilience Specification

## Purpose
TBD - created by archiving change telemetry-ingestion. Update Purpose after archive.
## Requirements
### Requirement: Circuit breaker en llamadas salientes
El sistema SHALL envolver las llamadas salientes entre microservicios (y a dependencias externas) en un circuit breaker con umbral de fallos y tiempo de recuperación configurables.

#### Scenario: El breaker se abre tras fallos repetidos
- **WHEN** N llamadas consecutivas a una dependencia fallan
- **THEN** el breaker se abre y las llamadas siguientes fallan rápido sin llegar a la dependencia, durante el período de enfriamiento configurado

#### Scenario: El breaker se recupera
- **WHEN** el período de enfriamiento termina
- **THEN** el breaker permite una llamada de prueba; si tiene éxito, el breaker se cierra y el tráfico vuelve a fluir normalmente

### Requirement: Falla rápida visible para el llamador
El sistema SHALL devolver un error claro cuando el breaker está abierto, en vez de dejar la petición colgada hasta un timeout.

#### Scenario: Falla inmediata con breaker abierto
- **WHEN** el breaker está abierto
- **THEN** el llamador recibe una respuesta de error inmediata, sin esperar el timeout normal de la dependencia


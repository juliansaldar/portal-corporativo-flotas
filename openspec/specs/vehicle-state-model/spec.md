# vehicle-state-model Specification

## Purpose
TBD - created by archiving change telemetry-ingestion. Update Purpose after archive.
## Requirements
### Requirement: Persistencia de series de tiempo
El sistema SHALL persistir cada evento de telemetría consumido como una fila en un hypertable de TimescaleDB particionado por tiempo, con política de retención/compresión.

#### Scenario: Telemetría almacenada en hypertable
- **WHEN** el consumer procesa un evento de `telemetry.raw`
- **THEN** se inserta en el hypertable `vehicle_telemetry`, sujeto a la política de retención/compresión configurada

### Requirement: Detección de vehículo detenido
El sistema SHALL calcular `stopped_since` y `stopped_duration` por vehículo cuando la velocidad reportada se mantiene por debajo de un umbral durante muestras consecutivas.

#### Scenario: Vehículo marcado como detenido
- **WHEN** un vehículo reporta velocidad ≈0 durante N muestras consecutivas
- **THEN** `stopped_since` se fija en el timestamp de la primera muestra detenida y `stopped_duration` aumenta con cada muestra subsiguiente

#### Scenario: Vehículo reanuda movimiento
- **WHEN** un vehículo previamente detenido reporta velocidad por encima del umbral
- **THEN** `stopped_since` y `stopped_duration` se reinician a nulo/cero

### Requirement: Zonas críticas (geofences)
El sistema SHALL modelar `CriticalZone` (nombre, severidad, geometría) con datos semilla de ejemplo, y determinar cuándo la posición de un vehículo cae dentro de una zona.

#### Scenario: Membresía de zona calculada
- **WHEN** la posición de un vehículo cae dentro de la geometría de una `CriticalZone`
- **THEN** el estado actual del vehículo incluye el/los identificador(es) de esa zona

### Requirement: Estado agregado consultable
El sistema SHALL exponer el estado actual por vehículo (posición, `stopped_duration`, zona actual) a través de un endpoint interno de lectura.

#### Scenario: Endpoint interno retorna estado
- **WHEN** se llama a `GET /internal/vehicles/state`
- **THEN** retorna el último estado conocido de todos los vehículos, incluyendo membresía de zona y `stopped_duration`


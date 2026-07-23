## 1. Scaffold y dependencias

- [x] 1.1 Crear estructura Clean Architecture en `backend/ingestion-service/` (`domain/`, `application/`, `infrastructure/`, `interface/`) y `pyproject.toml`/`requirements.txt`
- [x] 1.2 Definir DTOs compartidos en `backend/shared/` (`TelemetryEvent`, `VehicleState`, `CriticalZone`) con Pydantic
- [x] 1.3 Añadir `redpanda` y `timescaledb` a `docker-compose.yml` con volúmenes y healthchecks

## 2. Ingress HTTP y bus de eventos

- [x] 2.1 Implementar `POST /v1/telemetry` (valida payload, publica en `telemetry.raw` vía cliente Redpanda/Kafka async)
- [x] 2.2 Manejo de errores de validación (422 sin publicar)
- [x] 2.3 Test unitario: payload válido publica; payload inválido no publica

## 3. Consumer y persistencia

- [x] 3.1 Crear hypertable `vehicle_telemetry` en TimescaleDB + política de retención/compresión (migración SQL)
- [x] 3.2 Implementar consumer async que lee `telemetry.raw`, deduplica por `event_id` y persiste
- [x] 3.3 Test: evento duplicado (mismo `event_id`) no genera segunda fila

## 4. Modelo de dominio: zonas críticas y detección de parada

- [x] 4.1 Modelar `CriticalZone` (tabla + seed de datos de ejemplo con 2-3 zonas)
- [x] 4.2 Calcular membresía de zona por posición (point-in-polygon o radio, según geometría elegida)
- [x] 4.3 Calcular `stopped_since`/`stopped_duration` de forma incremental por vehículo
- [x] 4.4 Test: secuencia de muestras detenidas actualiza `stopped_duration`; reanudar movimiento resetea el estado

## 5. Endpoint interno de lectura

- [x] 5.1 Implementar `GET /internal/vehicles/state` (posición, zona actual, `stopped_duration` por vehículo)

## 6. Resiliencia

- [x] 6.1 Implementar utilidad de circuit breaker reutilizable en `backend/shared/`
- [x] 6.2 Aplicar el breaker en al menos una llamada saliente real de `ingestion-service` (o dejarla lista para `api-gateway` si este servicio no tiene llamadas salientes propias)
- [x] 6.3 Test: breaker abre tras fallos consecutivos y falla rápido

## 7. Verificación funcional del bloque

- [x] 7.1 `docker compose up` levanta redpanda + timescaledb + ingestion-service sin errores
- [x] 7.2 `curl -X POST /v1/telemetry` con payload de ejemplo → verificar fila en TimescaleDB
- [x] 7.3 Enviar 2 eventos con mismo `event_id` → verificar una sola fila
- [x] 7.4 Enviar posición dentro de una `CriticalZone` con velocidad 0 repetida → verificar `stopped_duration` creciente vía `GET /internal/vehicles/state` (verificado: 1412s dentro de `zona-franca-norte`, > 20 min del ejemplo del PDF)

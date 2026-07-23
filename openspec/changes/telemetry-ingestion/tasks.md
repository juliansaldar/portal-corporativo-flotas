## 1. Scaffold y dependencias

- [ ] 1.1 Crear estructura Clean Architecture en `backend/ingestion-service/` (`domain/`, `application/`, `infrastructure/`, `interface/`) y `pyproject.toml`/`requirements.txt`
- [ ] 1.2 Definir DTOs compartidos en `backend/shared/` (`TelemetryEvent`, `VehicleState`, `CriticalZone`) con Pydantic
- [ ] 1.3 Añadir `redpanda` y `timescaledb` a `docker-compose.yml` con volúmenes y healthchecks

## 2. Ingress HTTP y bus de eventos

- [ ] 2.1 Implementar `POST /v1/telemetry` (valida payload, publica en `telemetry.raw` vía cliente Redpanda/Kafka async)
- [ ] 2.2 Manejo de errores de validación (422 sin publicar)
- [ ] 2.3 Test unitario: payload válido publica; payload inválido no publica

## 3. Consumer y persistencia

- [ ] 3.1 Crear hypertable `vehicle_telemetry` en TimescaleDB + política de retención/compresión (migración SQL)
- [ ] 3.2 Implementar consumer async que lee `telemetry.raw`, deduplica por `event_id` y persiste
- [ ] 3.3 Test: evento duplicado (mismo `event_id`) no genera segunda fila

## 4. Modelo de dominio: zonas críticas y detección de parada

- [ ] 4.1 Modelar `CriticalZone` (tabla + seed de datos de ejemplo con 2-3 zonas)
- [ ] 4.2 Calcular membresía de zona por posición (point-in-polygon o radio, según geometría elegida)
- [ ] 4.3 Calcular `stopped_since`/`stopped_duration` de forma incremental por vehículo
- [ ] 4.4 Test: secuencia de muestras detenidas actualiza `stopped_duration`; reanudar movimiento resetea el estado

## 5. Endpoint interno de lectura

- [ ] 5.1 Implementar `GET /internal/vehicles/state` (posición, zona actual, `stopped_duration` por vehículo)

## 6. Resiliencia

- [ ] 6.1 Implementar utilidad de circuit breaker reutilizable en `backend/shared/`
- [ ] 6.2 Aplicar el breaker en al menos una llamada saliente real de `ingestion-service` (o dejarla lista para `api-gateway` si este servicio no tiene llamadas salientes propias)
- [ ] 6.3 Test: breaker abre tras fallos consecutivos y falla rápido

## 7. Verificación funcional del bloque

- [ ] 7.1 `docker compose up` levanta redpanda + timescaledb + ingestion-service sin errores
- [ ] 7.2 `curl -X POST /v1/telemetry` con payload de ejemplo → verificar fila en TimescaleDB
- [ ] 7.3 Enviar 2 eventos con mismo `event_id` → verificar una sola fila
- [ ] 7.4 Enviar posición dentro de una `CriticalZone` con velocidad 0 repetida → verificar `stopped_duration` creciente vía `GET /internal/vehicles/state`

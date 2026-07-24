## Why

Durante la verificación en vivo de la app móvil (change `driver-experience-visual-refresh`), la única forma de confirmar que los eventos GPS del teléfono llegaban de verdad fue consultar TimescaleDB por `psql` a mano. El portal ya muestra el estado *derivado* de cada vehículo (posición actual, zona, tiempo detenido) pero no da visibilidad de los envíos individuales de telemetría a medida que ocurren — no hay forma de, seleccionando un vehículo, ver en el portal mismo "está llegando esto ahora" sin acceso a la base de datos.

## What Changes

- **`backend/api-gateway`**: nuevo endpoint `GET /v1/vehicles/{vehicle_id}/events/stream` (SSE) que reenvía cada evento crudo de telemetría (`event_id`, `vehicle_id`, `lat`, `lon`, `speed_kmh`, `timestamp`) tal como se publica en el tópico `telemetry.raw` de Redpanda, filtrado por `vehicle_id`. Se implementa con un único consumer en background (arrancado en el `lifespan`, igual patrón que `ingestion-service`) y un broadcaster en memoria con fan-out por `vehicle_id` — no un consumer nuevo por cada conexión SSE.
- **`backend/shared`**: se mueve `KafkaEventConsumer` (hoy solo en `ingestion-service/app/infrastructure/event_bus.py`) a `backend/shared/messaging.py`, ya que ahora lo usan dos servicios con un `group_id` distinto cada uno.
- **`frontend`**: seleccionar una fila del roster de vehículos abre un panel nuevo (`VehicleEventFeedPanel`) que consume el SSE anterior y muestra, en una lista scrolleable acotada (~50 filas), cada envío crudo recibido con su hora, posición y velocidad. Se cierra la conexión SSE al deseleccionar o cambiar de vehículo.

## Capabilities

### New Capabilities
_Ninguna._

### Modified Capabilities
- `api-gateway-core`: se agrega el requirement de exponer el stream de eventos crudos por vehículo, consumiendo Redpanda directamente (segundo consumer group independiente del de `ingestion-service`).
- `web-portal-dashboard`: se agrega el requirement de selección de vehículo y panel de feed de telemetría en vivo.

## Impact

- Código nuevo/modificado: `backend/shared/messaging.py` (nuevo, migrado desde `ingestion-service`), `backend/ingestion-service/app/infrastructure/event_bus.py` (actualiza el import del consumer movido, sin cambio de comportamiento), `backend/api-gateway/app/infrastructure/live_telemetry_broadcaster.py` (nuevo), `backend/api-gateway/app/interface/http.py` (nuevo endpoint SSE), `frontend/src/components/VehicleEventFeedPanel.tsx` (nuevo), `frontend/src/App.tsx` (estado `selectedVehicleId`).
- No afecta el consumer/offsets de `ingestion-service` (group_id propio, no se comparte) ni el esquema de TimescaleDB.
- No afecta `mobile/`, `infra/`, `load-testing/`.

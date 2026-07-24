## 1. Mover `KafkaEventConsumer` a `backend/shared`

- [x] 1.1 Crear `backend/shared/messaging.py` con `KafkaEventConsumer` (mismo contenido que hoy en `ingestion-service/app/infrastructure/event_bus.py`).
- [x] 1.2 Actualizar `backend/ingestion-service/app/infrastructure/event_bus.py` para importar `KafkaEventConsumer` desde `shared.messaging` (dejar `KafkaEventPublisher` donde está, solo lo usa este servicio).
- [x] 1.3 Correr los tests existentes de `ingestion-service` (`pytest`) para confirmar que el movimiento no rompió nada.

## 2. Backend: broadcaster + endpoint SSE en `api-gateway`

- [x] 2.1 Agregar a `backend/api-gateway/app/infrastructure/config.py`: `redpanda_brokers`, `kafka_topic` (default `telemetry.raw`), `kafka_consumer_group` (default `api-gateway-live-events`, distinto al de `ingestion-service`).
- [x] 2.2 `backend/api-gateway/app/infrastructure/live_telemetry_broadcaster.py`: clase que arranca un `KafkaEventConsumer` en background (`auto_offset_reset="latest"`, explícito y comentado por qué difiere de `ingestion-service`) y mantiene un `dict[str, list[asyncio.Queue]]` de suscriptores por `vehicle_id`, con `subscribe(vehicle_id) -> AsyncIterator[TelemetryEvent]` (registra/desregistra la queue con `try/finally`) y cola acotada (`maxsize`, descarta el evento más antiguo si se llena).
- [x] 2.3 Wiring en el `lifespan` de `app/interface/http.py`: arrancar el broadcaster al iniciar, detenerlo al apagar.
- [x] 2.4 Nuevo endpoint `GET /v1/vehicles/{vehicle_id}/events/stream` (SSE) usando `broadcaster.subscribe(vehicle_id)`.
- [x] 2.5 Tests: broadcaster con un fake consumer (reutilizar el patrón de fakes ya usado en `tests/fakes.py`) verificando fan-out por `vehicle_id` y limpieza de suscriptores al desconectar.

## 3. Frontend: selección de vehículo y feed en vivo

- [x] 3.1 `App.tsx`: estado `selectedVehicleId`; `VehicleRosterPanel` recibe `onSelect`/`selectedVehicleId` y marca visualmente la fila activa; click de nuevo sobre la misma fila deselecciona.
- [x] 3.2 `frontend/src/hooks/useVehicleEventFeed.ts`: hook que abre un `EventSource` a `/v1/vehicles/{id}/events/stream` cuando `vehicleId` no es null, cierra la conexión anterior al cambiar de `vehicleId` o desmontar, y acumula hasta ~50 eventos más recientes.
- [x] 3.3 `frontend/src/components/VehicleEventFeedPanel.tsx`: panel de ancho completo (fila nueva debajo del grid existente) que renderiza la lista del hook anterior; solo se muestra si hay un vehículo seleccionado.
- [x] 3.4 `npx tsc -b` limpio y verificación visual en navegador (Playwright headless): seleccionar un vehículo, confirmar que el panel aparece y no hay errores de consola.

## 4. Cierre

- [x] 4.1 Verificación end-to-end real: con el stack de `docker compose` arriba, enviar telemetría (curl o la app móvil) para un `vehicle_id`, seleccionarlo en el portal y confirmar que el evento aparece en el feed en vivo. (Playwright headless: seleccionada `veh-demo-critico`, 2 eventos enviados por curl, ambos aparecieron en el feed sin recargar, 0 errores de consola.)
- [x] 4.2 Actualizar `README.md`: documentar el nuevo endpoint y la feature del portal, y la nota de que el feed es efímero (no persiste tras un reinicio de `api-gateway`).
- [x] 4.3 `openspec validate vehicle-live-telemetry-feed --strict` sin errores.
- [x] 4.4 Commits en Conventional Commits por grupo de tareas completado.
- [x] 4.5 `openspec archive vehicle-live-telemetry-feed` al cerrar.

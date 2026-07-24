## Context

`api-gateway` hoy solo habla con `ingestion-service` vía HTTP (`GET /internal/vehicles/state`, envuelto en circuit breaker) y con Gemini; nunca toca Redpanda directamente. `ingestion-service` es el único consumer del tópico `telemetry.raw` (grupo `ingestion-service`), y persiste el estado derivado en TimescaleDB. El portal (`frontend`) consume `GET /v1/vehicles/stream`, que en `api-gateway` hace polling cada `vehicle_stream_interval_seconds` (3s) contra `GET /internal/vehicles/state` y reenvía el snapshot completo por SSE — es decir, ve *estado*, no *eventos*.

Verificar que la app móvil enviaba datos reales requirió consultar `vehicle_telemetry`/`processed_events` por `psql` a mano — no hay forma de ver esto desde el portal. Este change cierra ese hueco sin tocar el pipeline de persistencia existente.

## Goals / Non-Goals

**Goals:**
- Ver en el portal, para un vehículo seleccionado, cada evento crudo de telemetría a medida que se publica en Redpanda — no una versión derivada/muestreada.
- No competir con `ingestion-service` por particiones/offsets del tópico (consumer group propio).
- Escalar razonablemente con N conexiones SSE simultáneas sin abrir N consumers de Kafka.

**Non-Goals:**
- No se persiste historial de eventos en `api-gateway` (in-memory, efímero, se pierde al reiniciar el servicio — aceptable para un feed "en vivo", no un historial auditable).
- No se agrega un endpoint de historial paginado (`GET /vehicles/{id}/events?since=...`) — el feed solo muestra lo que llega desde que el usuario abre la conexión, hacia adelante. Si el usuario quiere ver el pasado, sigue existiendo la vía de auditoría por base de datos.
- No se envuelve el consumer de Redpanda en el `CircuitBreaker` existente — ese patrón está pensado para llamadas request/response a una dependencia externa (ingestion-service, Gemini) que pueden fallar rápido y degradar; un consumer de streaming tiene su propio ciclo de vida (reconexión de `aiokafka`, no un "call" puntual). Si Redpanda no está disponible al arrancar, el consumer de fondo reintenta con el comportamiento propio de `aiokafka`, y el endpoint SSE simplemente no emite eventos hasta que el consumer conecte (no rompe el resto de `api-gateway`).

## Decisions

1. **Segundo consumer group independiente sobre `telemetry.raw`, no una nueva tabla ni un nuevo tópico.** Redpanda ya soporta múltiples consumer groups leyendo el mismo tópico de forma independiente — es el patrón estándar para "un productor, múltiples consumidores con propósitos distintos" (aquí: persistencia en `ingestion-service` vs. visibilidad en vivo en `api-gateway`). Se descarta duplicar la publicación a un segundo tópico (innecesario) o hacer que `ingestion-service` reenvíe eventos a `api-gateway` por HTTP (acoplaría los dos servicios más de lo que ya están, y añadiría una llamada síncrona más para algo que ya es un evento).
2. **Un único consumer en background + broadcaster en memoria fan-out por `vehicle_id`, no un consumer por conexión SSE.** `api-gateway` arranca un solo `KafkaEventConsumer` en el `lifespan` (mismo patrón que el `_consume_loop` de `ingestion-service`). Cada evento consumido se publica a un broadcaster interno (`dict[vehicle_id, list[asyncio.Queue]]`); cada conexión SSE se suscribe registrando una `asyncio.Queue` bajo su `vehicle_id` y la desregistra al cerrarse. Esto evita que M clientes conectados abran M consumers de Kafka (un problema real de recursos/particiones si el portal se usara con varios operadores a la vez).
3. **`KafkaEventConsumer` se mueve a `backend/shared/messaging.py`.** Ya lo necesitan dos servicios con distinto `group_id`; es infraestructura genérica de aiokafka (deserializar `TelemetryEvent` desde el tópico), no lógica de negocio de ningún servicio — mismo criterio que ya llevó `models.py` y `resilience/circuit_breaker.py` a `shared/`. `KafkaEventPublisher` se queda donde está (solo lo usa `ingestion-service`, que es el único productor).
4. **`group_id` explícito y distinto por servicio** (`ingestion-service` vs. `api-gateway-live-events`), documentado en `config.py` de cada uno — un descuido aquí (compartir group_id) haría que ambos servicios compitieran por las mismas particiones y cada uno solo viera una fracción de los eventos, rompiendo silenciosamente la persistencia. Se deja como comentario explícito en el código, no solo en este documento.
5. **Frontend: panel de ancho completo debajo del grid existente, no un modal ni un panel que reemplace algo.** Aparece solo cuando `selectedVehicleId` no es null; seleccionar otra fila cierra el `EventSource` anterior antes de abrir el nuevo (un solo feed activo a la vez, evita conexiones SSE huérfanas acumulándose).

## Risks / Trade-offs

- **[Riesgo] El feed en memoria de `api-gateway` no sobrevive un reinicio del servicio** → **Mitigación:** es un non-goal explícito (ver arriba); el feed es "desde que te conectas hacia adelante", no un historial. Documentado en el README para que no se lea como una limitación no intencional.
- **[Riesgo] `auto_offset_reset` del nuevo consumer debe ser `"latest"`, no `"earliest"`** (a diferencia de `ingestion-service`, que sí necesita `"earliest"` para no perder eventos de persistencia) → si se copia el mismo consumer con `"earliest"`, al arrancar `api-gateway` reproduciría TODO el historial del tópico de una sola vez contra un feed pensado para "en vivo". Se documenta como parámetro explícito y distinto entre ambos usos de `KafkaEventConsumer`.
- **[Riesgo] Fuga de `asyncio.Queue`/suscriptores si un cliente SSE se desconecta abruptamente** (cierra la pestaña sin disparar limpieza) → **Mitigación:** desregistro en un bloque `finally` del generador SSE (se ejecuta incluso si la conexión se corta), mismo patrón que ya usa `_vehicle_event_stream` en el stream de estado existente.
- **[Trade-off] Sin backpressure real:** si un evento llega más rápido de lo que el cliente SSE puede consumir, la cola interna crece; se acota con un `maxsize` razonable en la `asyncio.Queue` (ej. 100) y se descartan eventos más viejos si se llena, priorizando "los más recientes" sobre "no perder ninguno" — aceptable para un feed de monitoreo en vivo, no para el pipeline de persistencia (que no se toca).

## Migration Plan

Sin migración de datos. Despliegue: reconstruir `api-gateway` (`docker compose up -d --build api-gateway`); `ingestion-service` no cambia de comportamiento (solo se mueve el import de `KafkaEventConsumer`, se verifica con sus tests existentes). Rollback: revertir el merge commit, sin impacto en datos persistidos.

## Open Questions

Ninguna bloqueante.

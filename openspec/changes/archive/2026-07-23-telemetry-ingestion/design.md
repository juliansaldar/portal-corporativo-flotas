## Context

Bloque A del PDF pide un pipeline de ingesta orientado a eventos con persistencia especializada para miles de dispositivos y resiliencia entre microservicios. No existe código previo — este change define la base sobre la que se apoyan los 4 changes restantes (agente, portal, móvil, caos/carga). Restricción real: el entorno de desarrollo es una sola máquina, por lo que el diseño debe poder correr completo con `docker compose up` sin exigir un clúster pesado.

## Goals / Non-Goals

**Goals**
- Ingreso HTTP desacoplado de la persistencia vía bus de eventos.
- Persistencia de series de tiempo justificada y con política de retención.
- Modelo de dominio suficiente para responder "vehículos detenidos +20 min en zonas críticas" (bloque B depende de esto).
- Circuit breaker reutilizable, listo para `api-gateway` (change `fleet-ai-agent`).

**Non-Goals**
- Autenticación/autorización de dispositivos (fuera de alcance del MVP; se documenta como pendiente).
- Múltiples tópicos/particionado avanzado de Kafka — un tópico (`telemetry.raw`) es suficiente para el volumen de este MVP.
- Analítica histórica (Druid) — no se implementa; ver Decisión 2.

## Decisions

### 1. Redpanda en vez de Kafka + Zookeeper
El PDF pide "un bus de eventos (ej. Kafka, RabbitMQ)". Redpanda es API-compatible con Kafka (mismos clientes/protocolo), corre en un solo contenedor sin Zookeeper, y consume una fracción de la RAM/CPU de un clúster Kafka real. Alternativa considerada: Kafka+Zookeeper real — descartada por costo de recursos locales sin beneficio funcional para este volumen; RabbitMQ — descartado porque el modelo de log-compacted topics de Kafka encaja mejor con reprocesar telemetría por rango de tiempo.

### 2. TimescaleDB como única base de persistencia (no Cassandra/Druid)
TimescaleDB (extensión de Postgres) da hypertables + compresión + políticas de retención, suficiente para miles de dispositivos en un MVP. Cassandra (escritura masiva multi-nodo) y Druid (OLAP a gran escala) resuelven problemas de escala que este MVP no tiene, y añaden complejidad operativa (clusters multi-nodo) que no se puede validar en el tiempo disponible. Se documenta como recorte justificado, no como omisión.

### 3. Dos microservicios reales, no un monolito
`ingestion-service` (ingress + consumer) y `api-gateway` (introducido en el change siguiente) son procesos/contenedores separados que se comunican por HTTP interno. Esto hace que el requisito de "Circuit Breakers en la comunicación entre microservicios" sea real y verificable, no solo una capa interna dentro de un mismo proceso.

### 4. Ingress y consumer en el mismo servicio/contenedor
Por tiempo, `ingestion-service` incluye ambos roles (proceso HTTP + tarea de consumo asíncrona) en el mismo contenedor en vez de desplegarlos por separado. Es un recorte consciente: en producción real se escalarían de forma independiente.

### 5. Dedup por `event_id` a nivel de consumer (no exactly-once de Kafka)
Se usa una tabla/índice único de `event_id` procesados recientemente en vez de configurar transacciones exactly-once de Kafka — más simple de implementar y suficiente para demostrar idempotencia frente al 10% de duplicados que inyecta el script de caos (change `chaos-load-testing-iac`).

### 6. Circuit breaker con `purgatory` (o `aiobreaker` si hay incompatibilidad con asyncio)
Librería ligera, sin dependencias pesadas, con soporte async nativo — se define aquí como utilidad compartida en `backend/shared/` para que `api-gateway` la reutilice en el change siguiente.

## Risks / Trade-offs

- **[Riesgo]** Un solo nodo de Redpanda/TimescaleDB es un punto único de falla → **Mitigación**: aceptable para un MVP de portafolio; se documenta en el README como límite conocido, no se resuelve en este change.
- **[Riesgo]** Ingress y consumer en el mismo contenedor puede ocultar problemas de backpressure real → **Mitigación**: se deja documentado como próximo paso de escalamiento independiente.
- **[Riesgo]** El cálculo de `stopped_duration` en tiempo real sobre streaming puede ser costoso si no se acota → **Mitigación**: se calcula de forma incremental por vehículo (última muestra vs. estado guardado), no recomputando todo el historial.

## Migration Plan

No aplica (green-field, no hay datos ni sistema previo que migrar).

## Open Questions

- ¿El umbral de velocidad para considerar un vehículo "detenido" (ej. < 2 km/h) y el número mínimo de muestras consecutivas? Se fija un valor razonable por defecto (configurable) y se documenta en el README; no bloquea la implementación.

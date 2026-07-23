## Context

`telemetry-ingestion` ya persiste el estado de vehículos con zonas críticas y `stopped_duration`. Este change añade el segundo microservicio (`api-gateway`) y el agente conversacional del Bloque B del PDF, reutilizando el `CircuitBreaker` ya construido para hacer real el requisito de "Circuit Breakers en la comunicación entre microservicios" (aquí: `api-gateway` → `ingestion-service`), y añadiendo un segundo uso del mismo breaker hacia una dependencia externa (Anthropic).

## Goals / Non-Goals

**Goals**
- Responder correctamente la pregunta ejemplo del PDF con datos reales de `ingestion-service`.
- Circuit breaker real en ambas llamadas salientes de `api-gateway`.
- Mantener el agente simple: un tool, sin estado conversacional complejo, sin framework de agentes.

**Non-Goals**
- Memoria de conversación persistente entre sesiones (fuera de alcance del MVP).
- Múltiples tools / razonamiento multi-paso complejo — un solo tool determinístico basta para el enunciado.
- Autenticación de usuarios del portal (se resuelve, si acaso, en `web-portal-dashboard` como mock).

## Decisions

### 1. Anthropic SDK directo con tool-use, sin LangChain/Semantic Kernel
El PDF menciona LangChain/Semantic Kernel como ejemplos ("etc."), no como requisito. Con un solo tool determinístico (`query_vehicle_state`), un framework de orquestación de agentes añade una capa de indirección y dependencias sin beneficio: el SDK oficial ya expone tool-use nativo. Alternativa considerada y descartada: LangChain con `AgentExecutor` — más código, más superficie de fallo, sin ganancia funcional para un solo tool.

### 2. `api-gateway` llama al endpoint interno de `ingestion-service` por HTTP, no acceso directo a TimescaleDB
Mantiene el límite de propiedad de datos: solo `ingestion-service` conoce el esquema de TimescaleDB. `api-gateway` consume `GET /internal/vehicles/state` vía `httpx.AsyncClient`, envuelto en el `CircuitBreaker` compartido — reutilización real de la utilidad de `telemetry-ingestion`, no una reimplementación.

### 3. Reutilización del `CircuitBreaker` de `backend/shared`, dos instancias independientes
Una instancia de `CircuitBreaker` para la llamada a `ingestion-service` y otra para Anthropic, con umbrales distintos (Anthropic es una API externa con más latencia esperable: `reset_timeout_seconds` más alto). Mismo código, distinta configuración por dependencia — evita acoplar el estado de un breaker a fallos no relacionados de la otra dependencia.

### 4. Streaming vía SSE nativo de FastAPI (`StreamingResponse`), no `sse-starlette`
El PDF permite "WebSockets o SSE"; SSE es suficiente para el chat (unidireccional servidor→cliente) y FastAPI ya soporta `StreamingResponse` con `text/event-stream` sin dependencias adicionales — un paquete extra no aporta nada aquí.

## Risks / Trade-offs

- **[Riesgo]** Si `ingestion-service` está caído, el agente no puede responder preguntas sobre estado real → **Mitigación**: el circuit breaker falla rápido y el endpoint de chat devuelve un mensaje explícito ("no puedo consultar el estado de la flota en este momento") en vez de colgarse.
- **[Riesgo]** Costo/latencia de la API de Anthropic en cada pregunta → **Mitigación**: aceptable para un MVP de portafolio; no se implementa cache de respuestas.
- **[Riesgo]** Un solo tool puede ser insuficiente si el usuario pregunta algo fuera de "estado de vehículos" → **Mitigación**: el system prompt del agente deja explícito el alcance (estado de flota) y responde que no tiene esa información si la pregunta cae fuera de alcance.

## Migration Plan

No aplica (nuevo servicio, sin datos previos).

## Open Questions

- Ninguna bloqueante; el umbral exacto de `reset_timeout_seconds` para el breaker hacia Anthropic se deja configurable por env var con un valor por defecto razonable (60s).

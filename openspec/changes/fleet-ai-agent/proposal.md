## Why

El PDF (Bloque B) exige un agente que responda en lenguaje natural sobre el estado de la flota (ej. "¿qué vehículos llevan detenidos +20 min en zonas críticas?"). `telemetry-ingestion` ya expone ese estado (`GET /internal/vehicles/state`, con `stopped_duration` y zonas críticas) pero no hay forma de consultarlo conversacionalmente ni un servicio orientado a cliente. Este change introduce `api-gateway`, el segundo microservicio, con el agente conectado al SDK de Anthropic.

## What Changes

- Nuevo servicio `api-gateway` (FastAPI) que expone endpoints orientados a cliente (portal web, en el change siguiente).
- Endpoint de chat `POST /v1/agent/chat` (streaming SSE) que usa el SDK oficial de Anthropic con **tool-use directo** (una sola tool determinística `query_vehicle_state`), sin LangChain/Semantic Kernel — evita la sobrecarga de un framework de agentes para un solo tool.
- La tool `query_vehicle_state` llama al endpoint interno de `ingestion-service` (`GET /internal/vehicles/state`), filtra por zona crítica y `stopped_duration`, y se lo devuelve al modelo para que redacte la respuesta en lenguaje natural.
- Llamadas salientes de `api-gateway` (a `ingestion-service` y a la API de Anthropic) envueltas en el `CircuitBreaker` compartido de `backend/shared/resilience` (mismo utilitario del change `telemetry-ingestion`, sin reimplementarlo).
- Manejo de la API key de Anthropic solo server-side vía variable de entorno (`.env`, nunca en el frontend/mobile de changes futuros).

## Capabilities

### New Capabilities
- `api-gateway-core`: servicio `api-gateway`, su llamada resiliente (circuit breaker) al endpoint interno de `ingestion-service`, y manejo seguro de secretos.
- `fleet-ai-agent`: agente Anthropic con tool-use (`query_vehicle_state`), endpoint de chat con streaming SSE, circuit breaker sobre la llamada a Anthropic.

### Modified Capabilities
_Ninguna — `service-resilience` (de `telemetry-ingestion`) se reutiliza tal cual, sin cambiar sus requirements; este change solo agrega nuevos consumidores del mismo utilitario._

## Impact

- Código nuevo: `backend/api-gateway/` (completo, misma estructura Clean Architecture que `ingestion-service`).
- Dependencias nuevas: `fastapi`, `httpx` (cliente HTTP a `ingestion-service`), `anthropic` (SDK oficial), `sse-starlette` o streaming nativo de FastAPI.
- Infraestructura: nuevo servicio `api-gateway` en `docker-compose.yml`, variable de entorno `ANTHROPIC_API_KEY` vía `.env` (no versionado) + `.env.example` documentado.
- Habilita: `web-portal-dashboard` (consume el chat y el estado vía `api-gateway`).

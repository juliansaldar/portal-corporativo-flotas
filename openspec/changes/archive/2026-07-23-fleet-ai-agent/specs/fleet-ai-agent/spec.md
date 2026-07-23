## ADDED Requirements

### Requirement: Tool `query_vehicle_state`
El agente SHALL poder consultar el estado actual de los vehículos filtrando por zona crítica y/o umbral de tiempo detenido, usando el SDK oficial de Anthropic con tool-use directo (sin framework de agentes).

#### Scenario: Responde la pregunta ejemplo del PDF
- **WHEN** un usuario pregunta "¿qué vehículos llevan detenidos más de 20 minutos en zonas críticas?"
- **THEN** el agente invoca `query_vehicle_state` con un filtro de `stopped_duration >= 1200s` restringido a vehículos dentro de una `CriticalZone`, y responde listando exactamente esos vehículos

### Requirement: Chat con streaming
El endpoint de chat SHALL transmitir la respuesta del asistente de forma incremental vía SSE.

#### Scenario: Streaming incremental
- **WHEN** se hace una petición de chat a `POST /v1/agent/chat`
- **THEN** el cliente recibe la respuesta como un stream de eventos SSE, no como una única respuesta bloqueante

### Requirement: Resiliencia sobre la llamada a Anthropic
El endpoint de chat SHALL envolver sus llamadas a la API de Anthropic en el `CircuitBreaker` compartido.

#### Scenario: Fallback claro si Anthropic no responde
- **WHEN** el circuit breaker hacia Anthropic está abierto
- **THEN** el endpoint de chat responde con un mensaje de error claro en vez de dejar la petición colgada

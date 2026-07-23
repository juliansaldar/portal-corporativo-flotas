## 1. Scaffold api-gateway

- [x] 1.1 Crear estructura Clean Architecture en `backend/api-gateway/` (`domain/`, `application/`, `infrastructure/`, `interface/`), `requirements.txt`, `Dockerfile`
- [x] 1.2 Añadir `api-gateway` a `docker-compose.yml` (env `ANTHROPIC_API_KEY`, `INGESTION_SERVICE_URL`), crear `.env.example`

## 2. Cliente resiliente a ingestion-service

- [x] 2.1 Implementar cliente HTTP (`httpx.AsyncClient`) hacia `GET /internal/vehicles/state` de `ingestion-service`
- [x] 2.2 Envolver la llamada en una instancia de `CircuitBreaker` (de `backend/shared/resilience`)
- [x] 2.3 Test: breaker se abre si el cliente falla repetidamente (fake HTTP client que lanza error)

## 3. Agente Anthropic (tool-use directo)

- [x] 3.1 Definir la tool `query_vehicle_state` (filtros: zona crítica, `stopped_duration_min_seconds`) y su ejecución contra el cliente de `ingestion-service`
- [x] 3.2 Implementar el loop de tool-use con el SDK de Anthropic (system prompt acotado al dominio de flota)
- [x] 3.3 Envolver la llamada a Anthropic en una segunda instancia de `CircuitBreaker`
- [x] 3.4 Test: dado un estado de flota fake, la tool filtra correctamente por zona + `stopped_duration >= 1200s`

## 4. Endpoint de chat

- [x] 4.1 Implementar `POST /v1/agent/chat` con `StreamingResponse` (SSE) que consume el loop del agente
- [x] 4.2 Manejar `CircuitBreakerOpenError` (Anthropic o ingestion-service) devolviendo un mensaje de error claro en el stream, no un colgado
- [x] 4.3 Exponer `GET /v1/vehicles/state` (passthrough sin filtros al mismo cliente/breaker de ingestion-service) — lo necesitará `web-portal-dashboard` para el mapa; se añade aquí por ser trivial reuso del mismo cliente, no un capability nuevo

## 5. Verificación funcional del bloque

- [ ] 5.1 `docker compose up` levanta `api-gateway` junto al resto del stack sin errores
- [ ] 5.2 Con datos de telemetría de prueba (vehículo detenido en una `CriticalZone` sembrada), preguntar "¿qué vehículos llevan detenidos más de 20 minutos en zonas críticas?" vía `POST /v1/agent/chat` y confirmar que la respuesta lista el vehículo correcto
- [ ] 5.3 Apagar `ingestion-service` y confirmar que el chat responde con el mensaje de fallback (breaker abierto) en vez de colgarse

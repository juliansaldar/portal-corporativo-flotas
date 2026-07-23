## 1. Backend: stream de vehículos en api-gateway

- [ ] 1.1 Implementar `GET /v1/vehicles/stream` (SSE) en `api-gateway` reutilizando `IngestionServiceClient`/`CircuitBreaker` ya existentes, con intervalo de polling configurable
- [ ] 1.2 Test: el stream emite un evento de error legible (no corta la conexión) si el breaker está abierto

## 2. Scaffold del frontend

- [ ] 2.1 Crear proyecto Vite + React (TypeScript) en `frontend/`
- [ ] 2.2 Copiar y aplicar branding de `./info/` (`theme_colors.json` → variables CSS, `logo.png`, `favicon.svg`)
- [ ] 2.3 Layout base del dashboard (header con logo, tres paneles: mapa, alertas, chat)

## 3. Mapa reactivo

- [ ] 3.1 Hook `useVehicleStream` que consume `GET /v1/vehicles/stream` vía `EventSource`
- [ ] 3.2 Componente de mapa (`react-leaflet` + tiles OSM) que renderiza un marcador por vehículo y lo actualiza en cada evento

## 4. Panel de alertas

- [ ] 4.1 Función pura que deriva "vehículos en alerta" del mismo estado del stream (zona crítica + `stopped_duration_seconds >= umbral`)
- [ ] 4.2 Componente de panel de alertas, resaltando también el vehículo en el mapa cuando está en alerta

## 5. Chat con el agente

- [ ] 5.1 Utilidad de parseo SSE sobre `fetch` (sin librería externa) para `POST /v1/agent/chat`
- [ ] 5.2 Hook `useAgentChat` (historial de mensajes + estado de streaming) y componente de chat

## 6. Docker y verificación funcional

- [ ] 6.1 Añadir `frontend` a `docker-compose.yml` (Vite dev server)
- [ ] 6.2 `docker compose up` levanta el stack completo (4 servicios de app + redpanda + timescaledb) sin errores
- [ ] 6.3 Verificar en el navegador: el vehículo de prueba (`veh-100`) aparece en el mapa y en el panel de alertas
- [ ] 6.4 Verificar que el chat responde (sujeto a disponibilidad de créditos de Anthropic, ver change `fleet-ai-agent` tarea 5.2)

## Why

Con `telemetry-ingestion` y `fleet-ai-agent` ya funcionando, no existe todavía ninguna interfaz humana: el Bloque C del PDF exige un Portal Corporativo (SPA) que muestre el estado de la flota en un mapa, alerte sobre vehículos en zonas críticas, y permita chatear con el agente. Sin esto, el MVP no es demostrable para un usuario final.

## What Changes

- Nueva SPA en `frontend/` (React + Vite, sin Next.js/SSR) con tres vistas integradas en un dashboard: mapa, panel de alertas, chat.
- **Mapa reactivo**: posición de cada vehículo (MapLibre/Leaflet) actualizada en tiempo real.
- **Panel de alertas**: vehículos actualmente detenidos dentro de una `CriticalZone` por encima de un umbral, derivados del mismo stream (sin necesidad de un concepto de "alerta" nuevo en el backend).
- **Chat con el agente**: input + historial, consumiendo `POST /v1/agent/chat` (SSE) de `api-gateway`.
- **Modificación a `api-gateway`**: se agrega `GET /v1/vehicles/stream` (SSE) que empuja el estado de la flota periódicamente, para que el frontend no tenga que hacer polling manual del endpoint existente `GET /v1/vehicles/state`.
- **Branding**: `theme_colors.json`, `logo.png`, `favicon.svg`, `company_bg_*` de `./info/` aplicados al portal (tema oscuro, logo, favicon, fondo de login/landing).

## Capabilities

### New Capabilities
- `web-portal-dashboard`: la SPA en sí (mapa, panel de alertas derivadas, chat), consumiendo los endpoints de `api-gateway`.

### Modified Capabilities
- `api-gateway-core`: se añade el requirement de un endpoint de streaming (`GET /v1/vehicles/stream`, SSE) que empuja el estado de vehículos periódicamente, además del passthrough síncrono ya existente (`GET /v1/vehicles/state`).

## Impact

- Código nuevo: `frontend/` (completo — Vite + React, sin librerías de agente de estado pesadas, ya que el estado del dashboard es simple: lista de vehículos + historial de chat).
- Modifica: `backend/api-gateway/app/interface/http.py` (nuevo endpoint SSE), reutilizando el mismo `IngestionServiceClient` con su circuit breaker ya existente — no se duplica lógica de resiliencia.
- Infraestructura: nuevo servicio `frontend` en `docker-compose.yml`.
- No introduce dependencias externas de pago; MapLibre GL JS es open-source (a diferencia de Google Maps).

## Context

Primer y único frontend del MVP. Consume dos superficies ya existentes de `api-gateway` (`/v1/agent/chat`, y el nuevo `/v1/vehicles/stream`) sin tocar `ingestion-service` directamente. El usuario ya decidió React plano (Vite, sin Next.js/SSR) para este bloque.

## Goals / Non-Goals

**Goals**
- Ver la flota en un mapa en tiempo real sin recargar la página.
- Ver alertas de vehículos detenidos en zonas críticas sin tener que preguntarle al chat.
- Chatear con el agente desde la misma pantalla.
- Verse como un portal corporativo real (branding de `./info/`), no un scaffold genérico.

**Non-Goals**
- Autenticación de usuarios del portal (fuera de alcance; se documenta como pendiente).
- Persistencia del historial de chat entre sesiones/recargas.
- Build de producción optimizado (nginx + assets minificados) — para este MVP el contenedor corre el dev server de Vite.

## Decisions

### 1. React + Vite, SPA simple, sin router ni gestor de estado global
Un dashboard de una sola pantalla (mapa + alertas + chat) no necesita `react-router` ni Redux/Zustand: `useState`/`useEffect` y dos hooks propios (`useVehicleStream`, `useAgentChat`) bastan. Menos dependencias, más fácil de auditar.

### 2. Leaflet + OpenStreetMap (raster tiles), no MapLibre GL
Ambos son open-source y sin costo, pero Leaflet con tiles raster de OSM no requiere definir un style JSON ni gestionar sprites/glyphs — se integra en minutos vía `react-leaflet`. MapLibre GL (vectorial) se ve mejor pero pide más configuración inicial que no se justifica para un MVP con un puñado de marcadores.

### 3. SSE del stream de vehículos vía `EventSource` nativo; SSE del chat vía `fetch` + parser manual
`GET /v1/vehicles/stream` no lleva body, así que el `EventSource` nativo del navegador alcanza sin dependencias. `POST /v1/agent/chat` sí lleva body (el mensaje del usuario), y `EventSource` no soporta POST — para eso se usa `fetch` con lectura incremental del `ReadableStream` y un parser SSE propio (~20 líneas), en vez de sumar una librería como `@microsoft/fetch-event-source` para un caso tan acotado.

### 4. Alertas derivadas en el cliente, no un concepto nuevo en el backend
El "estado de alerta" (zona crítica + `stopped_duration_seconds >= umbral`) se calcula en el frontend a partir del mismo estado que ya llega por el stream, en vez de crear un endpoint/tabla de "alertas" en el backend. Evita duplicar el modelo de datos por una regla de UI. Trade-off: el umbral vive en el frontend y en la tool del agente por separado (ver Riesgos).

### 5. Docker: dev server de Vite, no build de producción
`docker compose` corre `vite --host` directamente. Para un MVP de portafolio evaluado en local, invertir tiempo en un pipeline de build + nginx no aporta a los criterios de evaluación (arquitectura, resiliencia, IA); se documenta como corte consciente.

## Risks / Trade-offs

- **[Riesgo]** El umbral de "alerta" (ej. 1200s) vive duplicado en frontend y en la tool del agente → **Mitigación**: se define como una única constante documentada en el README y en ambos lados se referencia el mismo valor por convención; no hay una fuente de verdad compartida en runtime, se acepta como límite conocido del MVP.
- **[Riesgo]** Polling periódico (no push real basado en eventos de Kafka) para el stream de vehículos → **Mitigación**: ya aceptado en el change `web-portal-dashboard`'s modificación a `api-gateway-core`; suficiente para la escala de este MVP.
- **[Riesgo]** Sin build de producción, el contenedor de frontend no refleja cómo se serviría en un entorno real → **Mitigación**: documentado explícitamente en el README como corte de alcance, no como descuido.

## Migration Plan

No aplica (nuevo servicio, sin usuarios previos).

## Open Questions

Ninguna bloqueante.

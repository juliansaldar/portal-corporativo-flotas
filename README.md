# Portal Corporativo de Monitoreo de Flotas

MVP de un portal de monitoreo de flotas con ingesta de telemetría en tiempo real, un agente de IA conversacional, un dashboard web y una app móvil offline-first para conductores. Desarrollado como take-home assessment (Senior Fullstack) siguiendo Spec-Driven Development con [OpenSpec](https://github.com/Fission-AI/OpenSpec) — el proceso completo (proposal → specs → design → tasks → implementación → archive) queda en `openspec/changes/archive/`, y el detalle de decisiones en [`PLAN.md`](./PLAN.md).

## Arquitectura

```
Mobile (Expo, offline-first) ─┐
                               ├─► ingestion-service ─► Redpanda ─► consumer ─► TimescaleDB
k6 (carga/caos) ───────────────┘         │        (grupo: ingestion-service)     │
                                          │ (circuit breaker)                    │
                                          ▼                                      │
Frontend (React) ─────────────────► api-gateway ◄── Gemini (tool-use) ──────────-┘
                    (circuit breaker)   │  │
                                        │  └─► GET /v1/vehicles/state (circuit breaker)
                                        └─────► Redpanda (grupo: api-gateway-live-events,
                                                 consumer independiente, solo lectura en vivo)
```

- **`backend/ingestion-service`** — ingress HTTP (`/v1/telemetry`, `/v1/telemetry/bulk`) → Redpanda (bus de eventos, API-compatible con Kafka) → consumer idempotente → TimescaleDB. Calcula `stopped_duration` y pertenencia a `CriticalZone` por vehículo.
- **`backend/api-gateway`** — REST/SSE, agente de IA (Gemini, tool-use directo sobre `query_vehicle_state`), llama a `ingestion-service` y a Gemini detrás de Circuit Breakers independientes. Además consume Redpanda directamente (segundo consumer group, independiente del de `ingestion-service`) para exponer `GET /v1/vehicles/{vehicle_id}/events/stream` — telemetría cruda en vivo por vehículo, sin pasar por el estado agregado.
- **`frontend`** — React + Vite: mapa (Leaflet), panel de alertas derivado del stream, chat con el agente, resumen de flota, roster de vehículos (seleccionable, con feed de telemetría en vivo) y guantera digital (ver nota de datos dummy más abajo).
- **`mobile`** — Expo/React Native: captura de coordenadas offline-first (cola SQLite) con sincronización en bloque al reconectar, con pantallas de Inicio/Rastreo/Guantera/SOS por pestañas.
- **`load-testing`** — script k6 de carga y caos (10% duplicados, 5% errores inyectados).
- **`infra`** — Terraform de referencia para AWS (documentación, **no se aplica**).

Cada bloque del enunciado (A-E) corresponde a un change de OpenSpec archivado: `telemetry-ingestion`, `fleet-ai-agent`, `web-portal-dashboard`, `driver-mobile-app`, `chaos-load-testing-iac`, `driver-experience-visual-refresh`, `vehicle-live-telemetry-feed`.

### Nota sobre datos de presentación (dummy)

El rediseño visual (change `driver-experience-visual-refresh`) sigue el mockup `info/simon_app_mockup_preview.html`. El roster de vehículos del portal y la "Guantera Digital" (portal y app móvil) muestran **placa, modelo, conductor y documentos (SOAT/tecnomecánica) de ejemplo** — datos de presentación fijos en `frontend/src/data/dummyVehicleProfiles.ts` y `mobile/src/data/dummyVehicleProfile.ts`, no telemetría real ni un backend de documentos. La posición, velocidad, zona y tiempo detenido que sí se muestran junto a ellos **sí son reales**, calculados por `ingestion-service` a partir de la telemetría. En la app móvil, las pestañas Guantera y SOS son vistas placeholder explícitas que no realizan ninguna llamada de red.

**El `vehicle_id` que la app móvil usa de verdad SHALL coincidir con el que resalta en el roster del portal** (mismo nombre de conductor/placa) — es configurable, no hardcodeado: la variable de entorno `VITE_MOBILE_VEHICLE_ID` (`docker-compose.yml`, servicio `frontend`) determina qué `vehicle_id` resuelve al perfil de ejemplo en vez de al hash genérico. Valor actual: **`ABC-123`** (renombrado desde `xyz-123` tras la verificación en dispositivo físico; la comparación en `getVehicleProfile`/`isMobileAppVehicle` es case-insensitive, ya que el campo de texto del teléfono no garantiza el mismo case que la variable de entorno). **Si cambias el `vehicle_id` en el campo de texto de la pantalla de Inicio de la app móvil, actualiza `VITE_MOBILE_VEHICLE_ID` al mismo valor y reconstruye el frontend** (`docker compose up -d --build frontend`) para que el portal siga mostrando el mismo vehículo.

## Cómo ejecutar

Requisitos: Docker + Docker Compose.

```bash
git clone git@github.com:juliansaldar/portal-corporativo-flotas.git
cd portal-corporativo-flotas

# Opcional pero necesario para el chat con IA: API key de Gemini (free tier
# disponible en https://aistudio.google.com/apikey)
cp backend/api-gateway/.env.example backend/api-gateway/.env
# editar backend/api-gateway/.env y pegar GEMINI_API_KEY

docker compose up -d --build
```

Servicios expuestos:

| Servicio | URL |
|---|---|
| Portal web | http://localhost:5173 |
| api-gateway | http://localhost:8002 |
| ingestion-service | http://localhost:8001 |
| TimescaleDB | localhost:5432 (postgres/postgres) |
| Redpanda (Kafka API) | localhost:19092 |

Al levantar, `ingestion-service` siembra automáticamente 3 `CriticalZone` de ejemplo en Bogotá (`zona-franca-norte`, `terminal-carga-sur`, `centro-ciudad`).

### Probar el flujo end-to-end manualmente

```bash
# Enviar una posición (detenido dentro de zona-franca-norte)
curl -X POST http://localhost:8001/v1/telemetry -H "Content-Type: application/json" \
  -d '{"event_id":"evt-1","vehicle_id":"veh-100","lat":4.7110,"lon":-74.0721,"speed_kmh":0.0,"timestamp":"2026-07-23T22:20:08Z"}'

# Ver el estado calculado (stopped_duration, zona)
curl http://localhost:8001/internal/vehicles/state

# Preguntarle al agente (requiere GEMINI_API_KEY configurada)
curl -N -X POST http://localhost:8002/v1/agent/chat -H "Content-Type: application/json" \
  -d '{"message":"¿Qué vehículos llevan detenidos más de 20 minutos en zonas críticas?"}'

# Ver los envíos de telemetría cruda de un vehículo en vivo (lo mismo que
# selecciona el portal al hacer click en una fila del roster) — sin esto,
# la única forma de confirmarlo era consultar TimescaleDB a mano
curl -N http://localhost:8002/v1/vehicles/veh-100/events/stream
```

El feed de `GET /v1/vehicles/{vehicle_id}/events/stream` es **efímero**: reenvía eventos crudos desde que te conectas hacia adelante (consumer group propio sobre `telemetry.raw`, independiente del de `ingestion-service`), no persiste historial ni sobrevive un reinicio de `api-gateway`. Para ver el pasado, la vía sigue siendo `vehicle_telemetry`/`processed_events` en TimescaleDB.

### App móvil (Expo)

```bash
cd mobile
cp .env.example .env   # editar EXPO_PUBLIC_INGESTION_SERVICE_URL con la IP LAN de tu máquina
npx expo start
```

Escanea el QR con la app **Cámara** del iPhone (abre en Expo Go) o con Expo Go en Android. El teléfono debe estar en la misma red WiFi que la máquina donde corre `docker compose`, y la URL debe apuntar a esa IP (no `localhost`, que en el teléfono se referiría a sí mismo).

### Prueba de carga y caos

```bash
k6 run load-testing/fleet-simulation.js
```

Simula ~200 vehículos concurrentes contra `ingestion-service`, inyectando ~5% de payloads inválidos y ~10% de duplicados. Verificado en este repo: 200 VUs, ~29k iteraciones, **100% de checks exitosos**, y `COUNT(*) = COUNT(DISTINCT event_id)` en `vehicle_telemetry` tras la corrida (cero duplicados reales, cero pérdida de datos).

### Infraestructura (Terraform)

`infra/` es solo documentación — **no se aplica**. Se puede validar sintácticamente sin credenciales de AWS:

```bash
cd infra
terraform init -backend=false
terraform validate
```

### Tests automatizados

```bash
cd backend/ingestion-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt && pytest
cd backend/api-gateway       && python -m venv .venv && source .venv/bin/activate && pip install -r requirements-dev.txt && pytest
cd frontend && npm install && npx tsc -b
cd mobile   && npm install && npx tsc --noEmit
```

## Auditoría de IA

Requisito fundamental de la prueba: casos reales donde el código generado con ayuda de IA agéntica resultó deficiente, inseguro o no escalable, y cómo se corrigió con criterio propio. Todos ocurrieron durante el desarrollo de este mismo repo (ver commits `fix(...)` en el historial de git para el diff exacto de cada uno):

1. **Esquema `event_id` tipado como `UUID` en vez de `TEXT`.** El modelo de dominio (`TelemetryEvent.event_id`) solo exige un string no vacío como idempotency key, no un formato UUID. Al probar la ingesta en vivo con un id realista tipo `evt-<timestamp>-1`, la inserción falló con `invalid UUID`. Se corrigió tipando la columna como `TEXT` en la migración — el esquema de base de datos no debe asumir un formato que el contrato del dominio nunca garantizó.

2. **`PRIMARY KEY (vehicle_id, ts)` en `vehicle_telemetry` descartaba eventos legítimos.** Esta constraint (pensada originalmente como una segunda capa de dedup) en realidad podía descartar silenciosamente dos eventos **distintos** del mismo vehículo si compartían el mismo timestamp — un caso real y no artificial. La deduplicación correcta ya la garantiza `processed_events` por `event_id`, antes de llegar a esta tabla. Se encontró al comparar `COUNT(*)` vs `COUNT(DISTINCT event_id)` tras la prueba de carga con k6, y se corrigió eliminando esa constraint (dejando un índice no-único para performance de consulta).

3. **`api-gateway` sin CORS habilitado.** Al probar el dashboard en un navegador real (no solo con `curl`), todas las peticiones del frontend hacia `api-gateway` fallaban con `blocked by CORS policy`. `curl` no lo detecta porque CORS es una política que solo aplican los navegadores. Se corrigió agregando `CORSMiddleware` con el origen del frontend configurado explícitamente — un recordatorio de que probar solo con `curl` no es suficiente para una SPA.

4. **Manejo de errores incompleto en dos endpoints de `api-gateway`.** El circuit breaker se implementó y probó con tests unitarios, pero al integrarlo: (a) el endpoint `GET /v1/vehicles/state` no capturaba `CircuitBreakerOpenError` y devolvía un `500` genérico en vez de un `503` claro; (b) el endpoint de chat solo capturaba `CircuitBreakerOpenError`, así que un error real de la API de Anthropic (ej. sin saldo) rompía el stream SSE en vez de degradar con un mensaje. Ambos se encontraron probando en vivo (apagando `ingestion-service`, y con una cuenta de Anthropic sin créditos respectivamente) y se corrigieron con manejo explícito de ambos casos.

5. **Decisión de diseño auditada y confirmada, no revertida:** el circuit breaker se implementó a mano (~60 líneas en `backend/shared/resilience/circuit_breaker.py`) en vez de sumar una librería como `purgatory` o `aiobreaker`. Se evaluó explícitamente antes de escribir código: para un patrón closed/open/half-open reutilizado en solo 3 puntos de llamada, una dependencia externa no aportaba nada que no se pudiera auditar directamente — y de hecho, tenerlo en el propio repo fue lo que permitió encontrar y corregir el caso 4 con confianza sobre su comportamiento exacto.

6. **`genai.Client(api_key=...)` construido de forma anticipada rompía el arranque del servicio.** Al migrar el agente de Anthropic a Gemini (`google-genai`), la primera versión generada construía el cliente en `GeminiChatModel.__init__`, invocado desde el `lifespan` de FastAPI al levantar `api-gateway`. A diferencia de `AsyncAnthropic`, `genai.Client` valida la api_key de forma síncrona en el constructor y lanza `ValueError` de inmediato si está vacía — algo que no se detectó leyendo el código, sino corriendo la suite de tests (`pytest`) inmediatamente después del cambio: tres tests que levantan `TestClient(app)` fallaron porque el propio arranque de la app crasheaba sin `GEMINI_API_KEY` configurada (el caso real de cualquier entorno de CI o de desarrollo sin la key a mano, incluyendo este mismo). Se corrigió difiriendo la construcción del cliente al primer `send()` real, de forma que la falta de key se manifiesta como un error de la llamada — ya cubierto por el circuit breaker y por el manejo de errores del endpoint de chat (caso 4) — y no como una caída del servicio completo.

7. **Dos fallas de la migración a Gemini que solo aparecieron probando con una API key real (no con tests unitarios ni leyendo código).** (a) El modelo por defecto generado, `gemini-2.5-flash`, responde `404 NOT_FOUND` ("no longer available to new users") para cualquier API key creada después de que Gemini reordenó su catálogo de modelos — un caso concreto de por qué fijar un nombre de modelo concreto sin verificar contra la API real es frágil; se corrigió apuntando al alias estable `gemini-flash-latest`. (b) Al reenviar el historial de conversación con un `function_call` ya resuelto, la API respondía `400 INVALID_ARGUMENT` exigiendo un `thought_signature` — un campo opaco que los modelos Gemini con "thinking" adjuntan a cada `function_call` y que debe reenviarse tal cual en el siguiente turno; no está documentado en el schema de `FunctionCall` de forma obvia y no lo hubiera anticipado el modelo generador sin ejecutar el flujo completo. Se corrigió propagando ese campo en el bloque normalizado `tool_use` sin que `agent_chat.py` necesite saber que existe. Ambos se encontraron y confirmaron corregidos preguntándole al agente en vivo la pregunta ejemplo del PDF ("¿qué vehículos llevan detenidos más de 20 minutos en zonas críticas?"), que respondió correctamente identificando el vehículo, la zona y el tiempo detenido.

## Decisiones y recortes conscientes

Detalle completo en el `design.md` de cada change archivado (`openspec/changes/archive/`). Resumen:

- Redpanda en vez de Kafka+Zookeeper; TimescaleDB en vez de Cassandra/Druid (recorte justificado, no omisión).
- Agente de IA con el SDK directo de Gemini (`google-genai`), sin LangChain (un solo tool determinístico no lo justifica). Migrado desde Anthropic durante el desarrollo para usar el free tier de Gemini — ver caso 6 de la Auditoría de IA; el puerto `ChatModelPort`/`ModelTurn` en `app/application/ports.py` ya estaba desacoplado del SDK concreto, así que el cambio de proveedor quedó contenido a un único adapter nuevo (`app/infrastructure/gemini_client.py`) sin tocar la capa de aplicación.
- Frontend sirve el dev server de Vite en Docker, no un build de producción con nginx.
- App móvil: tracking en foreground (no background real), sin build/publish real a App Store/Play Store. Mapa de la pantalla de Rastreo con `react-native-webview` + Leaflet/OpenStreetMap (mismo motor que el portal web) en vez de `react-native-maps`/`expo-maps`, para seguir funcionando en Expo Go sin dev client ni API key de Google Maps — ver change `mobile-tracking-map`.
- Terraform documental, no aplicado en una cuenta AWS real.
- **Verificado en vivo con `GEMINI_API_KEY` real:** el agente responde correctamente la pregunta ejemplo del PDF end-to-end (tool-use → filtro por zona crítica y tiempo detenido → respuesta en streaming SSE) — ver caso 7 de la Auditoría de IA para los dos problemas que solo aparecieron en esta verificación y cómo se corrigieron.
- **Verificado en un iPhone físico con Expo Go tras el rediseño de `driver-experience-visual-refresh`:** captura de GPS real, cola offline y sincronización en bloque confirmadas de punta a punta desde la nueva pantalla de Rastreo — el dispositivo capturó posiciones reales mientras estaba desconectado, y al reconectar disparó un único `POST /v1/telemetry/bulk` que `ingestion-service` deduplicó por `event_id` y persistió correctamente (verificado consultando `vehicle_telemetry`/`processed_events` en vivo). Durante el desarrollo previo a este rediseño no se había corrido en un dispositivo real (solo type-check y bundle de Metro exitoso, 642→616 módulos); esta fue la primera verificación en hardware real del bloque D del PDF.

## Video de sustentación

_En grabación — enlace a YouTube (no listado) se agregará al finalizar. Grabado en vivo con la `GEMINI_API_KEY` real (no mockeada), demostrando el flujo end-to-end funcionando de verdad. Incluye: arquitectura + demo funcional (incluyendo la pregunta ejemplo del PDF respondida por el agente) + 2 min mostrando `AGENTS.md` y el flujo `openspec new change → apply → archive` como evidencia de aceleración agéntica._

# Portal Corporativo de Monitoreo de Flotas

MVP de un portal de monitoreo de flotas con ingesta de telemetría en tiempo real, un agente de IA conversacional, un dashboard web y una app móvil offline-first para conductores. Desarrollado como take-home assessment (Senior Fullstack) siguiendo Spec-Driven Development con [OpenSpec](https://github.com/Fission-AI/OpenSpec) — el proceso completo (proposal → specs → design → tasks → implementación → archive) queda en `openspec/changes/archive/`, y el detalle de decisiones en [`PLAN.md`](./PLAN.md).

## Arquitectura

```
Mobile (Expo, offline-first) ─┐
                               ├─► ingestion-service ─► Redpanda ─► consumer ─► TimescaleDB
k6 (carga/caos) ───────────────┘         │                                        │
                                          │ (circuit breaker)                     │
                                          ▼                                       │
Frontend (React) ─────────────────► api-gateway ◄── Anthropic (tool-use) ─────────┘
                    (circuit breaker)     │
                                          └─► GET /v1/vehicles/state (circuit breaker)
```

- **`backend/ingestion-service`** — ingress HTTP (`/v1/telemetry`, `/v1/telemetry/bulk`) → Redpanda (bus de eventos, API-compatible con Kafka) → consumer idempotente → TimescaleDB. Calcula `stopped_duration` y pertenencia a `CriticalZone` por vehículo.
- **`backend/api-gateway`** — REST/SSE, agente de IA (Anthropic, tool-use directo sobre `query_vehicle_state`), llama a `ingestion-service` y a Anthropic detrás de Circuit Breakers independientes.
- **`frontend`** — React + Vite: mapa (Leaflet), panel de alertas derivado del stream, chat con el agente.
- **`mobile`** — Expo/React Native: captura de coordenadas offline-first (cola SQLite) con sincronización en bloque al reconectar.
- **`load-testing`** — script k6 de carga y caos (10% duplicados, 5% errores inyectados).
- **`infra`** — Terraform de referencia para AWS (documentación, **no se aplica**).

Cada bloque del enunciado (A-E) corresponde a un change de OpenSpec archivado: `telemetry-ingestion`, `fleet-ai-agent`, `web-portal-dashboard`, `driver-mobile-app`, `chaos-load-testing-iac`.

## Cómo ejecutar

Requisitos: Docker + Docker Compose.

```bash
git clone git@github.com:juliansaldar/portal-corporativo-flotas.git
cd portal-corporativo-flotas

# Opcional pero necesario para el chat con IA: API key de Anthropic
cp backend/api-gateway/.env.example backend/api-gateway/.env
# editar backend/api-gateway/.env y pegar ANTHROPIC_API_KEY

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

# Preguntarle al agente (requiere ANTHROPIC_API_KEY configurada y con saldo)
curl -N -X POST http://localhost:8002/v1/agent/chat -H "Content-Type: application/json" \
  -d '{"message":"¿Qué vehículos llevan detenidos más de 20 minutos en zonas críticas?"}'
```

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

## Decisiones y recortes conscientes

Detalle completo en el `design.md` de cada change archivado (`openspec/changes/archive/`). Resumen:

- Redpanda en vez de Kafka+Zookeeper; TimescaleDB en vez de Cassandra/Druid (recorte justificado, no omisión).
- Agente de IA con el SDK directo de Anthropic, sin LangChain (un solo tool determinístico no lo justifica).
- Frontend sirve el dev server de Vite en Docker, no un build de producción con nginx.
- App móvil: tracking en foreground (no background real), sin build/publish real a App Store/Play Store.
- Terraform documental, no aplicado en una cuenta AWS real.
- **Pendiente de retomar cuando haya créditos en la cuenta de Anthropic usada para pruebas:** verificación en vivo de una respuesta real del agente (el resto del pipeline — tool-use, filtros, streaming, manejo de errores — está implementado y cubierto por tests).
- **No verificado en este entorno:** la app móvil no se corrió en un simulador/dispositivo real durante el desarrollo (entorno headless sin Expo Go); se verificó type-check limpio y bundle de Metro exitoso (642 módulos). Queda pendiente probarla en un iPhone/Android real.

## Video de sustentación

_Pendiente — enlace a YouTube (no listado). Debe incluir: arquitectura + demo funcional (incluyendo la pregunta ejemplo del PDF respondida por el agente) + 2 min mostrando `AGENTS.md` y el flujo `openspec new change → apply → archive` como evidencia de aceleración agéntica._

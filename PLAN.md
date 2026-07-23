# Plan: Ejecutar la prueba técnica con Spec-Driven Development (OpenSpec)

## Contexto
El take-home ("Portal Corporativo de Monitoreo de Flotas") pide 5 bloques (ingesta orientada a eventos, agente de IA, portal web, app móvil offline-first, infra/caos), evaluando explícitamente el uso disciplinado de IA agéntica y la calidad arquitectónica. El usuario quiere ejecutarlo con **OpenSpec** (ya instalado globalmente, v1.5.0, schema `spec-driven`: proposal → specs → design → tasks → apply → archive), con **git de historial detallado** bajo la cuenta de GitHub `juliansaldar@gmail.com`. Decisiones ya confirmadas por el usuario:
- Backend: **Python + FastAPI** (no Node/NestJS ni Go).
- Agente de IA: **Anthropic Claude API** (SDK oficial, sin LangChain).
- Frontend: **React** (Vite, sin Next.js/SSR).
- Infraestructura: **Terraform solo como documentación** (no se aplica en AWS real; todo se ejecuta local vía Docker Compose).
- GitHub: **el usuario crea el repo manualmente** bajo su cuenta y comparte la URL; yo configuro el remote y hago commits/push a medida que avanza el trabajo (confirmando explícitamente antes del primer push, dado que es una acción visible/pública).

## Arquitectura y stack recomendado

```
repo/
├── AGENTS.md                 # reglas de trabajo para el IDE agéntico (equivalente a .cursorrules)
├── README.md                 # setup, arquitectura, Auditoría de IA, link al video
├── openspec/                 # generado por `openspec init` (changes/, specs/, project.md)
├── docker-compose.yml        # redpanda, timescaledb, ingestion-service, api-gateway, frontend
├── backend/
│   ├── shared/                # modelos/DTOs Pydantic compartidos
│   ├── ingestion-service/     # FastAPI: ingress HTTP + consumer Redpanda + TimescaleDB
│   └── api-gateway/           # FastAPI: REST/SSE + agente IA + llama a ingestion-service
├── frontend/                  # React + Vite (mapa, alertas realtime, chat)
├── mobile/                    # Expo/React Native (app conductor offline-first)
├── load-testing/              # script k6 (carga + caos)
└── infra/                     # Terraform (solo documentación/no aplicado)
```

**Decisiones clave y justificación (para `design.md` y para la Auditoría de IA):**
- **Redpanda** en vez de Kafka+Zookeeper: compatible con el API de Kafka, un solo contenedor, mucho más liviano en local — cumple el requisito ("ej. Kafka") con menor huella de recursos.
- **TimescaleDB** (Postgres + extensión) como única base de persistencia: hypertable + política de retención/compresión para telemetría de alta frecuencia. Se documenta por qué **no** se suma Cassandra/Druid (complejidad operativa innecesaria para un MVP de este volumen) — es un recorte justificado, no una omisión.
- **Dos microservicios reales** (no un monolito): `ingestion-service` (ingress HTTP + consumer Redpanda → TimescaleDB) y `api-gateway` (REST/SSE + agente IA + UI). `api-gateway` llama al endpoint interno de `ingestion-service` **envuelto en Circuit Breaker** (librería `purgatory` o `aiobreaker`), y también envuelve las llamadas a la API de Anthropic con otro breaker — dos ejemplos concretos y demostrables de resiliencia.
- **Agente de IA sin framework**: Anthropic SDK directo con tool-use (una sola tool determinística `query_vehicle_state`), evitando LangChain para un caso de un solo tool — más simple, más rápido, más fácil de auditar.
- Cada servicio backend sigue Clean Architecture: `domain/`, `application/` (casos de uso), `infrastructure/` (adapters: Redpanda, TimescaleDB, Anthropic, HTTP), `interface/` (routers FastAPI).
- **Modelo de dominio explícito para la pregunta ejemplo del PDF** ("¿qué vehículos llevan detenidos +20 min en zonas críticas?"): se modelan dos conceptos que el enunciado da por sentados y que si no se modelan, el agente no puede responder la pregunta de aceptación: (a) `CriticalZone`/geofence (polígono o círculo con nombre/severidad, semilla de datos de ejemplo), (b) estado derivado por vehículo `stopped_since`/`stopped_duration` (calculado en `ingestion-service` a partir de velocidad ≈ 0 sostenida). La tool del agente filtra por ambos.

## Flujo OpenSpec: 5 changes, uno por bloque del enunciado

Usando el schema por defecto (`proposal → specs → design → tasks`), en este orden de dependencia:

| # | Change (capability) | Bloque enunciado | Depende de |
|---|---|---|---|
| 1 | `telemetry-ingestion` | A: ingesta, persistencia, resiliencia (+ bootstrap del repo y docker-compose base) | — |
| 2 | `fleet-ai-agent` | B: agente conversacional | 1 |
| 3 | `web-portal-dashboard` | C: portal web reactivo | 1, 2 |
| 4 | `driver-mobile-app` | D: app móvil offline-first + CI/CD | 1 |
| 5 | `chaos-load-testing-iac` | E: caos/carga + IaC + hardening final | 1, 2, 3, 4 |

Para cada change, el ciclo es: `openspec new change <nombre>` → escribir/generar `proposal.md` → `specs/<capability>/spec.md` (requirements en SHALL/MUST con `#### Scenario` WHEN/THEN) → `design.md` (decisiones y trade-offs de la tabla anterior) → `tasks.md` (checklist `- [ ] N.M`) → implementar marcando tasks (`openspec apply` guía; commit por cada tarea o grupo de tareas completado) → `openspec archive <nombre>` al cerrar el bloque.

### Detalle por change

**1. `telemetry-ingestion`** — Bootstrap del repo (git init, `openspec init` con integración Claude Code, `AGENTS.md`, skeleton de carpetas, `docker-compose.yml` base) + endpoint ingress `POST /v1/telemetry` (valida, deduplica por idempotency key, publica a tópico `telemetry.raw` en Redpanda) + consumer que persiste en hypertable TimescaleDB + entidad `CriticalZone` (seed de zonas de ejemplo) + cómputo de `stopped_since`/`stopped_duration` por vehículo + circuit breaker de base en las llamadas internas.

**2. `fleet-ai-agent`** — Módulo del agente en `api-gateway`: tool `query_vehicle_state` (filtra por zona crítica y tiempo detenido, entre otros criterios) capaz de responder literalmente la pregunta ejemplo del PDF, endpoint de chat (streaming SSE), circuit breaker sobre la llamada a Anthropic, manejo de la API key solo server-side (`.env`, nunca en frontend/mobile).

**3. `web-portal-dashboard`** — React (Vite): mapa (MapLibre/Leaflet), feed de alertas vía SSE desde `api-gateway`, panel de chat conectado al endpoint del agente. Branding tomado de `./info/`: `theme_colors.json` se mapea a variables CSS/tema (Tailwind o CSS vars) del portal (dark theme, primary `#00ffc2`, secondary `#19b5ff`); `logo.png` y `favicon.svg` se usan como logo del header/sidebar y favicon (`index.html`); `company_bg_black.png`/`.svg`/`company_bg_white.png` como fondo de login/landing. Los archivos se copian a `frontend/src/assets/` (o `frontend/public/`) durante la implementación — `./info/` queda como fuente, no se edita.

**4. `driver-mobile-app`** — Expo/React Native: captura de GPS, cola offline en SQLite (expo-sqlite o WatermelonDB), sincronización en bloque al reconectar, workflow de GitHub Actions + config de Fastlane/EAS (config real, sin ejecutar builds de tienda).

**5. `chaos-load-testing-iac`** — Script k6 simulando cientos de vehículos contra `POST /v1/telemetry` con 10% de payloads duplicados (mismo idempotency key, valida el dedup) y 5% de payloads inválidos; Terraform de referencia (ECS/Fargate + RDS-Timescale + ALB) marcado explícitamente como no-aplicado; pulido final de README y Docker Compose completo.

## Git y GitHub
- `git init` local; `git config user.email/user.name` **solo en este repo** (no global) con los datos de `juliansaldar@gmail.com`.
- El usuario crea el repo **público** en GitHub (requisito explícito del PDF, sección 2 "Transparencia y Propiedad Intelectual") bajo esa cuenta. URL del remoto ya confirmada: `git@github.com:juliansaldar/portal-corporativo-flotas.git` → configuro `origin` con esa URL (SSH) y confirmo contigo antes del primer `git push` (acción pública).
- Rama por change (`change/telemetry-ingestion`, etc.) + PR a `main` por bloque, o commits directos a `main` si el tiempo aprieta — a decidir contigo al llegar ahí.
- Commits en **Conventional Commits**, uno por artefacto OpenSpec y uno por tarea/grupo de tareas completado, ej.:
  - `docs(openspec): add proposal for telemetry-ingestion`
  - `docs(openspec): add specs/design/tasks for telemetry-ingestion`
  - `feat(ingestion): add redpanda producer and idempotent consumer`
  - `feat(ingestion): add timescaledb hypertable + retention policy`
  - `chore(openspec): archive telemetry-ingestion`

## Entregables transversales
- **`AGENTS.md`** (ya existe vacío): reglas de arquitectura (Clean Architecture/DDD por servicio), obligatoriedad de pasar por un change OpenSpec antes de tocar código no trivial, stack fijado (FastAPI, sin LangChain, TimescaleDB, Redpanda), convención de commits. Es el artefacto que se muestra en el video como "entorno de trabajo agéntico".
- **Auditoría de IA en README**: se registra en vivo durante la implementación (mínimo 2 casos reales). Candidatos probables a vigilar (a confirmar o reemplazar con lo que realmente pase): (a) el IDE agéntico proponiendo una tabla Postgres plana sin hypertable/retención → corregido a TimescaleDB con política de retención; (b) proponiendo LangChain con vector store para un solo tool determinístico → corregido a llamada directa al SDK de Anthropic; (c) proponiendo guardar la API key en el cliente móvil/web → corregido a manejo server-side.
- **Video de sustentación** (5-10 min, YouTube **no listado**): arquitectura + demo funcional (incluyendo la pregunta ejemplo del PDF respondida en vivo por el agente) + 2 min mostrando `AGENTS.md` y el flujo `openspec new change → apply → archive` como evidencia de aceleración agéntica.
- **Assets de marca (`./info/`)**: usar cuando corresponda en vez de placeholders genéricos — `theme_colors.json` (tema dark del portal), `logo.png`/`favicon.svg` (logo/favicon web y, si aplica, ícono de la app móvil Expo), `company_bg_black.png`/`.svg`/`company_bg_white.png` (fondos de login/landing/splash). Se referencian principalmente en el change `web-portal-dashboard` y, si da tiempo, en el ícono/splash de `driver-mobile-app`. `./info/` es solo la fuente; los archivos usados se copian al proyecto correspondiente.

## Orden de ejecución (siguiente sesión de trabajo)
1. `openspec init` (seleccionar integración con Claude Code) + escribir `AGENTS.md` + `git init`.
2. Ejecutar el ciclo OpenSpec completo del change 1 (`telemetry-ingestion`) e implementarlo.
3. Repetir para changes 2, 3, 4 y 5 en el orden de la tabla.
4. Grabar el video y finalizar el README (incluyendo la Auditoría de IA ya poblada con casos reales).
5. Push final y (si se decide) apertura de PRs para revisión visual del historial.

## Verificación
- Cada change se valida con `openspec validate` antes de implementar y se prueba funcionalmente al cerrar (ej.: `docker compose up`, `curl`/Postman al ingress, ver el dato llegar a TimescaleDB, preguntarle algo al agente, ver el mapa/alerta en el dashboard, simular offline en el emulador móvil, correr el script k6).
- Antes de cerrar la prueba: releer los criterios de evaluación del PDF contra los 5 changes archivados para confirmar cobertura.

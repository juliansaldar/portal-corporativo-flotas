# Portal Corporativo de Monitoreo de Flotas

MVP de un portal de monitoreo de flotas con ingesta de telemetría en tiempo real, un agente de IA conversacional, un dashboard web y una app móvil offline-first para conductores. Desarrollado como take-home assessment (Senior Fullstack) siguiendo Spec-Driven Development con [OpenSpec](https://github.com/Fission-AI/OpenSpec).

## Arquitectura

Ver [`PLAN.md`](./PLAN.md) para el detalle completo de decisiones y [`AGENTS.md`](./AGENTS.md) para las reglas de trabajo agéntico usadas durante el desarrollo.

- **`backend/ingestion-service`** — ingesta HTTP → Redpanda (bus de eventos, API-compatible con Kafka) → consumer → TimescaleDB.
- **`backend/api-gateway`** — REST/SSE, agente de IA (Anthropic, tool-use directo), llama a `ingestion-service` y a Anthropic detrás de Circuit Breakers.
- **`frontend`** — React + Vite: mapa, alertas en tiempo real (SSE), chat con el agente.
- **`mobile`** — Expo/React Native: captura de coordenadas offline-first con sincronización en bloque.
- **`load-testing`** — script k6 de carga y caos (duplicados/errores inyectados).
- **`infra`** — Terraform de referencia (documentación, no aplicado).

## Cómo ejecutar

_Pendiente — se completa a medida que cada bloque (`openspec/changes/`) se implementa y archiva._

## Auditoría de IA

_Pendiente de poblar durante el desarrollo con casos reales (mínimo 2): decisión propuesta por el IDE agéntico que era deficiente/insegura/no escalable, y cómo se corrigió._

## Video de sustentación

_Pendiente — enlace a YouTube (no listado) al finalizar._

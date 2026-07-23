# AGENTS.md — Reglas de trabajo agéntico

Este repo es la entrega de un take-home assessment ("Portal Corporativo de Monitoreo de Flotas").
Se evalúa explícitamente el criterio con el que se dirige y audita el código generado por IA, no solo el resultado. Estas reglas son el contrato para cualquier IDE/agente que trabaje aquí.

## Stack (no renegociable sin actualizar `PLAN.md` y `openspec/config.yaml`)
- Backend: Python 3.12 + FastAPI, dos microservicios: `ingestion-service` y `api-gateway`.
- Bus de eventos: Redpanda (API-compatible con Kafka).
- Persistencia: TimescaleDB (Postgres + extensión). No usar Cassandra/Druid — decisión ya justificada (ver `design.md` del change `telemetry-ingestion`).
- Agente de IA: SDK oficial de Anthropic con tool-use directo. No introducir LangChain/Semantic Kernel ni vector stores para esto — es un solo tool determinístico.
- Frontend: React + Vite (sin Next.js/SSR).
- Mobile: Expo / React Native.
- IaC: Terraform es solo documentación de referencia — no se aplica en AWS real.

## Arquitectura
- Cada servicio backend sigue Clean Architecture: `domain/`, `application/` (casos de uso), `infrastructure/` (adapters), `interface/` (routers FastAPI). SOLID por encima de atajos.
- `api-gateway` llama a `ingestion-service` y a la API de Anthropic **siempre** detrás de un Circuit Breaker.
- El dominio de vehículos incluye `CriticalZone` (geofence) y el estado derivado `stopped_since`/`stopped_duration`: son requisito para responder la pregunta ejemplo del PDF ("¿qué vehículos llevan detenidos +20 min en zonas críticas?"). No simplificar a un modelo plano sin estos dos conceptos.

## Flujo de trabajo: Spec-Driven Development con OpenSpec
- Ningún cambio no trivial se escribe sin pasar antes por un change de OpenSpec: `proposal.md` → `specs/**/*.md` → `design.md` → `tasks.md` (schema `spec-driven`, ver `openspec/config.yaml`).
- Los 5 changes del proyecto y su orden están fijados en `PLAN.md` — no crear changes fuera de esa lista sin actualizar el plan primero.
- Marcar tasks (`- [ ] N.M`) a medida que se completan; no reescribir tasks.md fuera de ese formato.
- Archivar (`openspec archive <change>`) solo cuando todas las tareas del bloque estén implementadas y verificadas funcionalmente.

## Commits
- Conventional Commits. Un commit por artefacto OpenSpec creado y uno por tarea o grupo pequeño de tareas implementado. Nunca un commit único gigante por change.

## Seguridad
- Ninguna API key o secreto en el repo ni en código de frontend/mobile. Solo variables de entorno server-side (`.env`, nunca commiteado — usar `.env.example`).

## Auditoría de IA (obligatoria para la entrega)
- Cuando el agente/IDE proponga algo deficiente, inseguro o no escalable y se corrija, documentarlo de inmediato en la sección "Auditoría de IA" del `README.md` del repo (mínimo 2 casos reales, con el problema propuesto y la corrección aplicada).

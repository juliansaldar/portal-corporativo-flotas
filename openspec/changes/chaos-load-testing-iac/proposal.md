## Why

Es el único bloque del PDF (E) que todavía no existe: probar que el pipeline de ingesta aguanta carga simulada con duplicados/errores inyectados, y documentar cómo se llevaría esta arquitectura a la nube. Con los 4 bloques anteriores funcionando, este change cierra la cobertura funcional completa del enunciado.

## What Changes

- Script de carga/caos con **k6** (`load-testing/fleet-simulation.js`) que simula cientos de "vehículos" (VUs) enviando telemetría a `POST /v1/telemetry`, inyectando ~5% de payloads inválidos (dispara `422`) y ~10% de peticiones duplicadas (mismo `event_id`, valida el dedup real del sistema).
- **Terraform de referencia** (`infra/`) describiendo un despliegue plausible en AWS (ECS Fargate para los 3 servicios, RDS Postgres+Timescale o Timescale Cloud, ALB, ECR) — **documentación, no se aplica** (decisión ya tomada con el usuario).
- **Hardening final** de `docker-compose.yml` y del `README.md` principal: instrucciones de ejecución end-to-end de los 5 bloques, sección de IaC, y consolidación de la Auditoría de IA.

## Capabilities

### New Capabilities
- `chaos-load-testing`: script k6 con el escenario de carga y caos descrito arriba.
- `cloud-iac`: Terraform de referencia no aplicado, documentando el despliegue objetivo en AWS.

### Modified Capabilities
_Ninguna — no se cambia comportamiento de los servicios, solo se agregan herramientas de verificación e infraestructura de referencia._

## Impact

- Código nuevo: `load-testing/fleet-simulation.js`, `infra/*.tf`.
- Documentación: `README.md` final (instrucciones de ejecución, IaC, Auditoría de IA).
- No afecta servicios existentes; el script de carga es un cliente más de `ingestion-service`, igual que la app móvil o `curl`.

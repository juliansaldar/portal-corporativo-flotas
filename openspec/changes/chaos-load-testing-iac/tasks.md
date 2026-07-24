## 1. Script de carga y caos (k6)

- [x] 1.1 Escribir `load-testing/fleet-simulation.js`: perfil de carga (ramping-vus hasta ~200), payload realista por vehículo
- [x] 1.2 Inyectar ~5% de payloads inválidos (esperando `422`)
- [x] 1.3 Inyectar ~10% de duplicados (mismo `event_id` reenviado)
- [x] 1.4 Thresholds de k6 (tasa de fallo esperada acorde al caos inyectado, no un fallo real del sistema)

## 2. Terraform de referencia

- [x] 2.1 `infra/*.tf`: VPC básica, ECS Fargate (3 servicios: ingestion-service, api-gateway, redpanda), ALB, ECR
- [x] 2.2 Nota explícita sobre TimescaleDB gestionado en AWS (RDS no lo soporta out-of-the-box; alternativas documentadas, no resueltas en código) — ver `infra/README.md`
- [x] 2.3 `terraform validate` pasa sin errores de sintaxis

## 3. Hardening final y README

- [x] 3.1 Revisado `docker-compose.yml` completo (5 servicios: redpanda, timescaledb, ingestion-service, api-gateway, frontend) — levanta con un solo `docker compose up`; se agregaron healthchecks y `depends_on: condition: service_healthy` para todos
- [ ] 3.2 README principal — se completa en la tarea transversal "README final + Auditoría de IA + video" (fuera de este change, ver `PLAN.md`)
- [ ] 3.3 Enlace al video de sustentación — mismo motivo que 3.2

## 4. Verificación funcional

- [x] 4.1 Corrido `k6 run load-testing/fleet-simulation.js` contra el stack real en Docker: 200 VUs, ~29k iteraciones, 31625 checks — **100% exitosos**, `ingestion-service` nunca cayó
- [x] 4.2 Confirmado en TimescaleDB: `COUNT(*) = COUNT(DISTINCT event_id) = COUNT(processed_events)` (27479 en los tres) tras drenar el consumer — cero duplicados, cero pérdida, pese al 10% de reintentos inyectados. Encontrado y corregido en el camino: `PRIMARY KEY (vehicle_id, ts)` en `vehicle_telemetry` descartaba silenciosamente eventos legítimos con timestamp igual — ver Auditoría de IA en el README
- [x] 4.3 `terraform validate` en `infra/` sin errores ("Success! The configuration is valid.")

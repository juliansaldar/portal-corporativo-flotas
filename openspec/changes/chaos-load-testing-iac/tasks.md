## 1. Script de carga y caos (k6)

- [ ] 1.1 Escribir `load-testing/fleet-simulation.js`: perfil de carga (ramping-vus hasta ~200), payload realista por vehículo
- [ ] 1.2 Inyectar ~5% de payloads inválidos (esperando `422`)
- [ ] 1.3 Inyectar ~10% de duplicados (mismo `event_id` reenviado)
- [ ] 1.4 Thresholds de k6 (tasa de fallo esperada acorde al caos inyectado, no un fallo real del sistema)

## 2. Terraform de referencia

- [ ] 2.1 `infra/main.tf` + `variables.tf`: VPC básica, ECS Fargate (3 servicios), ALB, ECR
- [ ] 2.2 Nota explícita sobre TimescaleDB gestionado en AWS (RDS no lo soporta out-of-the-box; alternativas documentadas, no resueltas en código)
- [ ] 2.3 `terraform validate` pasa sin errores de sintaxis

## 3. Hardening final y README

- [ ] 3.1 Revisar `docker-compose.yml` completo (los 4 servicios de app + redpanda + timescaledb) levanta con un solo `docker compose up`
- [ ] 3.2 README principal: instrucciones de ejecución end-to-end, sección de IaC (aclarando que no se aplica), Auditoría de IA consolidada con los casos reales encontrados durante el desarrollo
- [ ] 3.3 Enlace (placeholder) al video de sustentación

## 4. Verificación funcional

- [ ] 4.1 Correr `k6 run load-testing/fleet-simulation.js` contra el stack en Docker, confirmar que no tumba `ingestion-service`
- [ ] 4.2 Confirmar en TimescaleDB que no hay filas duplicadas pese al 10% de reintentos inyectados
- [ ] 4.3 `terraform validate` en `infra/` sin errores

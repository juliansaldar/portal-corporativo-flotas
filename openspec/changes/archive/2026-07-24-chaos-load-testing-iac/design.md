## Context

Último change funcional del MVP. Todo lo demás ya corre en Docker Compose; falta demostrar que aguanta carga con caos inyectado, y dejar constancia de cómo se llevaría a producción en la nube (sin gastar tiempo/dinero real en aplicarlo).

## Goals / Non-Goals

**Goals**
- Demostrar de forma reproducible que la deduplicación y la validación del sistema funcionan bajo carga concurrente, no solo en pruebas unitarias.
- Dejar un Terraform de referencia honesto: suficiente para mostrar criterio arquitectónico, sin pretender ser production-ready.
- README final que un evaluador pueda seguir de punta a punta.

**Non-Goals**
- Aplicar el Terraform en una cuenta AWS real (decisión ya tomada con el usuario).
- Probar el límite real de throughput del sistema (no es un benchmark de performance, es una prueba de resiliencia funcional).

## Decisions

### 1. k6 en vez de JMeter
El PDF los da como alternativas equivalentes ("ej. k6, JMeter"). k6 usa JavaScript (mismo lenguaje que el frontend/mobile de este proyecto, cero contexto nuevo), corre como binario único sin JVM, y sus scripts son más legibles/auditable que un XML de JMeter.

### 2. Duplicados y errores inyectados en el propio script, no vía un proxy de caos
En vez de un proxy intermedio (ej. Toxiproxy) que inyecte fallas de red genéricas, el script construye directamente el 5%/10% de tráfico caótico como parte de su lógica — más simple y, sobre todo, ejercita el caso de negocio real (dedup por `event_id`, validación de payload), no solo fallas de infraestructura.

### 3. Terraform como documentación explícita, con banner de advertencia
Cada archivo `.tf` lleva un comentario al inicio dejando claro que es material de referencia y no debe aplicarse. Arquitectura de referencia: ECS Fargate (3 servicios), RDS Postgres (nota: TimescaleDB en RDS requiere Aurora/EC2 self-managed o Timescale Cloud — se documenta la alternativa, no se resuelve con código), ALB, ECR, VPC básica.

### 4. Terraform se valida sintácticamente (`terraform validate`), no se aplica
`terraform validate` no requiere credenciales de AWS ni crea recursos — corre offline contra la sintaxis y tipos de la configuración. Es la única verificación automatizable de este bloque sin violar la decisión de "no aplicar".

## Risks / Trade-offs

- **[Riesgo]** Un 5%/10% exacto es aproximado, no garantizado por corrida (aleatoriedad) → **Mitigación**: aceptable, el objetivo es ejercitar el comportamiento, no una proporción exacta certificada.
- **[Riesgo]** El Terraform de referencia no resuelve TimescaleDB gestionado en AWS de forma concreta → **Mitigación**: se documenta explícitamente como decisión pendiente de un spike futuro, no se inventa una solución no verificada.

## Migration Plan

No aplica.

## Open Questions

Ninguna bloqueante.

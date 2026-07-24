# Infraestructura (Terraform) — SOLO DOCUMENTACIÓN

**Esta carpeta no se aplica.** Es una referencia de cómo se llevaría este MVP a AWS, para demostrar criterio de infraestructura — no un módulo listo para producción. Decisión ya tomada con el usuario (ver `PLAN.md` en la raíz del repo).

## Qué describe

- VPC con 2 subredes públicas (para simplicidad de referencia; en producción real las tareas irían en subredes privadas detrás de NAT).
- 3 servicios en ECS Fargate: `ingestion-service`, `api-gateway`, y `redpanda` (self-hosted, ver nota abajo), cada uno con su repositorio ECR.
- Application Load Balancer enrutando a `api-gateway` (tráfico del portal/chat) e `ingestion-service` (ingress de telemetría, incluyendo la app móvil).
- RDS Postgres para `timescaledb` — **ver la nota de TimescaleDB abajo, es una decisión pendiente, no resuelta aquí.**
- `frontend`: en este reference se serviría como sitio estático (S3 + CloudFront) en vez de el dev server de Vite que corre en Docker Compose local — son entornos distintos a propósito (ver `design.md` de `web-portal-dashboard`, decisión 5).

## Nota sobre TimescaleDB gestionado en AWS

RDS Postgres **no** incluye la extensión `timescaledb` (no está en su lista de extensiones soportadas). Para un despliegue real hay dos caminos, ninguno implementado aquí:

1. **Timescale Cloud** (servicio gestionado del propio fabricante) — el más directo, pero es un proveedor externo adicional.
2. **Self-hosted en EC2** con la extensión instalada manualmente — más control, más carga operativa.

Este Terraform aprovisiona un RDS Postgres liso como placeholder de esa decisión pendiente; no se pretende que sea la solución final.

## Cómo validar (sin aplicar nada)

```bash
cd infra
terraform init -backend=false
terraform validate
```

`terraform validate` no requiere credenciales de AWS ni crea recursos — solo verifica sintaxis y tipos.

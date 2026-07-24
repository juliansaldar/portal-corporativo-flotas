# cloud-iac Specification

## Purpose
TBD - created by archiving change chaos-load-testing-iac. Update Purpose after archive.
## Requirements
### Requirement: Infraestructura de referencia no aplicada
El repositorio SHALL incluir Terraform que describa un despliegue plausible en AWS de los servicios del MVP, marcado explícitamente como documentación de referencia que no se aplica en una cuenta real.

#### Scenario: Terraform sintácticamente válido pero no aplicado
- **WHEN** se ejecuta `terraform validate` sobre `infra/`
- **THEN** la configuración es sintácticamente válida, y el README indica explícitamente que no debe ejecutarse `terraform apply` como parte de esta entrega


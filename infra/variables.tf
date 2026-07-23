variable "aws_region" {
  description = "Region de AWS para el despliegue de referencia"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefijo de nombre para todos los recursos"
  type        = string
  default     = "fleet-monitoring"
}

variable "container_images" {
  description = "Imagenes de ECR a desplegar por servicio (placeholder, se llenan en CI/CD real)"
  type = object({
    ingestion_service = string
    api_gateway       = string
    redpanda          = string
  })
  default = {
    ingestion_service = "REPLACE_ME:latest"
    api_gateway       = "REPLACE_ME:latest"
    redpanda          = "docker.redpanda.com/redpandadata/redpanda:v24.2.7"
  }
}

variable "db_password" {
  description = "Password de RDS Postgres (en un despliegue real: AWS Secrets Manager, no una variable plana)"
  type        = string
  default     = "CHANGE_ME_use_secrets_manager"
  sensitive   = true
}

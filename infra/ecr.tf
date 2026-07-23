resource "aws_ecr_repository" "ingestion_service" {
  name                 = "${var.project_name}/ingestion-service"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecr_repository" "api_gateway" {
  name                 = "${var.project_name}/api-gateway"
  image_tag_mutability = "IMMUTABLE"
}

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"
}

resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_cloudwatch_log_group" "ingestion_service" {
  name              = "/ecs/${var.project_name}/ingestion-service"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/ecs/${var.project_name}/api-gateway"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "redpanda" {
  name              = "/ecs/${var.project_name}/redpanda"
  retention_in_days = 14
}

# --- ingestion-service ---

resource "aws_ecs_task_definition" "ingestion_service" {
  family                   = "${var.project_name}-ingestion-service"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name         = "ingestion-service"
    image        = var.container_images.ingestion_service
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    environment = [
      { name = "REDPANDA_BROKERS", value = "redpanda.${var.project_name}.local:9092" },
      { name = "DATABASE_URL", value = "postgresql://postgres:${var.db_password}@${aws_db_instance.timescaledb.address}:5432/fleet" },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ingestion_service.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "ingestion_service" {
  name            = "${var.project_name}-ingestion-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ingestion_service.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.ingestion_service.arn
    container_name   = "ingestion-service"
    container_port   = 8000
  }
}

# --- api-gateway ---

resource "aws_ecs_task_definition" "api_gateway" {
  family                   = "${var.project_name}-api-gateway"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name         = "api-gateway"
    image        = var.container_images.api_gateway
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    environment = [
      { name = "INGESTION_SERVICE_URL", value = "http://${aws_lb.main.dns_name}/ingestion" },
    ]
    secrets = [
      # En un despliegue real: GEMINI_API_KEY vendria de AWS Secrets Manager,
      # nunca como variable de entorno plana en el repo.
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api_gateway.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "api_gateway" {
  name            = "${var.project_name}-api-gateway"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api_gateway.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api_gateway.arn
    container_name   = "api-gateway"
    container_port   = 8000
  }
}

# --- redpanda (self-hosted, single-node, sin persistencia duradera) ---
# Referencia unicamente: para produccion real se evaluaria MSK (Kafka gestionado)
# o Redpanda Cloud en vez de correrlo uno mismo en Fargate.

resource "aws_ecs_task_definition" "redpanda" {
  family                   = "${var.project_name}-redpanda"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([{
    name         = "redpanda"
    image        = var.container_images.redpanda
    portMappings = [{ containerPort = 9092, protocol = "tcp" }]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.redpanda.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

resource "aws_ecs_service" "redpanda" {
  name            = "${var.project_name}-redpanda"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.redpanda.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }
}

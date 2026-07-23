output "alb_dns_name" {
  description = "DNS del ALB (portal/chat en /, ingress de telemetria en /ingestion/*)"
  value       = aws_lb.main.dns_name
}

output "ecr_repository_urls" {
  value = {
    ingestion_service = aws_ecr_repository.ingestion_service.repository_url
    api_gateway       = aws_ecr_repository.api_gateway.repository_url
  }
}

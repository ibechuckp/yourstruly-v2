# DNS Records to add to Squarespace
output "dns_validation_records" {
  description = "DNS records to add to Squarespace for certificate validation"
  value = {
    for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }
}

output "cloudfront_dns_validation_records" {
  description = "DNS records for CloudFront certificate (may be same as above)"
  value = {
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  }
}

# After validation, add this to Squarespace
output "domain_dns_record" {
  description = "DNS record to point domain to CloudFront"
  value = {
    type  = "CNAME"
    name  = var.domain_name
    value = aws_cloudfront_distribution.main.domain_name
  }
}

output "www_dns_record" {
  description = "DNS record for www subdomain"
  value = {
    type  = "CNAME"
    name  = "www.${var.domain_name}"
    value = aws_cloudfront_distribution.main.domain_name
  }
}

# ECR Repository
output "ecr_repository_url" {
  description = "ECR repository URL for Docker push"
  value       = aws_ecr_repository.main.repository_url
}

# Database
output "database_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "database_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_url.arn
}

# Load Balancer
output "alb_dns_name" {
  description = "ALB DNS name (for testing before DNS cutover)"
  value       = aws_lb.main.dns_name
}

# CloudFront
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

# ECS
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.main.name
}

# Summary
output "deployment_summary" {
  description = "Summary of deployment"
  value       = <<-EOT

    ================================================
    YoursTruly AWS Deployment Summary
    ================================================

    1. ECR Repository: ${aws_ecr_repository.main.repository_url}

    2. To deploy your app:
       aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${aws_ecr_repository.main.repository_url}
       docker build -t ${var.project_name} .
       docker tag ${var.project_name}:latest ${aws_ecr_repository.main.repository_url}:latest
       docker push ${aws_ecr_repository.main.repository_url}:latest
       aws ecs update-service --cluster ${aws_ecs_cluster.main.name} --service ${aws_ecs_service.main.name} --force-new-deployment

    3. Add these DNS records to Squarespace:
       - CNAME: ${var.domain_name} → ${aws_cloudfront_distribution.main.domain_name}
       - CNAME: www.${var.domain_name} → ${aws_cloudfront_distribution.main.domain_name}

    4. Test via ALB (before DNS): https://${aws_lb.main.dns_name}
       (will show cert warning until DNS is configured)

    5. Production URL: https://${var.domain_name}

    ================================================
  EOT
}

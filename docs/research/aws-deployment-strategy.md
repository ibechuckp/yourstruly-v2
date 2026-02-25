# AWS Deployment Strategy for YoursTruly

*Research Date: February 25, 2026*

This document provides a comprehensive deployment strategy for the YoursTruly Next.js application on AWS, covering architecture options, security best practices, and a phased deployment approach.

---

## Table of Contents

1. [Architecture Comparison](#architecture-comparison)
2. [Recommended Architecture](#recommended-architecture)
3. [Security Best Practices](#security-best-practices)
4. [Database Strategy](#database-strategy)
5. [CDN & Static Assets](#cdn--static-assets)
6. [SSL/TLS Certificates](#ssltls-certificates)
7. [Environment Variables & Secrets](#environment-variables--secrets)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Monitoring & Logging](#monitoring--logging)
10. [Cost Estimates](#cost-estimates)
11. [Phased Deployment](#phased-deployment)
12. [Backup & Disaster Recovery](#backup--disaster-recovery)

---

## Architecture Comparison

### Option 1: AWS Amplify Hosting

**Best for:** Quick deployments, smaller teams, rapid iteration

**Pros:**
- Fully managed, zero-ops deployment
- Built-in CI/CD from GitHub/GitLab
- Automatic SSL certificates
- CDN (CloudFront) included
- Server-side rendering via Lambda@Edge
- Pay-per-use pricing (can be cheap at low traffic)

**Cons:**
- Less control over infrastructure
- Cold starts can affect SSR performance
- Some Next.js features may have delayed support
- Limited customization of Lambda configurations
- Vendor lock-in to Amplify build system

**Monthly Cost (estimated):** $15-75 for moderate traffic

---

### Option 2: ECS Fargate

**Best for:** Production workloads, full control, enterprise requirements

**Pros:**
- Full Docker container support
- No server management (serverless containers)
- Fine-grained resource control
- Auto-scaling based on CPU/memory
- Can run alongside other microservices
- No cold starts (always running)
- Better for complex applications

**Cons:**
- More complex setup
- Higher baseline cost (containers always running)
- Requires VPC, ALB, ECR setup
- More DevOps expertise needed

**Monthly Cost (estimated):** $50-300 depending on resources

---

### Option 3: EC2

**Best for:** Maximum control, specific hardware requirements, cost optimization at scale

**Pros:**
- Full server control
- Reserved instances for cost savings (up to 40%)
- Can optimize for specific workloads
- No container overhead
- Familiar for traditional ops teams

**Cons:**
- Manual server management (patching, scaling)
- Need to manage Auto Scaling Groups
- More complex security configuration
- Higher operational burden

**Monthly Cost (estimated):** $30-200

---

### Option 4: Lambda@Edge + OpenNext

**Best for:** Truly serverless, global edge deployment, variable traffic

**Pros:**
- Pay only for execution time
- Global edge deployment
- Infinite scalability
- No server maintenance

**Cons:**
- Cold starts impact performance
- Complex debugging
- 50MB deployment package limit
- Some Next.js features may not work
- OpenNext adds complexity layer

**Monthly Cost (estimated):** $5-100 (highly variable)

---

## Recommended Architecture

**Primary Recommendation: ECS Fargate with CloudFront**

For YoursTruly, a digital legacy platform that needs reliability, security, and the ability to handle media uploads/processing, ECS Fargate provides the best balance of control and operational simplicity.

### Architecture Diagram

```
                                    ┌─────────────────┐
                                    │   Route 53      │
                                    │   DNS           │
                                    └────────┬────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   CloudFront    │
                                    │   CDN           │
                                    └────────┬────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                ┌────────▼────────┐ ┌────────▼────────┐ ┌────────▼────────┐
                │   S3 Bucket     │ │   WAF           │ │   S3 Bucket     │
                │   (Static)      │ │   (Firewall)    │ │   (Media)       │
                └─────────────────┘ └────────┬────────┘ └─────────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │   Application   │
                                    │   Load Balancer │
                                    └────────┬────────┘
                                             │
                           ┌─────────────────┼─────────────────┐
                           │                 │                 │
                  ┌────────▼────────┐┌───────▼───────┐┌───────▼───────┐
                  │   ECS Fargate   ││ ECS Fargate   ││ ECS Fargate   │
                  │   Task 1        ││ Task 2        ││ Task N        │
                  └────────┬────────┘└───────┬───────┘└───────┬───────┘
                           │                 │                 │
                           └─────────────────┼─────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
     ┌────────▼────────┐            ┌────────▼────────┐            ┌────────▼────────┐
     │   RDS           │            │   ElastiCache   │            │   Supabase      │
     │   PostgreSQL    │            │   Redis         │            │   (Auth/RT)     │
     │   (Primary)     │            │   (Sessions)    │            │                 │
     └─────────────────┘            └─────────────────┘            └─────────────────┘
```

---

## Security Best Practices

### 1. VPC Configuration

```hcl
# Terraform example for VPC setup
resource "aws_vpc" "yourstruly" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "yourstruly-vpc"
  }
}

# Public subnets (for ALB)
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.yourstruly.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
}

# Private subnets (for ECS tasks, RDS)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.yourstruly.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
}
```

### 2. Security Groups

```hcl
# ALB Security Group - only allows HTTPS
resource "aws_security_group" "alb" {
  name        = "yourstruly-alb-sg"
  vpc_id      = aws_vpc.yourstruly.id
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  # Redirect HTTP to HTTPS
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ECS Tasks - only from ALB
resource "aws_security_group" "ecs_tasks" {
  name   = "yourstruly-ecs-sg"
  vpc_id = aws_vpc.yourstruly.id
  
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}

# RDS - only from ECS tasks
resource "aws_security_group" "rds" {
  name   = "yourstruly-rds-sg"
  vpc_id = aws_vpc.yourstruly.id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }
}
```

### 3. WAF Configuration

```hcl
resource "aws_wafv2_web_acl" "yourstruly" {
  name  = "yourstruly-waf"
  scope = "CLOUDFRONT"
  
  default_action {
    allow {}
  }
  
  # AWS Managed Rules - Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
    }
  }
  
  # Rate limiting
  rule {
    name     = "RateLimitRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitMetric"
    }
  }
  
  # SQL Injection protection
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSetMetric"
    }
  }
}
```

### 4. IAM Roles (Least Privilege)

```hcl
# ECS Task Execution Role
resource "aws_iam_role" "ecs_task_execution" {
  name = "yourstruly-ecs-task-execution"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Role (for application)
resource "aws_iam_role" "ecs_task" {
  name = "yourstruly-ecs-task"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

# S3 access for media uploads
resource "aws_iam_role_policy" "s3_access" {
  name = "yourstruly-s3-access"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ]
      Resource = [
        "${aws_s3_bucket.media.arn}/*"
      ]
    }]
  })
}

# Secrets Manager access
resource "aws_iam_role_policy" "secrets_access" {
  name = "yourstruly-secrets-access"
  role = aws_iam_role.ecs_task.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = [
        "arn:aws:secretsmanager:${var.region}:${var.account_id}:secret:yourstruly/*"
      ]
    }]
  })
}
```

---

## Database Strategy

### Option A: Continue with Supabase (Recommended Initially)

**Pros:**
- Already integrated with existing codebase
- Managed PostgreSQL with built-in auth
- Real-time subscriptions included
- Row-level security
- Lower operational burden

**Configuration for Production:**

```typescript
// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### Option B: AWS RDS PostgreSQL (Full AWS Integration)

**For future migration when you need:**
- VPC-level database security
- Tighter AWS integration
- Custom PostgreSQL extensions
- Multi-region replication

```hcl
resource "aws_db_instance" "yourstruly" {
  identifier     = "yourstruly-prod"
  engine         = "postgres"
  engine_version = "16.2"
  instance_class = "db.t4g.medium"  # ARM-based, cost-effective
  
  allocated_storage     = 100
  max_allocated_storage = 500
  storage_type          = "gp3"
  storage_encrypted     = true
  
  db_name  = "yourstruly"
  username = "yourstruly_admin"
  password = random_password.db_password.result
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.yourstruly.name
  
  multi_az               = true  # High availability
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"
  
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "yourstruly-final-snapshot"
  
  performance_insights_enabled = true
  
  tags = {
    Environment = "production"
  }
}
```

### Session Storage: ElastiCache Redis

```hcl
resource "aws_elasticache_cluster" "sessions" {
  cluster_id           = "yourstruly-sessions"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.yourstruly.name
}
```

---

## CDN & Static Assets

### CloudFront Distribution

```hcl
resource "aws_cloudfront_distribution" "yourstruly" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = ""
  price_class         = "PriceClass_100"  # US, Canada, Europe
  
  aliases = ["yourstruly.love", "www.yourstruly.love"]
  
  # Origin: Application Load Balancer
  origin {
    domain_name = aws_lb.yourstruly.dns_name
    origin_id   = "alb"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  # Origin: S3 for static assets
  origin {
    domain_name = aws_s3_bucket.static.bucket_regional_domain_name
    origin_id   = "s3-static"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.static.cloudfront_access_identity_path
    }
  }
  
  # Origin: S3 for media
  origin {
    domain_name = aws_s3_bucket.media.bucket_regional_domain_name
    origin_id   = "s3-media"
    
    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.media.cloudfront_access_identity_path
    }
  }
  
  # Default behavior: ALB (SSR)
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "alb"
    
    forwarded_values {
      query_string = true
      cookies {
        forward = "all"
      }
      headers = ["Host", "Origin", "Authorization"]
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 86400
    compress               = true
  }
  
  # Static assets (_next/static)
  ordered_cache_behavior {
    path_pattern     = "_next/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-static"
    
    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 31536000  # 1 year
    default_ttl            = 31536000
    max_ttl                = 31536000
    compress               = true
  }
  
  # Media files
  ordered_cache_behavior {
    path_pattern     = "media/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "s3-media"
    
    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 86400     # 1 day
    default_ttl            = 604800    # 1 week
    max_ttl                = 31536000  # 1 year
    compress               = true
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.yourstruly.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  web_acl_id = aws_wafv2_web_acl.yourstruly.arn
}
```

### S3 Buckets

```hcl
# Static assets bucket
resource "aws_s3_bucket" "static" {
  bucket = "yourstruly-static-${var.environment}"
}

resource "aws_s3_bucket_versioning" "static" {
  bucket = aws_s3_bucket.static.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Media uploads bucket
resource "aws_s3_bucket" "media" {
  bucket = "yourstruly-media-${var.environment}"
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://yourstruly.love"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle policy for media
resource "aws_s3_bucket_lifecycle_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  
  rule {
    id     = "transition-to-ia"
    status = "Enabled"
    
    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }
    
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}
```

---

## SSL/TLS Certificates

### ACM Certificate Setup

```hcl
# Certificate must be in us-east-1 for CloudFront
resource "aws_acm_certificate" "yourstruly" {
  provider          = aws.us_east_1
  domain_name       = "yourstruly.love"
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.yourstruly.love"
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation records
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.yourstruly.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
  
  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.yourstruly.zone_id
}

resource "aws_acm_certificate_validation" "yourstruly" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.yourstruly.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}
```

---

## Environment Variables & Secrets

### AWS Secrets Manager

```hcl
resource "aws_secretsmanager_secret" "app_secrets" {
  name = "yourstruly/production/app"
  
  tags = {
    Environment = "production"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets" {
  secret_id = aws_secretsmanager_secret.app_secrets.id
  
  secret_string = jsonencode({
    DATABASE_URL            = "postgresql://..."
    SUPABASE_SERVICE_KEY    = var.supabase_service_key
    OPENAI_API_KEY          = var.openai_api_key
    STRIPE_SECRET_KEY       = var.stripe_secret_key
    STRIPE_WEBHOOK_SECRET   = var.stripe_webhook_secret
    NEXTAUTH_SECRET         = random_password.nextauth_secret.result
    AWS_S3_BUCKET           = aws_s3_bucket.media.id
  })
}
```

### ECS Task Definition with Secrets

```hcl
resource "aws_ecs_task_definition" "yourstruly" {
  family                   = "yourstruly"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn
  
  container_definitions = jsonencode([{
    name  = "yourstruly"
    image = "${aws_ecr_repository.yourstruly.repository_url}:latest"
    
    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]
    
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "NEXT_PUBLIC_APP_URL", value = "https://yourstruly.love" },
      { name = "AWS_REGION", value = var.region }
    ]
    
    secrets = [
      {
        name      = "DATABASE_URL"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_URL::"
      },
      {
        name      = "SUPABASE_SERVICE_KEY"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:SUPABASE_SERVICE_KEY::"
      },
      {
        name      = "OPENAI_API_KEY"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:OPENAI_API_KEY::"
      },
      {
        name      = "STRIPE_SECRET_KEY"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:STRIPE_SECRET_KEY::"
      },
      {
        name      = "NEXTAUTH_SECRET"
        valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:NEXTAUTH_SECRET::"
      }
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.yourstruly.name
        "awslogs-region"        = var.region
        "awslogs-stream-prefix" = "ecs"
      }
    }
    
    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 60
    }
  }])
}
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: yourstruly
  ECS_CLUSTER: yourstruly-cluster
  ECS_SERVICE: yourstruly-service
  CONTAINER_NAME: yourstruly

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build, tag, and push image
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT
      
      - name: Download task definition
        run: |
          aws ecs describe-task-definition --task-definition yourstruly \
            --query taskDefinition > task-definition.json
      
      - name: Update task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: ${{ env.CONTAINER_NAME }}
          image: ${{ steps.build-image.outputs.image }}
      
      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

  notify:
    needs: build-and-deploy
    runs-on: ubuntu-latest
    if: always()
    steps:
      - name: Notify on success
        if: needs.build-and-deploy.result == 'success'
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"✅ YoursTruly deployed successfully to production!"}'
      
      - name: Notify on failure
        if: needs.build-and-deploy.result == 'failure'
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-type: application/json' \
            -d '{"text":"❌ YoursTruly deployment failed! Check GitHub Actions."}'
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## Monitoring & Logging

### CloudWatch Configuration

```hcl
# Log group
resource "aws_cloudwatch_log_group" "yourstruly" {
  name              = "/ecs/yourstruly"
  retention_in_days = 30
}

# Alarms
resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  alarm_name          = "yourstruly-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization is high"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.yourstruly.name
    ServiceName = aws_ecs_service.yourstruly.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "memory_high" {
  alarm_name          = "yourstruly-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Memory utilization is high"
  
  dimensions = {
    ClusterName = aws_ecs_cluster.yourstruly.name
    ServiceName = aws_ecs_service.yourstruly.name
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  alarm_name          = "yourstruly-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High 5xx error rate"
  
  dimensions = {
    LoadBalancer = aws_lb.yourstruly.arn_suffix
    TargetGroup  = aws_lb_target_group.yourstruly.arn_suffix
  }
  
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

### X-Ray Integration

```typescript
// instrumentation.ts
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { AWSXRayPropagator } from '@opentelemetry/propagator-aws-xray';
import { AWSXRayIdGenerator } from '@opentelemetry/id-generator-aws-xray';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';

export function register() {
  const provider = new NodeTracerProvider({
    idGenerator: new AWSXRayIdGenerator(),
  });
  
  provider.register({
    propagator: new AWSXRayPropagator(),
  });
  
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
    ],
  });
}
```

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    checks: {} as Record<string, boolean>
  };
  
  // Database check
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('users').select('count').limit(1);
    checks.checks.database = true;
  } catch {
    checks.checks.database = false;
    checks.status = 'degraded';
  }
  
  // Redis check (if used)
  // try {
  //   await redis.ping();
  //   checks.checks.redis = true;
  // } catch {
  //   checks.checks.redis = false;
  // }
  
  const statusCode = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

---

## Cost Estimates

### Tier 1: Starter (< 10k users/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 0.5 vCPU, 1GB, 1 task | $15-25 |
| RDS (or Supabase) | db.t4g.micro / Free tier | $0-15 |
| CloudFront | 100GB transfer | $10-15 |
| S3 | 50GB storage | $1-2 |
| ALB | Base + LCU | $20-25 |
| Route 53 | Hosted zone + queries | $1-2 |
| Secrets Manager | 5 secrets | $2-3 |
| CloudWatch | Basic monitoring | $5-10 |
| **Total** | | **$55-100/month** |

### Tier 2: Growth (10k-100k users/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 1 vCPU, 2GB, 2-4 tasks | $60-120 |
| RDS | db.t4g.small, Multi-AZ | $50-75 |
| ElastiCache | cache.t4g.micro | $15-20 |
| CloudFront | 500GB transfer | $50-60 |
| S3 | 200GB storage + IA | $10-15 |
| ALB | Increased LCU | $35-50 |
| WAF | Managed rules | $25-35 |
| Route 53 | Increased queries | $3-5 |
| Secrets Manager | 10 secrets | $5 |
| CloudWatch | Enhanced | $20-30 |
| **Total** | | **$275-415/month** |

### Tier 3: Scale (100k+ users/month)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| ECS Fargate | 2 vCPU, 4GB, 4-8 tasks | $200-400 |
| RDS | db.r6g.large, Multi-AZ | $300-400 |
| ElastiCache | cache.r6g.large cluster | $150-200 |
| CloudFront | 2TB transfer | $150-200 |
| S3 | 1TB + lifecycle | $30-50 |
| ALB | High traffic | $75-100 |
| WAF | Advanced rules | $50-75 |
| Shield Advanced | DDoS protection | $3,000 |
| **Total (without Shield)** | | **$1,000-1,500/month** |

### Cost Optimization Tips

1. **Use Savings Plans**: 1-year commitment = 20-30% savings on Fargate
2. **Reserved Instances**: 40% savings on RDS
3. **S3 Lifecycle Policies**: Move old media to IA/Glacier
4. **Right-size instances**: Start small, scale based on metrics
5. **Use Spot for non-critical**: Dev/staging environments

---

## Phased Deployment

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic infrastructure, staging environment

- [ ] Set up AWS account with Organizations (if not exists)
- [ ] Enable CloudTrail for audit logging
- [ ] Create VPC with public/private subnets
- [ ] Set up ECR repository
- [ ] Create staging ECS cluster
- [ ] Deploy to staging with Supabase (existing)
- [ ] Set up basic CloudWatch logging
- [ ] Configure ACM certificate

**Deliverables:**
- staging.yourstruly.love working
- CI/CD deploying to staging

### Phase 2: Security & Monitoring (Week 3-4)

**Goal:** Production-ready security

- [ ] Implement WAF rules
- [ ] Set up Secrets Manager
- [ ] Configure IAM roles (least privilege)
- [ ] Enable VPC Flow Logs
- [ ] Set up CloudWatch alarms
- [ ] Implement health checks
- [ ] Security group audit
- [ ] Enable GuardDuty

**Deliverables:**
- Security compliance checklist complete
- Monitoring dashboard operational

### Phase 3: Production Launch (Week 5-6)

**Goal:** Go live with production

- [ ] Create production ECS cluster
- [ ] Set up CloudFront distribution
- [ ] Configure DNS cutover plan
- [ ] Deploy to production
- [ ] Implement blue-green deployment
- [ ] Load testing (k6/Locust)
- [ ] DNS cutover
- [ ] Monitor for 48 hours

**Deliverables:**
- yourstruly.love live on AWS
- Zero-downtime deployment working

### Phase 4: Optimization (Week 7-8)

**Goal:** Cost and performance optimization

- [ ] Analyze CloudWatch metrics
- [ ] Right-size resources
- [ ] Implement auto-scaling
- [ ] Set up Savings Plans
- [ ] S3 lifecycle policies
- [ ] CDN cache optimization
- [ ] Database query optimization
- [ ] Consider ElastiCache for sessions

**Deliverables:**
- 20%+ cost reduction
- Documented runbook

---

## Backup & Disaster Recovery

### Backup Strategy

```hcl
# RDS Automated Backups
resource "aws_db_instance" "yourstruly" {
  # ... other config ...
  
  backup_retention_period = 30
  backup_window           = "03:00-04:00"
  
  # Enable deletion protection
  deletion_protection     = true
  skip_final_snapshot     = false
}

# S3 Versioning & Cross-Region Replication
resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_replication_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  role   = aws_iam_role.replication.arn
  
  rule {
    id     = "media-replication"
    status = "Enabled"
    
    destination {
      bucket        = aws_s3_bucket.media_replica.arn
      storage_class = "STANDARD_IA"
    }
  }
}
```

### Recovery Time Objectives

| Scenario | RTO | RPO | Strategy |
|----------|-----|-----|----------|
| Single task failure | 2 min | 0 | ECS auto-restart |
| AZ failure | 5 min | 0 | Multi-AZ ALB + RDS |
| Region failure | 4 hours | 1 hour | Cross-region DR |
| Data corruption | 30 min | 5 min | Point-in-time recovery |
| Complete disaster | 24 hours | 1 day | S3 cross-region + RDS snapshot |

### Disaster Recovery Runbook

```markdown
## DR Procedure: Region Failure

1. **Assess** (5 min)
   - Confirm regional outage via AWS Health Dashboard
   - Notify stakeholders

2. **Activate DR Region** (15 min)
   - Update Route 53 to point to DR region
   - Start DR ECS cluster
   - Promote RDS read replica to primary

3. **Verify** (10 min)
   - Run health checks
   - Test critical user flows
   - Monitor error rates

4. **Communicate** (ongoing)
   - Status page update
   - Customer notification if needed

5. **Post-Incident**
   - Incident report within 24 hours
   - Plan primary region recovery
```

---

## Next Steps

1. **Immediate**: Set up AWS account structure and enable billing alerts
2. **This week**: Create Terraform/Pulumi infrastructure code
3. **Next week**: Deploy staging environment
4. **Month 1**: Production launch with basic monitoring
5. **Month 2**: Optimization and advanced monitoring

---

*Document Version: 1.0*
*Last Updated: February 25, 2026*

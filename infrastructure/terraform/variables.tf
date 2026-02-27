variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "yourstruly"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "yourstruly.love"
}

# Database
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro" # Start small, scale later
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "yourstruly"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "yourstruly_admin"
}

# ECS
variable "ecs_cpu" {
  description = "Fargate task CPU units"
  type        = number
  default     = 512 # 0.5 vCPU
}

variable "ecs_memory" {
  description = "Fargate task memory in MB"
  type        = number
  default     = 1024 # 1 GB
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1 # Start with 1, auto-scale later
}

variable "container_port" {
  description = "Container port for the application"
  type        = number
  default     = 3000
}

# Supabase (keeping for auth/realtime)
variable "supabase_url" {
  description = "Supabase project URL"
  type        = string
  sensitive   = true
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_service_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

# API Keys
variable "openai_api_key" {
  description = "OpenAI API key"
  type        = string
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend API key for emails"
  type        = string
  sensitive   = true
}

variable "personaplex_url" {
  description = "PersonaPlex WebSocket URL"
  type        = string
  default     = ""
}

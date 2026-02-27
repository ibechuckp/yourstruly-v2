# Random password for RDS
resource "random_password" "db_password" {
  length  = 32
  special = false # Avoid special chars for connection string compatibility
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-db-subnet"
  description = "Database subnet group"
  subnet_ids  = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-db-subnet"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-db"

  # Engine
  engine               = "postgres"
  engine_version       = "16.6"
  instance_class       = var.db_instance_class
  parameter_group_name = "default.postgres16"

  # Storage
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = 100 # Auto-scale up to 100GB
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  port                   = 5432

  # Backup
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # High Availability (disable for cost savings initially)
  multi_az = false

  # Protection
  deletion_protection       = true
  skip_final_snapshot       = false
  final_snapshot_identifier = "${var.project_name}-final-snapshot"

  # Performance Insights
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Updates
  auto_minor_version_upgrade  = true
  allow_major_version_upgrade = false

  tags = {
    Name = "${var.project_name}-db"
  }
}

# Store database URL in Secrets Manager
resource "aws_secretsmanager_secret" "db_url" {
  name                    = "${var.project_name}/database-url"
  description             = "Database connection URL"
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "db_url" {
  secret_id = aws_secretsmanager_secret.db_url.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${var.db_username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${var.db_name}"
    DB_HOST      = aws_db_instance.main.address
    DB_PORT      = aws_db_instance.main.port
    DB_NAME      = var.db_name
    DB_USER      = var.db_username
    DB_PASSWORD  = random_password.db_password.result
  })
}

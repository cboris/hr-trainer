# Alibaba Cloud Infrastructure for Job Trainer
# This Terraform configuration creates the necessary infrastructure
# for deploying the Job Trainer application on Alibaba Cloud.

terraform {
  required_version = ">= 1.0"
  required_providers {
    alicloud = {
      source  = "aliyun/alicloud"
      version = ">= 1.220.0"
    }
  }
  backend "oss" {
    region = "ap-southeast-1"
    bucket = "job-trainer-terraform-state"
    prefix = "terraform/state"
  }
}

# Alibaba Cloud credentials are loaded from environment variables:
#   export ALICLOUD_ACCESS_KEY="your-access-key-id"
#   export ALICLOUD_SECRET_KEY="your-secret-access-key"
#
# Or use Alibaba Cloud CLI: aliyun configure
# See: https://registry.terraform.io/providers/aliyun/alicloud/latest/docs#authentication
provider "alicloud" {
  region = var.region
}

# Using Singapore region (ap-southeast-1) to avoid Chinese ICP registration requirements
# Other options: ap-southeast-5 (Jakarta), ap-northeast-1 (Tokyo), us-west-1 (Silicon Valley), eu-central-1 (Frankfurt)

# =============================================================================
# VPC & Networking
# =============================================================================

locals {
  zone_id = "ap-southeast-1a"
}

resource "alicloud_vpc" "main" {
  vpc_name   = "job-trainer-vpc"
  cidr_block = var.vpc_cidr
}

resource "alicloud_vswitch" "public" {
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = var.public_subnet_cidr
  zone_id      = local.zone_id
  vswitch_name = "job-trainer-public"
}

resource "alicloud_vswitch" "private" {
  vpc_id       = alicloud_vpc.main.id
  cidr_block   = var.private_subnet_cidr
  zone_id      = local.zone_id
  vswitch_name = "job-trainer-private"
}

# =============================================================================
# Security Groups
# =============================================================================

resource "alicloud_security_group" "app" {
  name        = "job-trainer-app-sg"
  vpc_id      = alicloud_vpc.main.id
  description = "Security group for Job Trainer application servers"
}

resource "alicloud_security_group_rule" "app_http" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "80/80"
  security_group_id = alicloud_security_group.app.id
  cidr_ip           = "0.0.0.0/0"
  description       = "Allow HTTP from anywhere"
}

resource "alicloud_security_group_rule" "app_https" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "443/443"
  security_group_id = alicloud_security_group.app.id
  cidr_ip           = "0.0.0.0/0"
  description       = "Allow HTTPS from anywhere"
}

resource "alicloud_security_group_rule" "app_ssh" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "22/22"
  security_group_id = alicloud_security_group.app.id
  cidr_ip           = var.admin_cidr
  description       = "Allow SSH from admin IP"
}

resource "alicloud_security_group" "database" {
  name        = "job-trainer-db-sg"
  vpc_id      = alicloud_vpc.main.id
  description = "Security group for Job Trainer database servers"
}

resource "alicloud_security_group_rule" "db_postgres" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "5432/5432"
  security_group_id = alicloud_security_group.database.id
  cidr_ip           = var.vpc_cidr
  description       = "Allow PostgreSQL from VPC"
}

resource "alicloud_security_group" "redis" {
  name        = "job-trainer-redis-sg"
  vpc_id      = alicloud_vpc.main.id
  description = "Security group for Job Trainer Redis"
}

resource "alicloud_security_group_rule" "redis" {
  type              = "ingress"
  ip_protocol       = "tcp"
  port_range        = "6379/6379"
  security_group_id = alicloud_security_group.redis.id
  cidr_ip           = var.vpc_cidr
  description       = "Allow Redis from VPC"
}

# =============================================================================
# ECS Instances (Application Servers)
# =============================================================================

resource "alicloud_instance" "app" {
  count = var.app_instance_count

  instance_name        = "job-trainer-app-${count.index + 1}"
  instance_type        = var.app_instance_type
  image_id             = var.app_image_id
  vswitch_id           = alicloud_vswitch.public.id
  security_groups      = [alicloud_security_group.app.id]
  key_name             = alicloud_ecs_key_pair.app.key_name
  internet_max_bandwidth_out = var.app_public_ip ? 10 : 0
  system_disk_category = "cloud_essd"
  system_disk_size     = 40

  user_data = base64encode(templatefile("${path.module}/templates/user_data.sh", {
    acr_endpoint   = var.acr_endpoint
    acr_namespace  = var.acr_namespace
    image_tag      = var.image_tag
    rds_endpoint   = alicloud_db_instance.main.connection_string
    redis_endpoint = alicloud_kvstore_instance.main.connection_domain
    oss_endpoint   = alicloud_oss_bucket.main.extranet_endpoint
  }))

  tags = {
    Environment = var.environment
    Application = "job-trainer"
    Role        = "app"
  }
}

resource "alicloud_ecs_key_pair" "app" {
  key_pair_name = "job-trainer-key"
  public_key    = var.ssh_public_key
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================

resource "alicloud_db_instance" "main" {
  engine           = "PostgreSQL"
  engine_version   = "16.0"
  instance_type    = var.rds_instance_type
  instance_storage = var.rds_storage
  instance_name    = "job-trainer-db"
  security_ips     = [var.vpc_cidr]
  vswitch_id       = alicloud_vswitch.private.id

  # Security
  ssl_action = "Close" # Enable in production with proper certificates

  tags = {
    Environment = var.environment
    Application = "job-trainer"
  }
}

resource "alicloud_rds_account" "main" {
  db_instance_id   = alicloud_db_instance.main.id
  account_name     = var.db_username
  account_password = var.db_password
  account_type     = "Super"
}

resource "alicloud_db_connection" "main" {
  instance_id   = alicloud_db_instance.main.id
  connection_prefix = "jobtrainer"
  port          = "5432"
}

# =============================================================================
# Redis (Tair)
# =============================================================================

resource "alicloud_kvstore_instance" "main" {
  db_instance_name  = "job-trainer-redis"
  instance_class    = var.redis_instance_class
  instance_type     = "Redis"
  engine_version    = "5.0"
  vswitch_id        = alicloud_vswitch.private.id
  security_ips      = [var.vpc_cidr]
  password          = var.redis_password
  backup_time       = "03:00Z"
  backup_period     = ["Monday", "Wednesday", "Friday"]

  tags = {
    Environment = var.environment
    Application = "job-trainer"
  }
}

# =============================================================================
# OSS Bucket (S3-compatible storage)
# =============================================================================

resource "alicloud_oss_bucket" "main" {
  bucket = "${var.project_name}-${var.environment}-storage"
  acl    = "private"

  lifecycle_rule {
    id      = "archive-old-files"
    prefix  = "archives/"
    enabled = true

    transitions {
      days          = 30
      storage_class = "IA"
    }

    transitions {
      days          = 90
      storage_class = "Archive"
    }
  }

  server_side_encryption_rule {
    sse_algorithm = "AES256"
  }

  versioning {
    status = "Enabled"
  }

  tags = {
    Environment = var.environment
    Application = "job-trainer"
  }
}

resource "alicloud_oss_bucket" "static" {
  bucket = "${var.project_name}-${var.environment}-static"
  acl    = "public-read"

  website {
    index_document = "index.html"
    error_document = "404.html"
  }

  cors_rule {
    allowed_origins = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }

  tags = {
    Environment = var.environment
    Application = "job-trainer"
  }
}

# =============================================================================
# Container Registry (ACR)
# Note: ACR Enterprise Edition is expensive. For hackathon/development,
# images can be built locally and transferred via SCP or a simpler registry.
# Uncomment below when ready for production ACR.
# =============================================================================

# resource "alicloud_cr_ee_instance" "main" {
#   instance_name = "job-trainer-acr"
#   instance_type = "Enterprise"
#   image_scanner = "ACR"
#   payment_type  = "PayAsYouGo"
# }
#
# resource "alicloud_cr_ee_namespace" "main" {
#   instance_id  = alicloud_cr_ee_instance.main.id
#   name         = var.acr_namespace
#   auto_create  = true
#   default_visibility = "PRIVATE"
# }
#
# resource "alicloud_cr_ee_repo" "app" {
#   instance_id = alicloud_cr_ee_instance.main.id
#   namespace   = alicloud_cr_ee_namespace.main.name
#   name        = "job-trainer"
#   repo_type   = "PRIVATE"
#   summary     = "Job Trainer application repository"
#   detail      = "Contains Docker images for the Job Trainer Next.js application"
# }

# =============================================================================
# SLB (Load Balancer)
# =============================================================================

resource "alicloud_slb_load_balancer" "main" {
  load_balancer_name = "job-trainer-slb"
  address_type       = "internet"
  load_balancer_spec = "slb.s1.small"
  vswitch_id         = alicloud_vswitch.public.id

  tags = {
    Environment = var.environment
    Application = "job-trainer"
  }
}

resource "alicloud_slb_listener" "http" {
  load_balancer_id          = alicloud_slb_load_balancer.main.id
  frontend_port             = 80
  backend_port              = 3000
  protocol                  = "http"
  bandwidth                 = -1
  health_check              = "on"
  health_check_connect_port = 3000
  health_check_uri          = "/api/health"
}

resource "alicloud_slb_listener" "https" {
  count = var.ssl_enabled ? 1 : 0

  load_balancer_id          = alicloud_slb_load_balancer.main.id
  frontend_port             = 443
  backend_port              = 3000
  protocol                  = "https"
  bandwidth                 = -1
  ssl_certificate_id        = var.ssl_certificate_id
  health_check              = "on"
  health_check_connect_port = 3000
  health_check_uri          = "/api/health"
}

resource "alicloud_slb_server_group" "app" {
  load_balancer_id = alicloud_slb_load_balancer.main.id
  name             = "job-trainer-app-servers"
}

resource "alicloud_slb_server_group_server_attachment" "app" {
  count = var.app_instance_count

  server_group_id = alicloud_slb_server_group.app.id
  server_id       = alicloud_instance.app[count.index].id
  port            = 3000
  weight          = 100
}

# =============================================================================
# Outputs
# =============================================================================

output "vpc_id" {
  description = "VPC ID"
  value       = alicloud_vpc.main.id
}

output "app_instance_ids" {
  description = "ECS instance IDs"
  value       = alicloud_instance.app[*].id
}

output "app_private_ips" {
  description = "Private IPs of app servers"
  value       = alicloud_instance.app[*].private_ip
}

output "app_public_ips" {
  description = "Public IPs of app servers"
  value       = alicloud_instance.app[*].public_ip
}

output "rds_connection_string" {
  description = "RDS connection string"
  value       = alicloud_db_instance.main.connection_string
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = alicloud_db_instance.main.port
}

output "redis_connection_domain" {
  description = "Redis connection domain"
  value       = alicloud_kvstore_instance.main.connection_domain
  sensitive   = true
}

output "oss_bucket_endpoint" {
  description = "OSS bucket endpoint"
  value       = alicloud_oss_bucket.main.extranet_endpoint
}

output "slb_address" {
  description = "SLB public address"
  value       = alicloud_slb_load_balancer.main.address
}

output "acr_endpoint" {
  description = "ACR registry endpoint"
  value       = "registry.${var.region}.cr.aliyuncs.com"
}

# =============================================================================
# General Configuration
# =============================================================================
# Alibaba Cloud credentials are loaded from environment variables:
#   export ALICLOUD_ACCESS_KEY="your-access-key-id"
#   export ALICLOUD_SECRET_KEY="your-secret-access-key"
# Or use: aliyun configure
# =============================================================================

variable "region" {
  description = "Alibaba Cloud region. Using Singapore to avoid Chinese ICP registration requirements."
  type        = string
  default     = "ap-southeast-1"

  validation {
    condition = contains([
      "ap-southeast-1",  # Singapore
      "ap-southeast-5",  # Jakarta
      "ap-northeast-1",  # Tokyo
      "us-west-1",       # Silicon Valley
      "eu-central-1",    # Frankfurt
      "eu-west-1",       # London
    ], var.region)
    error_message = "Region must be outside China to avoid ICP registration requirements."
  }
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "jobtrainer"
}

variable "environment" {
  description = "Deployment environment (dev, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be one of: dev, staging, production."
  }
}

# =============================================================================
# Networking
# =============================================================================

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR block for private subnet"
  type        = string
  default     = "10.0.10.0/24"
}

variable "admin_cidr" {
  description = "CIDR block allowed for SSH access to instances"
  type        = string
  default     = "0.0.0.0/0"

  validation {
    condition     = var.admin_cidr != "0.0.0.0/0"
    error_message = "Admin CIDR should be restricted to specific IP ranges in production."
  }
}

# =============================================================================
# ECS (Application Servers)
# =============================================================================

variable "app_instance_count" {
  description = "Number of ECS instances for the application"
  type        = number
  default     = 2

  validation {
    condition     = var.app_instance_count >= 1 && var.app_instance_count <= 10
    error_message = "Instance count must be between 1 and 10."
  }
}

variable "app_instance_type" {
  description = "ECS instance type for application servers"
  type        = string
  default     = "ecs.c6.xlarge" # 4 vCPU, 8 GiB
}

variable "app_image_id" {
  description = "ECS image ID (Alibaba Cloud Linux 3 or Ubuntu)"
  type        = string
  default     = "aliyun_3_x64_20G_alibase_20240528.vhd"
}

variable "app_public_ip" {
  description = "Whether to assign public IPs to ECS instances (set false when using SLB)"
  type        = bool
  default     = false
}

variable "ssh_public_key" {
  description = "SSH public key for ECS instance access"
  type        = string
  sensitive   = true
}

# =============================================================================
# Container Registry (ACR)
# =============================================================================

variable "acr_namespace" {
  description = "ACR Enterprise namespace name"
  type        = string
  default     = "jobtrainer"
}

variable "acr_endpoint" {
  description = "ACR registry endpoint for pulling images"
  type        = string
  default     = ""
}

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# =============================================================================
# RDS PostgreSQL
# =============================================================================

variable "rds_instance_type" {
  description = "RDS instance type"
  type        = string
  default     = "pg.n2.small.1" # 2 vCPU, 4 GiB
}

variable "rds_storage" {
  description = "RDS storage size in GB"
  type        = number
  default     = 20

  validation {
    condition     = var.rds_storage >= 20 && var.rds_storage <= 2000
    error_message = "Storage must be between 20 and 2000 GB."
  }
}

variable "db_username" {
  description = "Database administrator username"
  type        = string
  default     = "jobtrainer"
}

variable "db_password" {
  description = "Database administrator password"
  type        = string
  sensitive   = true
}

# =============================================================================
# Redis (Tair)
# =============================================================================

variable "redis_instance_class" {
  description = "Redis instance class"
  type        = string
  default     = "redis.master.small.default" # 1 GiB
}

variable "redis_password" {
  description = "Redis instance password"
  type        = string
  sensitive   = true
}

# =============================================================================
# SSL / HTTPS
# =============================================================================

variable "ssl_enabled" {
  description = "Whether to enable HTTPS listener on SLB"
  type        = bool
  default     = false
}

variable "ssl_certificate_id" {
  description = "Alibaba Cloud SSL certificate ID for HTTPS"
  type        = string
  default     = ""
}
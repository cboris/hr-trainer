# =============================================================================
# General Configuration
# Credentials loaded from environment variables:
#   export ALICLOUD_ACCESS_KEY="your-access-key-id"
#   export ALICLOUD_SECRET_KEY="your-secret-access-key"
# =============================================================================

# Singapore region - no ICP required, existing infrastructure here
region       = "ap-southeast-1"
project_name = "jobtrainer"
environment  = "production"

# =============================================================================
# Networking
# =============================================================================

vpc_cidr            = "10.0.0.0/16"
public_subnet_cidr  = "10.0.1.0/24"
private_subnet_cidr = "10.0.10.0/24"

# IMPORTANT: Restrict SSH access to your IP address
# Find your IP: curl ifconfig.me
admin_cidr = "82.192.251.28/32"

# =============================================================================
# ECS (Application Servers)
# =============================================================================

app_instance_count = 2
app_instance_type  = "ecs.n4.small"  # 1 vCPU, 2 GiB (demo)
app_public_ip      = false           # Set true only if not using SLB

# Generate SSH key: ssh-keygen -t ed25519 -C "job-trainer"
# Then paste the contents of ~/.ssh/job-trainer.pub below
ssh_public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDY5D9nzYWLZyUhpXmYeDaz4g7qE7u4sxfo92bDeISRKIpNN/KB/Y5JTe6RapGOe+bpgJ9C3gJnHvCaOf78qbvfQfEACQBjj49xOk+qQPeNVolRAIXQF4JeQRd1jw+pFNWjguGEsSGNY/IWDOtyoqh4/yQ8pvipI5Q1IlPB7jr5xX0waiUU1UHXaPNAyCwYFauVRgJ2RyHQPkNEdRk16noKuLW8T4pL8xLHElJ2E45xGXyP1DrtuK2CnaOHXkmywk0eVXKAYO1/knYINjf438ao1IRl+gVbkhSD+sBWeMXyLHRatUU56f2lKH6Di/Nn02kQ2UWxWtv6jGUBLYbAbLxuKRSK6llokQ71lxSwvMYdqItBBBG8DbvAWXXRyLY2buLcTwBdp0XX4HufFzaNMm/xRwljqXsKu6920ek0o4IJBDQOeT2CVMrluxkOkmSS9OYcabExNfC8w2KoDY1gRSuh7Q9ir9vYYDdnkRArCj3AZNEwpVv8500aWioVWutU3gHiEQkqLH8YLRKt1ExUBLb5MffyRgC8zol33PHcpwV0i9c7SZwk8JM9H+FLvHKl0xKay0nv9REDSMbxghLcF8nYO/yxgDJS2bbtyKRpsdSbxovkpgBPKIGsPswf8fLHzRCyg8JMDpUiOZEpYEg+4pxcw/P0vmuZ4DE3QrsGzhecAQ== boris.petrovic@netcentric.biz"

# =============================================================================
# Container Registry (ACR)
# =============================================================================

acr_namespace = "jobtrainer"
image_tag     = "latest"

# =============================================================================
# RDS PostgreSQL
# =============================================================================

rds_instance_type = "pg.n2e.small.1" # 2 vCPU, 4 GiB (updated - old type offline)
rds_storage       = 20              # GB
db_username       = "jobtrainer"
# db_password is in secrets.auto.tfvars

# =============================================================================
# Redis (Tair)
# =============================================================================

redis_instance_class = "redis.master.small.default" # 1 GiB
# redis_password is in secrets.auto.tfvars

# =============================================================================
# SSL / HTTPS (Optional)
# =============================================================================

ssl_enabled        = false
ssl_certificate_id = "" # Set when ssl_enabled = true
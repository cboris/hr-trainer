#!/bin/bash
set -euo pipefail

# =============================================================================
# Job Trainer - ECS Instance Initialization Script
# This script runs on first boot to set up Docker and deploy the application
# =============================================================================

echo "=== Job Trainer ECS Initialization ==="
echo "Image Tag: ${image_tag}"

# =============================================================================
# Install Docker
# =============================================================================

echo "Installing Docker..."
yum install -y docker || apt-get update && apt-get install -y docker.io

systemctl enable docker
systemctl start docker

# Install Docker Compose
echo "Installing Docker Compose..."
COMPOSE_VERSION="v2.24.0"
curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-$$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# =============================================================================
# Create Application Directory
# =============================================================================

APP_DIR="/opt/job-trainer"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# =============================================================================
# Create docker-compose.yml for production
# =============================================================================

cat > docker-compose.yml << EOF
version: '3.8'

services:
  app:
    image: ${acr_endpoint}/${acr_namespace}/job-trainer:${image_tag}
    container_name: job-trainer-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://jobtrainer:\$${DB_PASSWORD}@${rds_endpoint}:5432/jobtrainer
      - REDIS_URL=redis://:\$${REDIS_PASSWORD}@${redis_endpoint}:6379
      - S3_ENDPOINT=https://${oss_endpoint}
      - S3_BUCKET=jobtrainer-production-storage
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=\$${NEXTAUTH_SECRET}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
EOF

# =============================================================================
# Create environment file (to be populated with actual secrets)
# =============================================================================

cat > .env << 'ENVFILE'
# Database
DB_PASSWORD=CHANGE_ME

# Redis
REDIS_PASSWORD=CHANGE_ME

# NextAuth
NEXTAUTH_SECRET=CHANGE_ME_generate_with_openssl_rand_base64_32

# Alibaba Cloud (if using SDK directly)
ALIBABA_CLOUD_ACCESS_KEY=
ALIBABA_CLOUD_SECRET_KEY=
ENVFILE

# =============================================================================
# Pull and Start Application
# =============================================================================

echo "Pulling application image..."
docker-compose pull || echo "WARN: Image pull failed - check ACR credentials"

echo "Starting application..."
docker-compose up -d || echo "WARN: Container start failed - check logs with: docker-compose logs"

# =============================================================================
# Setup Log Rotation
# =============================================================================

cat > /etc/logrotate.d/job-trainer << 'LOGROTATE'
/var/lib/docker/containers/*/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  copytruncate
}
LOGROTATE

# =============================================================================
# Done
# =============================================================================

echo "=== Initialization Complete ==="
echo "Application should be available at: http://localhost:3000"
echo "Check status: docker-compose ps"
echo "View logs: docker-compose logs -f"
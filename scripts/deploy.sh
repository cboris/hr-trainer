#!/bin/bash
set -euo pipefail

# =============================================================================
# Deploy Job Trainer to Alibaba Cloud ECS
# =============================================================================

# Configuration
ECS_HOST="${ECS_HOST:-}"
ECS_USER="${ECS_USER:-root}"
SSH_KEY="${SSH_KEY:-~/.ssh/job-trainer}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
ACR_ENDPOINT="${ACR_ENDPOINT:-registry.ap-southeast-1.cr.aliyuncs.com}"
ACR_NAMESPACE="${ACR_NAMESPACE:-jobtrainer}"
APP_DIR="/opt/job-trainer"

# =============================================================================
# Parse arguments
# =============================================================================

usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST        ECS instance IP or hostname (required)"
    echo "  -u, --user USER        SSH user (default: root)"
    echo "  -k, --key PATH         SSH key path (default: ~/.ssh/job-trainer)"
    echo "  -t, --tag TAG          Image tag to deploy (default: latest)"
    echo "  --help                 Show this help message"
    echo ""
    echo "Environment variables:"
    echo "  ECS_HOST               ECS instance IP or hostname"
    echo "  ECS_USER               SSH user"
    echo "  SSH_KEY                SSH key path"
    echo "  IMAGE_TAG              Image tag to deploy"
    echo ""
    echo "Example:"
    echo "  $0 --host 47.123.45.67 --tag v1.0.0"
    exit 0
}

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            ECS_HOST="$2"
            shift 2
            ;;
        -u|--user)
            ECS_USER="$2"
            shift 2
            ;;
        -k|--key)
            SSH_KEY="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            echo "Unknown option: $1"
            usage
            ;;
    esac
done

# =============================================================================
# Validate inputs
# =============================================================================

if [ -z "$ECS_HOST" ]; then
    echo "ERROR: ECS host is required. Use --host or set ECS_HOST environment variable."
    echo ""
    usage
fi

if [ ! -f "$SSH_KEY" ]; then
    echo "ERROR: SSH key not found at $SSH_KEY"
    echo "Generate one with: ssh-keygen -t ed25519 -f ~/.ssh/job-trainer"
    exit 1
fi

FULL_IMAGE="${ACR_ENDPOINT}/${ACR_NAMESPACE}/job-trainer:${IMAGE_TAG}"

echo "=== Deploying Job Trainer ==="
echo "Host: ${ECS_USER}@${ECS_HOST}"
echo "Image: ${FULL_IMAGE}"
echo "SSH Key: ${SSH_KEY}"
echo ""

# =============================================================================
# SSH command helper
# =============================================================================

ssh_cmd() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 "${ECS_USER}@${ECS_HOST}" "$@"
}

# =============================================================================
# Pre-flight checks
# =============================================================================

echo "Checking ECS instance connectivity..."
if ! ssh_cmd "echo 'Connection successful'" 2>/dev/null; then
    echo "ERROR: Cannot connect to ECS instance"
    echo "Check:"
    echo "  - SSH key is correct"
    echo "  - Security group allows SSH (port 22)"
    echo "  - Instance is running"
    exit 1
fi

echo "Checking Docker installation..."
if ! ssh_cmd "docker --version" 2>/dev/null; then
    echo "ERROR: Docker is not installed on the ECS instance"
    exit 1
fi

# =============================================================================
# Deploy
# =============================================================================

echo ""
echo "Pulling latest image on ECS..."
ssh_cmd "docker pull ${FULL_IMAGE}"

echo ""
echo "Stopping existing container..."
ssh_cmd "cd ${APP_DIR} && docker-compose down || true"

echo ""
echo "Updating environment configuration..."
ssh_cmd "cd ${APP_DIR} && sed -i 's|IMAGE_TAG=.*|IMAGE_TAG=${IMAGE_TAG}|' .env 2>/dev/null || true"

echo ""
echo "Starting new container..."
ssh_cmd "cd ${APP_DIR} && IMAGE_TAG=${IMAGE_TAG} docker-compose up -d"

echo ""
echo "Waiting for health check..."
sleep 5

# =============================================================================
# Verify deployment
# =============================================================================

echo "Checking container status..."
ssh_cmd "cd ${APP_DIR} && docker-compose ps"

echo ""
echo "Checking application health..."
if ssh_cmd "curl -sf http://localhost:3000/api/health > /dev/null" 2>/dev/null; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Health check failed. Check logs with:"
    echo "   ssh -i ${SSH_KEY} ${ECS_USER}@${ECS_HOST} 'cd ${APP_DIR} && docker-compose logs -f'"
fi

echo ""
echo "=== Deployment Complete ==="
echo "Application URL: http://${ECS_HOST}:3000"
echo ""
echo "Useful commands:"
echo "  View logs:    ssh -i ${SSH_KEY} ${ECS_USER}@${ECS_HOST} 'cd ${APP_DIR} && docker-compose logs -f'"
echo "  Restart app:  ssh -i ${SSH_KEY} ${ECS_USER}@${ECS_HOST} 'cd ${APP_DIR} && docker-compose restart'"
echo "  SSH access:   ssh -i ${SSH_KEY} ${ECS_USER}@${ECS_HOST}"
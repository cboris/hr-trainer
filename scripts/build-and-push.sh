#!/bin/bash
set -euo pipefail

# =============================================================================
# Build and Push Docker Image to Alibaba Cloud ACR
# =============================================================================

# Configuration
ACR_ENDPOINT="${ACR_ENDPOINT:-registry.ap-southeast-1.cr.aliyuncs.com}"
ACR_NAMESPACE="${ACR_NAMESPACE:-jobtrainer}"
IMAGE_NAME="job-trainer"
IMAGE_TAG="${IMAGE_TAG:-latest}"

# Full image path
FULL_IMAGE="${ACR_ENDPOINT}/${ACR_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=== Building and Pushing Docker Image ==="
echo "Image: ${FULL_IMAGE}"
echo ""

# =============================================================================
# Check prerequisites
# =============================================================================

if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    exit 1
fi

# Check if logged in to ACR
if ! docker login "${ACR_ENDPOINT}" 2>/dev/null; then
    echo ""
    echo "Please login to Alibaba Cloud ACR:"
    echo "  docker login --username=<your-username> ${ACR_ENDPOINT}"
    echo ""
    echo "Get credentials from: Container Registry Console > Access Credentials"
    exit 1
fi

# =============================================================================
# Build the image
# =============================================================================

echo "Building Docker image..."
docker build -t "${FULL_IMAGE}" --target production .

if [ $? -ne 0 ]; then
    echo "ERROR: Docker build failed"
    exit 1
fi

echo "Build completed successfully"
echo ""

# =============================================================================
# Push the image
# =============================================================================

echo "Pushing image to ACR..."
docker push "${FULL_IMAGE}"

if [ $? -ne 0 ]; then
    echo "ERROR: Docker push failed"
    exit 1
fi

echo ""
echo "=== Push completed successfully ==="
echo "Image: ${FULL_IMAGE}"
echo ""
echo "To deploy, update the image tag in your ECS instances or run:"
echo "  docker-compose -f docker-compose.prod.yml pull && docker-compose -f docker-compose.prod.yml up -d"
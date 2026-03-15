#!/bin/bash
# ================================================================
# DCC React Wallet - Docker Build & Deploy Script
# Mirrors the Angular version deployment process
# ================================================================

set -e

# Default values
ENVIRONMENT=${1:-mainnet}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-""}
IMAGE_NAME="dcc-exchange-react"
TAG=${TAG:-"latest"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}DCC React Wallet - Docker Build${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Image: ${YELLOW}${IMAGE_NAME}:${TAG}${NC}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(mainnet|testnet|stagenet)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use mainnet, testnet, or stagenet${NC}"
    exit 1
fi

# Build the Docker image
echo -e "\n${GREEN}Building Docker image...${NC}"

docker build \
    -f Dockerfile.production \
    --build-arg web_environment=${ENVIRONMENT} \
    -t ${IMAGE_NAME}:${TAG} \
    -t ${IMAGE_NAME}:${ENVIRONMENT}-${TAG} \
    .

echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Tag for registry if specified
if [ -n "$DOCKER_REGISTRY" ]; then
    echo -e "\n${GREEN}Tagging for registry: ${DOCKER_REGISTRY}${NC}"
    docker tag ${IMAGE_NAME}:${TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}
    docker tag ${IMAGE_NAME}:${ENVIRONMENT}-${TAG} ${DOCKER_REGISTRY}/${IMAGE_NAME}:${ENVIRONMENT}-${TAG}
fi

# Show image info
echo -e "\n${GREEN}Image Info:${NC}"
docker images | grep ${IMAGE_NAME}

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${YELLOW}To run locally:${NC}"
echo -e "  docker run -p 8080:80 -e WEB_ENVIRONMENT=${ENVIRONMENT} ${IMAGE_NAME}:${TAG}"

echo -e "\n${YELLOW}To push to registry:${NC}"
echo -e "  docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:${TAG}"

echo -e "\n${YELLOW}To run with different network:${NC}"
echo -e "  docker run -p 8080:80 -e WEB_ENVIRONMENT=testnet ${IMAGE_NAME}:${TAG}"

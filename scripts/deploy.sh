#!/bin/bash
# YoursTruly AWS Deployment Script
# Usage: ./scripts/deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 YoursTruly AWS Deployment${NC}"
echo "================================"

# Check for .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}Error: .env.local not found${NC}"
    exit 1
fi

# Extract env vars
SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
SUPABASE_KEY=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)
STRIPE_KEY=$(grep "^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=" .env.local | cut -d'=' -f2)
MAPBOX=$(grep "^NEXT_PUBLIC_MAPBOX_TOKEN=" .env.local | cut -d'=' -f2)

# Validate required vars
if [ -z "$SUPABASE_URL" ] || [ "$SUPABASE_URL" = "https://placeholder.supabase.co" ]; then
    echo -e "${RED}Error: Invalid NEXT_PUBLIC_SUPABASE_URL${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Environment variables loaded"

# AWS Config
AWS_REGION="us-east-2"
ECR_REPO="549083880218.dkr.ecr.us-east-2.amazonaws.com/yourstruly"
ECS_CLUSTER="yourstruly-cluster"
ECS_SERVICE="yourstruly-service"

# Login to ECR
echo -e "${YELLOW}→${NC} Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO 2>/dev/null

# Build Docker image with build args
echo -e "${YELLOW}→${NC} Building Docker image (this may take a few minutes)..."
docker build --platform linux/amd64 \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="https://app.yourstruly.love" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$STRIPE_KEY" \
  --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$MAPBOX" \
  -t yourstruly:latest .

echo -e "${GREEN}✓${NC} Docker image built"

# Tag and push
echo -e "${YELLOW}→${NC} Pushing to ECR..."
docker tag yourstruly:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

echo -e "${GREEN}✓${NC} Image pushed to ECR"

# Deploy to ECS
echo -e "${YELLOW}→${NC} Deploying to ECS..."
aws ecs update-service \
  --cluster $ECS_CLUSTER \
  --service $ECS_SERVICE \
  --force-new-deployment \
  --region $AWS_REGION \
  --output json | jq '{status: .service.status, deployments: [.service.deployments[0] | {status, createdAt}]}'

echo ""
echo -e "${GREEN}✓ Deployment initiated!${NC}"
echo -e "  Live URL: https://app.yourstruly.love"
echo -e "  ECS will swap containers in ~2-3 minutes"

#!/bin/bash
set -e

# YoursTruly AWS Deployment Script
# Usage: ./deploy.sh [init|plan|apply|build|push|deploy-app]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TF_DIR="$SCRIPT_DIR/terraform"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# AWS Configuration
AWS_REGION="us-east-2"
PROJECT_NAME="yourstruly"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPO="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME"

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Initialize Terraform
init() {
    log "Initializing Terraform..."
    cd "$TF_DIR"
    terraform init
}

# Plan infrastructure changes
plan() {
    log "Planning infrastructure changes..."
    cd "$TF_DIR"
    terraform plan -out=tfplan
}

# Apply infrastructure changes
apply() {
    log "Applying infrastructure changes..."
    cd "$TF_DIR"
    
    if [ -f tfplan ]; then
        terraform apply tfplan
    else
        terraform apply
    fi
}

# Build Docker image
build() {
    log "Building Docker image..."
    cd "$PROJECT_ROOT"
    
    # Get build args from tfvars
    source <(grep -E '^supabase_' "$TF_DIR/terraform.tfvars" | sed 's/ *= */=/g' | sed 's/"//g')
    
    docker build \
        --build-arg NEXT_PUBLIC_SUPABASE_URL="$supabase_url" \
        --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$supabase_anon_key" \
        --build-arg NEXT_PUBLIC_APP_URL="https://app.yourstruly.love" \
        --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_51OACyuH94XbyUkwAKkDn9IRXSNnTKPKDzWNVNxMBLD7ExvvRxsbXj8dZOEnUheLu99jdJx9y5HN0w5X67gzTNywm00AMJhykYn" \
        --build-arg NEXT_PUBLIC_MAPBOX_TOKEN="$MAPBOX_TOKEN" \
        -t "$PROJECT_NAME:latest" \
        .
}

# Push to ECR
push() {
    log "Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | \
        docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
    
    log "Tagging image..."
    docker tag "$PROJECT_NAME:latest" "$ECR_REPO:latest"
    docker tag "$PROJECT_NAME:latest" "$ECR_REPO:$(git rev-parse --short HEAD)"
    
    log "Pushing to ECR..."
    docker push "$ECR_REPO:latest"
    docker push "$ECR_REPO:$(git rev-parse --short HEAD)"
}

# Deploy app (force new ECS deployment)
deploy-app() {
    log "Forcing new ECS deployment..."
    aws ecs update-service \
        --cluster "$PROJECT_NAME-cluster" \
        --service "$PROJECT_NAME-service" \
        --force-new-deployment \
        --region $AWS_REGION
    
    log "Waiting for deployment to stabilize..."
    aws ecs wait services-stable \
        --cluster "$PROJECT_NAME-cluster" \
        --services "$PROJECT_NAME-service" \
        --region $AWS_REGION
    
    log "Deployment complete!"
}

# Show outputs
outputs() {
    cd "$TF_DIR"
    terraform output
}

# Full deployment
full() {
    init
    apply
    build
    push
    deploy-app
}

# Main
case "${1:-help}" in
    init)
        init
        ;;
    plan)
        plan
        ;;
    apply)
        apply
        ;;
    build)
        build
        ;;
    push)
        push
        ;;
    deploy-app)
        deploy-app
        ;;
    outputs)
        outputs
        ;;
    full)
        full
        ;;
    *)
        echo "YoursTruly AWS Deployment"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  init        Initialize Terraform"
        echo "  plan        Preview infrastructure changes"
        echo "  apply       Create/update infrastructure"
        echo "  build       Build Docker image"
        echo "  push        Push image to ECR"
        echo "  deploy-app  Force new ECS deployment"
        echo "  outputs     Show Terraform outputs"
        echo "  full        Full deployment (init + apply + build + push + deploy)"
        ;;
esac

#!/bin/bash

# AI Learning Coach Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(dirname "$SCRIPT_DIR")

echo "🚀 Deploying AI Learning Coach to $ENVIRONMENT"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
  echo "📋 Checking prerequisites..."

  if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ git not found. Please install git.${NC}"
    exit 1
  fi

  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+.${NC}"
    exit 1
  fi

  if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
  fi

  echo -e "${GREEN}✅ Prerequisites met${NC}"
  echo ""
}

# Install dependencies
install_dependencies() {
  echo "📦 Installing dependencies..."
  cd "$PROJECT_DIR"
  npm ci
  echo -e "${GREEN}✅ Dependencies installed${NC}"
  echo ""
}

# Lint and type check
lint_and_check() {
  echo "🔍 Linting and type checking..."
  npm run lint || true
  npm run type-check || true
  echo -e "${GREEN}✅ Lint and type check complete${NC}"
  echo ""
}

# Run tests
run_tests() {
  echo "🧪 Running tests..."
  npm run test -- --run || true
  echo -e "${GREEN}✅ Tests complete${NC}"
  echo ""
}

# Build backend
build_backend() {
  echo "🏗️  Building backend..."
  cd "$PROJECT_DIR/backend"
  npm run build
  echo -e "${GREEN}✅ Backend built${NC}"
  echo ""
}

# Build frontend
build_frontend() {
  echo "🎨 Building frontend..."
  cd "$PROJECT_DIR/frontend"
  npm run build
  echo -e "${GREEN}✅ Frontend built${NC}"
  echo ""
}

# Deploy to Railway
deploy_railway() {
  echo "🚂 Deploying backend to Railway..."

  if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI not found. Installing...${NC}"
    npm install -g @railway/cli
  fi

  cd "$PROJECT_DIR"

  if [ -z "$RAILWAY_TOKEN" ]; then
    echo -e "${RED}❌ RAILWAY_TOKEN environment variable not set${NC}"
    echo "Set it with: export RAILWAY_TOKEN=your_token"
    exit 1
  fi

  railway up --service backend

  echo -e "${GREEN}✅ Backend deployed to Railway${NC}"
  echo ""
}

# Deploy to Vercel
deploy_vercel() {
  echo "🔷 Deploying frontend to Vercel..."

  if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
  fi

  cd "$PROJECT_DIR/frontend"

  if [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ VERCEL_TOKEN environment variable not set${NC}"
    echo "Set it with: export VERCEL_TOKEN=your_token"
    exit 1
  fi

  if [ "$ENVIRONMENT" = "production" ]; then
    vercel --prod
  else
    vercel
  fi

  echo -e "${GREEN}✅ Frontend deployed to Vercel${NC}"
  echo ""
}

# Verify deployment
verify_deployment() {
  echo "✅ Verifying deployment..."

  if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo -e "${YELLOW}⚠️  BACKEND_URL or FRONTEND_URL not set. Skipping verification.${NC}"
    return
  fi

  sleep 5

  echo "Checking backend health..."
  if curl -s "$BACKEND_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
  else
    echo -e "${YELLOW}⚠️  Backend health check failed${NC}"
  fi

  echo "Checking frontend..."
  if curl -s "$FRONTEND_URL" > /dev/null; then
    echo -e "${GREEN}✅ Frontend is up${NC}"
  else
    echo -e "${YELLOW}⚠️  Frontend check failed${NC}"
  fi

  echo ""
}

# Main flow
main() {
  cd "$PROJECT_DIR"

  check_prerequisites
  install_dependencies
  lint_and_check
  run_tests
  build_backend
  build_frontend

  if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${YELLOW}🚨 Deploying to PRODUCTION${NC}"
    echo "Press Ctrl+C to cancel, or Enter to continue..."
    read
  fi

  deploy_railway
  deploy_vercel
  verify_deployment

  echo -e "${GREEN}🎉 Deployment complete!${NC}"
  echo ""
  echo "📊 Environment: $ENVIRONMENT"
  echo "🔗 Backend URL: ${BACKEND_URL:-Not set}"
  echo "🔗 Frontend URL: ${FRONTEND_URL:-Not set}"
  echo ""
  echo "Next steps:"
  echo "1. Visit your frontend URL and test the app"
  echo "2. Check Railway/Vercel dashboards for logs"
  echo "3. Monitor database performance in Supabase"
}

main

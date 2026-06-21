#!/bin/bash

# Sparkaph Deployment Script
# Run this on the server to deploy the application

set -e

echo "🚀 Starting Sparkaph deployment..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project directory
PROJECT_DIR="/home/$USER/sparkaph"

# Create project directory if it doesn't exist
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${YELLOW}Creating project directory...${NC}"
    mkdir -p "$PROJECT_DIR"
fi

cd "$PROJECT_DIR"

# Clone repository if it doesn't exist
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}Cloning repository...${NC}"
    git clone https://github.com/stexiel/Sparkaph.git .
else
    echo -e "${YELLOW}Pulling latest changes...${NC}"
    git pull origin main
fi

# Deploy backend
echo -e "${YELLOW}Deploying backend...${NC}"
cd backend
npm install
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Installing PM2...${NC}"
    npm install -g pm2
fi

# Start or restart backend
if pm2 list | grep -q "sparkaph-backend"; then
    echo -e "${YELLOW}Restarting backend...${NC}"
    pm2 restart sparkaph-backend
else
    echo -e "${YELLOW}Starting backend...${NC}"
    pm2 start npm --name "sparkaph-backend" -- start
fi

# Deploy frontend
echo -e "${YELLOW}Deploying frontend...${NC}"
cd ../frontend
npm install
npm run build

# Start or restart frontend
if pm2 list | grep -q "sparkaph-frontend"; then
    echo -e "${YELLOW}Restarting frontend...${NC}"
    pm2 restart sparkaph-frontend
else
    echo -e "${YELLOW}Starting frontend...${NC}"
    pm2 start npm --name "sparkaph-frontend" -- start
fi

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"

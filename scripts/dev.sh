#!/bin/bash
# Development startup script for AlgoMentor Frontend

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting AlgoMentor Frontend...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}📦 Installing dependencies...${NC}"
  npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
  echo -e "${BLUE}⚙️  Creating .env.local...${NC}"
  cp .env.local.example .env.local
  echo -e "${GREEN}✓ Created .env.local${NC}"
  echo -e "${BLUE}Make sure your backend is running at http://localhost:8080${NC}"
fi

echo -e "${GREEN}✓ Setup complete!${NC}"
echo -e "${BLUE}Starting dev server...${NC}"
npm run dev

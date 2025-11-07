#!/bin/bash

# EduMate Frontend Startup Script for macOS/Linux
# Starts only the frontend server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🚀 Starting EduMate Frontend...${NC}\n"

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing...${NC}"
    npm install
fi

# Kill any existing process on port 3000
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Killing existing process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}🎯 Starting frontend server...${NC}\n"
echo -e "${GREEN}   Frontend: http://localhost:3000${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

# Start frontend
npm run dev


#!/bin/bash

# EduMate Startup Script for macOS/Linux
# This script starts both the backend and frontend servers

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🚀 Starting EduMate...${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from env.example...${NC}"
    if [ -f env.example ]; then
        cp env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env and add your API keys before continuing.${NC}"
        echo -e "${YELLOW}   Required: DATABASE_URL, GROQ_API_KEY${NC}\n"
        read -p "Press Enter to continue after updating .env, or Ctrl+C to exit..."
    else
        echo -e "${RED}❌ env.example not found. Please create .env manually.${NC}"
        exit 1
    fi
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}\n"
fi

# Activate virtual environment
echo -e "${GREEN}📦 Activating virtual environment...${NC}"
source venv/bin/activate

# Check if Python dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Python dependencies not found. Installing...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Python dependencies installed${NC}\n"
fi

# Check if Node modules are installed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  Node modules not found. Installing...${NC}"
    npm install
    echo -e "${GREEN}✅ Node modules installed${NC}\n"
fi

# Kill any existing processes on ports 8000 and 3000
echo -e "${GREEN}🧹 Cleaning up existing processes...${NC}"
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Killing process on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Killing process on port 3000...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}✅ Cleanup complete${NC}\n"

# Start both servers using concurrently
echo -e "${GREEN}🎯 Starting backend and frontend servers...${NC}\n"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   Backend:  http://localhost:8000${NC}"
echo -e "${GREEN}   Frontend: http://localhost:3000${NC}"
echo -e "${GREEN}   API Docs: http://localhost:8000/docs${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Use npm script to start both servers
npm run dev:full


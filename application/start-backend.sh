#!/bin/bash

# EduMate Backend Startup Script for macOS/Linux
# Starts only the backend server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${GREEN}🚀 Starting EduMate Backend...${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Please create it from env.example${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Check if Python dependencies are installed
if ! python -c "import fastapi" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Python dependencies not found. Installing...${NC}"
    pip install -r requirements.txt
fi

# Kill any existing process on port 8000
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Killing existing process on port 8000...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi

echo -e "${GREEN}🎯 Starting backend server...${NC}\n"
echo -e "${GREEN}   Backend:  http://localhost:8000${NC}"
echo -e "${GREEN}   API Docs: http://localhost:8000/docs${NC}\n"
echo -e "${YELLOW}Press Ctrl+C to stop${NC}\n"

# Start backend
python start_backend.py


#!/bin/bash

# EduMate Stop Script for macOS/Linux
# Stops all running EduMate processes

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping EduMate servers...${NC}\n"

# Stop backend (port 8000)
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}   Stopping backend (port 8000)...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}   ✅ Backend stopped${NC}"
else
    echo -e "${YELLOW}   ℹ️  No process running on port 8000${NC}"
fi

# Stop frontend (port 3000)
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}   Stopping frontend (port 3000)...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}   ✅ Frontend stopped${NC}"
else
    echo -e "${YELLOW}   ℹ️  No process running on port 3000${NC}"
fi

echo -e "\n${GREEN}✅ All servers stopped${NC}"


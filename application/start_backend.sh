#!/bin/bash
# Script to start the backend with proper virtual environment activation

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Kill any existing processes on port 8000
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "Killing existing processes on port 8000..."
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

# Activate the virtual environment
source venv/bin/activate

# Start the backend
python start_backend.py

#!/bin/bash
# Script to start the backend with proper virtual environment activation

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Change to the project directory
cd "$SCRIPT_DIR"

# Activate the virtual environment
source venv/bin/activate

# Start the backend
python start_backend.py

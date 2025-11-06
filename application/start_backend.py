#!/usr/bin/env python3
"""
Startup script for EduMate backend API
"""
import uvicorn
import sys
import os

# Change to the backend directory
backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
os.chdir(backend_dir)

# Add the parent directory to Python path so we can import backend modules
parent_dir = os.path.dirname(__file__)
sys.path.insert(0, parent_dir)

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

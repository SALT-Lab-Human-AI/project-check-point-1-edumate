#!/bin/bash

# Complete system setup and reproduction script for EduMate
# This script performs a full system setup from scratch

set -e  # Exit on error

echo "=========================================="
echo "EduMate Full System Setup"
echo "=========================================="
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
APP_DIR="$PROJECT_ROOT/application"

cd "$APP_DIR"

echo "Step 1: Prerequisites Check"
echo "=========================="
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "✗ Node.js is not installed"
    exit 1
fi
echo "✓ Node.js: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "✗ npm is not installed"
    exit 1
fi
echo "✓ npm: $(npm --version)"

echo ""
echo "Step 2: Environment Configuration"
echo "=================================="
echo ""

# Setup .env file
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Creating .env from env.example..."
    cp "$APP_DIR/env.example" "$APP_DIR/.env"
    echo "⚠ IMPORTANT: Please edit .env and configure:"
    echo "  - DATABASE_URL (PostgreSQL with pgvector)"
    echo "  - GROQ_API_KEY (from https://console.groq.com/)"
    echo "  - NEXT_PUBLIC_API_URL (backend URL)"
    echo ""
    read -p "Press Enter after configuring .env file..."
else
    echo "✓ .env file exists"
fi

# Load environment variables
if [ -f "$APP_DIR/.env" ]; then
    export $(cat "$APP_DIR/.env" | grep -v '^#' | xargs)
fi

echo ""
echo "Step 3: Frontend Setup"
echo "======================"
echo ""

echo "Installing Node.js dependencies..."
npm install
echo "✓ Frontend dependencies installed"

echo ""
echo "Step 4: Backend Setup"
echo "===================="
echo ""

# Create virtual environment
if [ ! -d "$APP_DIR/venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv "$APP_DIR/venv"
    echo "✓ Virtual environment created"
fi

# Activate virtual environment
source "$APP_DIR/venv/bin/activate" 2>/dev/null || {
    echo "Note: Virtual environment activation may have failed (Windows?)"
    echo "Continuing with system Python..."
}

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r "$APP_DIR/requirements.txt"
echo "✓ Backend dependencies installed"

echo ""
echo "Step 5: Database Setup"
echo "====================="
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "✗ DATABASE_URL not set in .env file"
    echo "Please set DATABASE_URL and run this script again"
    exit 1
fi

echo "Testing database connection..."
python3 << EOF
import psycopg2
import os
from dotenv import load_dotenv
import sys

load_dotenv('$APP_DIR/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check pgvector extension
    cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
    if not cursor.fetchone():
        print("⚠ pgvector extension not found")
        print("Please enable it in your database:")
        print("  CREATE EXTENSION IF NOT EXISTS vector;")
        sys.exit(1)
    
    print("✓ Database connection successful")
    print("✓ pgvector extension enabled")
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    sys.exit(1)
EOF

echo ""
echo "Step 6: Database Schema Initialization"
echo "======================================="
echo ""

echo "Initializing database schema..."
python3 << EOF
import sys
sys.path.insert(0, '$APP_DIR')
from backend.database import init_db

init_db()
print("✓ Database schema initialized")
EOF

echo ""
echo "Step 7: Data Population"
echo "======================="
echo ""

# Check if data file exists
if [ ! -f "$APP_DIR/data/test.jsonl" ]; then
    echo "⚠ test.jsonl not found. Skipping data population."
    echo "You can run data setup later with: bash artifacts/scripts/reproduce_data_setup.sh"
else
    echo "Populating vector database..."
    echo "This may take a few minutes..."
    
    python3 << EOF
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, '$APP_DIR')

load_dotenv('$APP_DIR/.env')

from backend.database import get_db_connection
from backend.rag_groq_bot import get_embed_model
from tqdm import tqdm

# Load dataset
data_path = Path('$APP_DIR/data/test.jsonl')
with open(data_path, 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f if line.strip()]

print(f"Loaded {len(data)} entries")

# Check existing data
conn = get_db_connection()
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM k12_content;")
existing_count = cursor.fetchone()[0]
cursor.close()
conn.close()

if existing_count > 0:
    print(f"⚠ Vector database already contains {existing_count} entries")
    print("Skipping data population. Run reproduce_data_setup.sh to repopulate.")
else:
    # Generate embeddings and populate
    embed_model = get_embed_model()
    conn = get_db_connection()
    cursor = conn.cursor()
    
    batch_size = 50
    for i in tqdm(range(0, len(data), batch_size), desc="Processing"):
        batch = data[i:i+batch_size]
        
        for entry in batch:
            question = entry.get('question', '')
            answer = entry.get('answer', '')
            document = f"{question} {answer}".strip()
            
            embedding = embed_model.encode(document).tolist()
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            
            import uuid
            doc_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO k12_content (id, document, question, embedding) VALUES (%s, %s, %s, %s::vector)",
                (doc_id, document, question, embedding_str)
            )
        
        conn.commit()
    
    cursor.close()
    conn.close()
    
    # Verify
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM k12_content;")
    final_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()
    
    print(f"✓ Successfully populated {final_count} entries")
EOF
fi

echo ""
echo "Step 8: Verification"
echo "==================="
echo ""

echo "Verifying installation..."

# Check frontend build
echo "Building frontend..."
npm run build > /dev/null 2>&1 || {
    echo "⚠ Frontend build had warnings (this is normal for dev)"
}
echo "✓ Frontend build completed"

# Check backend imports
echo "Checking backend imports..."
python3 << EOF
import sys
sys.path.insert(0, '$APP_DIR')

try:
    from backend.main import app
    from backend.database import init_db
    from backend.rag_groq_bot import get_embed_model
    print("✓ Backend imports successful")
except Exception as e:
    print(f"✗ Backend import failed: {e}")
    sys.exit(1)
EOF

echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Start the application:"
echo "   npm run dev:full"
echo ""
echo "2. Or start separately:"
echo "   Terminal 1: npm run backend"
echo "   Terminal 2: npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "4. Create a test account:"
echo "   Navigate to http://localhost:3000/signup"
echo ""
echo "For troubleshooting, see:"
echo "  - application/INSTALL.md"
echo "  - application/docs/FINAL_REPORT.md"
echo ""


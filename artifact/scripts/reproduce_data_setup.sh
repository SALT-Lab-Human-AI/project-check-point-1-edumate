#!/bin/bash

# Script to reproduce data setup for EduMate
# This script sets up the vector database and populates it with embeddings

set -e  # Exit on error

echo "=========================================="
echo "EduMate Data Setup Reproduction Script"
echo "=========================================="
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"
APP_DIR="$PROJECT_ROOT/application"

# Check if we're in the right directory
if [ ! -f "$APP_DIR/package.json" ]; then
    echo "Error: Could not find application directory"
    echo "Expected: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Checking prerequisites..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi
echo "✓ Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    echo "Warning: .env file not found"
    echo "Creating from env.example..."
    cp "$APP_DIR/env.example" "$APP_DIR/.env"
    echo "⚠ Please edit .env and add your DATABASE_URL and GROQ_API_KEY"
    echo ""
fi

# Load environment variables
if [ -f "$APP_DIR/.env" ]; then
    export $(cat "$APP_DIR/.env" | grep -v '^#' | xargs)
fi

echo ""
echo "Step 2: Checking data files..."
echo ""

# Check if data files exist
DATA_DIR="$APP_DIR/data"
if [ ! -f "$DATA_DIR/test.jsonl" ]; then
    echo "Error: test.jsonl not found in $DATA_DIR"
    exit 1
fi
echo "✓ Found test.jsonl"

# Count entries
ENTRY_COUNT=$(wc -l < "$DATA_DIR/test.jsonl" | tr -d ' ')
echo "  Entries in dataset: $ENTRY_COUNT"

echo ""
echo "Step 3: Setting up Python environment..."
echo ""

# Check for virtual environment
if [ ! -d "$APP_DIR/venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$APP_DIR/venv"
fi

# Activate virtual environment
source "$APP_DIR/venv/bin/activate" 2>/dev/null || {
    echo "Note: Virtual environment activation may have failed (Windows?)"
    echo "Continuing with system Python..."
}

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r "$APP_DIR/requirements.txt"
echo "✓ Python dependencies installed"

echo ""
echo "Step 4: Database setup..."
echo ""

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL not set in .env file"
    echo "Please set DATABASE_URL in $APP_DIR/.env"
    exit 1
fi
echo "✓ DATABASE_URL configured"

# Test database connection
echo "Testing database connection..."
python3 -c "
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('$APP_DIR/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    cursor.execute('SELECT version();')
    version = cursor.fetchone()[0]
    print(f'✓ Connected to PostgreSQL: {version[:50]}...')
    
    # Check for pgvector extension
    cursor.execute(\"SELECT * FROM pg_extension WHERE extname = 'vector';\")
    if cursor.fetchone():
        print('✓ pgvector extension enabled')
    else:
        print('⚠ pgvector extension not found. Please enable it:')
        print('  CREATE EXTENSION IF NOT EXISTS vector;')
    
    cursor.close()
    conn.close()
except Exception as e:
    print(f'✗ Database connection failed: {e}')
    exit(1)
"

echo ""
echo "Step 5: Populating vector database..."
echo ""

# Run database initialization and data population
python3 << EOF
import os
import sys
import json
from pathlib import Path
from dotenv import load_dotenv

# Add backend to path
sys.path.insert(0, '$APP_DIR')

load_dotenv('$APP_DIR/.env')

from backend.database import init_db, get_db_connection
from backend.rag_groq_bot import get_embed_model
from tqdm import tqdm

# Initialize database
print("Initializing database schema...")
init_db()
print("✓ Database schema initialized")

# Load dataset
data_path = Path('$APP_DIR/data/test.jsonl')
print(f"Loading dataset from {data_path}...")

with open(data_path, 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f if line.strip()]

print(f"✓ Loaded {len(data)} entries")

# Check if data already exists
conn = get_db_connection()
cursor = conn.cursor()
cursor.execute("SELECT COUNT(*) FROM k12_content;")
existing_count = cursor.fetchone()[0]
cursor.close()
conn.close()

if existing_count > 0:
    print(f"⚠ Vector database already contains {existing_count} entries")
    response = input("Do you want to repopulate? (y/N): ")
    if response.lower() != 'y':
        print("Skipping data population.")
        sys.exit(0)
    else:
        # Clear existing data
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM k12_content;")
        conn.commit()
        cursor.close()
        conn.close()
        print("✓ Cleared existing data")

# Generate embeddings and populate database
print("Generating embeddings and populating database...")
embed_model = get_embed_model()

conn = get_db_connection()
cursor = conn.cursor()

batch_size = 50
for i in tqdm(range(0, len(data), batch_size), desc="Processing batches"):
    batch = data[i:i+batch_size]
    
    for entry in batch:
        question = entry.get('question', '')
        answer = entry.get('answer', '')
        document = f"{question} {answer}".strip()
        
        # Generate embedding
        embedding = embed_model.encode(document).tolist()
        embedding_str = '[' + ','.join(map(str, embedding)) + ']'
        
        # Insert into database
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

print(f"✓ Successfully populated {final_count} entries into vector database")
EOF

echo ""
echo "=========================================="
echo "Data setup completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify data: Check k12_content table in your database"
echo "2. Start backend: npm run backend or python start_backend.py"
echo "3. Start frontend: npm run dev"
echo "4. Test RAG: Make a query through the API or UI"
echo ""


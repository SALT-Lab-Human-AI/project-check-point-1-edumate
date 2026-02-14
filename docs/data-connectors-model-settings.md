# Data Connectors & Model Settings

This document describes all data connectors, database configurations, model settings, and external service integrations used in the EduMate platform.

## Table of Contents

1. [Overview](#overview)
2. [Database Connectors](#database-connectors)
3. [Vector Database Configuration](#vector-database-configuration)
4. [AI Model Settings](#ai-model-settings)
5. [External Service Connectors](#external-service-connectors)
6. [Connection Pooling](#connection-pooling)
7. [Configuration Management](#configuration-management)

---

## Overview

EduMate integrates with multiple data sources and AI services:

- **PostgreSQL (Supabase)**: Primary database for user data, quiz attempts, time tracking
- **PostgreSQL pgvector**: Vector storage for RAG context retrieval
- **ChromaDB**: Local vector database for development
- **Groq API**: LLM provider for tutor responses and quiz generation
- **SentenceTransformer**: Embedding model for vector search

---

## Database Connectors

### PostgreSQL (Supabase) Connection

**Location:** `application/backend/database.py`

**Connection String:**
```python
DATABASE_URL = os.getenv("DATABASE_URL")
```

**Format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Configuration:**
- Provider: Supabase (PostgreSQL 12+)
- Port: 5432 (default)
- SSL: Enabled (required for Supabase)
- Connection Pool: SimpleConnectionPool (1-10 connections)

**Environment Variable:**
```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

**Connection Pool Settings:**
```python
_pool = SimpleConnectionPool(
    minconn=1,      # Minimum connections
    maxconn=10,     # Maximum connections
    dsn=DATABASE_URL
)
```

**Features:**
- Automatic connection retry on failure
- Connection timeout: 10 seconds
- RealDictCursor for dict-like row access
- Connection pooling for performance

### Database Schema

**Tables:**
- `users`: User accounts (students, parents)
- `parent_student_links`: Parent-student relationships
- `quiz_attempts`: Quiz completion records
- `session_time_tracking`: Individual session time records
- `total_time_tracking`: Cumulative daily time totals
- `daily_goals`: Student goal settings
- `k12_content`: Vector embeddings for RAG (with pgvector)

**Initialization:**
- Auto-initialized on backend startup
- Creates tables if they don't exist
- Enables pgvector extension automatically

---

## Vector Database Configuration

### PostgreSQL pgvector

**Location:** `application/backend/rag_groq_bot.py`  
**Extension:** pgvector  
**Table:** `k12_content`

**Configuration:**
```python
COLLECTION_NAME = "k12_content"
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 dimension
```

**Table Schema:**
```sql
CREATE TABLE k12_content (
    id VARCHAR(255) PRIMARY KEY,
    document TEXT NOT NULL,
    question TEXT,
    embedding vector(384)  -- 384-dimensional vector
);

CREATE INDEX k12_content_embedding_idx 
ON k12_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Index Type:**
- IVFFlat (Inverted File with Flat compression)
- Cosine similarity operator (`<=>`)
- Lists: 100 (for ~10K vectors, adjust for larger datasets)

**Query Method:**
```sql
SELECT document, question
FROM k12_content
ORDER BY embedding <=> '[query_vector]'::vector
LIMIT 3;
```

**Features:**
- Cosine similarity search
- Top-K retrieval (K=3 for RAG, K=12 for quiz generation)
- Automatic fallback if table is empty

### ChromaDB (Local Development)

**Location:** `application/backend/setup_chroma.py`  
**Storage:** Local file system  
**Path:** `application/chroma_db/`

**Configuration:**
```python
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "k12_content"
```

**Storage Backend:**
- DuckDB + Parquet (persistent storage)
- Local SQLite file: `chroma.sqlite3`

**Initialization:**
```python
chroma = Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory=CHROMA_DIR
))
```

**Usage:**
- Primary: PostgreSQL pgvector (production)
- Fallback: ChromaDB (local development)
- Data source: `data/test.jsonl`

**Collection Setup:**
```python
collection = chroma.create_collection(name=COLLECTION_NAME)
```

---

## AI Model Settings

### Groq API (LLM Provider)

**Location:** `application/backend/rag_groq_bot.py` line 34  
**Provider:** Groq  
**Model:** `openai/gpt-oss-20b`

**Configuration:**
```python
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "openai/gpt-oss-20b"
client = Groq(api_key=GROQ_API_KEY)
```

**Environment Variable:**
```bash
GROQ_API_KEY=your_groq_api_key_here
```

**API Endpoints Used:**
- `client.chat.completions.create()`: For both RAG and quiz generation

**Model Settings - RAG Tutor:**
```python
response = client.chat.completions.create(
    model=GROQ_MODEL,
    messages=[...],
    max_tokens=3000
)
```

**Model Settings - Quiz Generation:**
```python
response = client.chat.completions.create(
    model=GROQ_MODEL,
    temperature=0.1,
    messages=[...],
    max_tokens=3500,
    response_format={"type": "json_object"}
)
```

**Alternative Models:**
- Can be changed by modifying `GROQ_MODEL` constant
- Check [Groq API documentation](https://console.groq.com/docs) for available models
- Ensure model supports JSON mode if using for quiz generation

### SentenceTransformer (Embedding Model)

**Location:** `application/backend/rag_groq_bot.py` line 29  
**Model:** `all-MiniLM-L6-v2`  
**Provider:** Hugging Face (via sentence-transformers)

**Configuration:**
```python
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
```

**Characteristics:**
- **Dimensions:** 384
- **Size:** ~80MB (downloads on first use)
- **Speed:** Fast inference (~10ms per query)
- **Quality:** Good balance for K-12 content

**Lazy Loading:**
```python
_embed_model = None

def get_embed_model():
    global _embed_model
    if _embed_model is None:
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
    return _embed_model
```

**Usage:**
- Generates embeddings for user questions
- Generates embeddings for quiz topic queries
- Converts text to 384-dimensional vectors

**Alternative Models:**
- `all-mpnet-base-v2`: Higher quality, slower (768-dim)
- `all-MiniLM-L12-v2`: Better quality, larger (384-dim)
- `paraphrase-multilingual-MiniLM-L12-v2`: Multilingual support

**Changing Model:**
1. Update `EMBED_MODEL_NAME` in `rag_groq_bot.py`
2. Update `EMBEDDING_DIM` to match new model
3. Update PostgreSQL vector column dimension:
   ```sql
   ALTER TABLE k12_content ALTER COLUMN embedding TYPE vector(768);
   ```
4. Re-populate vector table with new embeddings

---

## External Service Connectors

### Groq API Connection

**Base URL:** `https://api.groq.com` (handled by Groq SDK)

**Authentication:**
- API Key via environment variable
- Passed to Groq client on initialization

**Rate Limits:**
- Check Groq documentation for current limits
- No explicit rate limiting in code (relies on Groq)

**Error Handling:**
- Missing API key: Raises ValueError on startup
- API errors: Caught and returned as error messages
- Timeout: No explicit timeout (relies on Groq default)

### Supabase Connection

**Base URL:** Provided in `DATABASE_URL`

**Authentication:**
- Username/Password in connection string
- SSL required for Supabase

**Features:**
- Automatic connection retry
- Connection pooling
- Transaction support

**Error Handling:**
- Connection failures: Retry with timeout
- Query errors: Rollback transactions
- Pool exhaustion: Waits for available connection

---

## Connection Pooling

### PostgreSQL Connection Pool

**Implementation:** `psycopg2.pool.SimpleConnectionPool`

**Configuration:**
```python
SimpleConnectionPool(
    minconn=1,      # Minimum idle connections
    maxconn=10,     # Maximum total connections
    dsn=DATABASE_URL
)
```

**Benefits:**
- Reuses connections (faster queries)
- Limits concurrent connections
- Automatic connection management

**Connection Lifecycle:**
1. Get connection from pool: `get_db()`
2. Get cursor: `get_cursor(conn)`
3. Execute queries
4. Return connection: `return_db(conn)`

**Example:**
```python
conn = get_db()
cursor = get_cursor(conn)
cursor.execute("SELECT * FROM users")
results = cursor.fetchall()
cursor.close()
return_db(conn)
```

### Vector Database Connections

**PostgreSQL pgvector:**
- Uses same connection pool as main database
- No separate pooling needed

**ChromaDB:**
- Single client instance (thread-safe)
- No explicit pooling (handled by ChromaDB)

---

## Configuration Management

### Environment Variables

**Required Variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GROQ_API_KEY` | Groq API authentication | `gsk_...` |

**Optional Variables:**
- None currently (all config in code)

**Loading:**
```python
from dotenv import load_dotenv
load_dotenv()
```

**File:** `.env` (not committed to git)

### Configuration Constants

**Model Settings:**
```python
# application/backend/rag_groq_bot.py
GROQ_MODEL = "openai/gpt-oss-20b"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384
COLLECTION_NAME = "k12_content"
```

**Database Settings:**
```python
# application/backend/database.py
# Connection pool settings
minconn=1
maxconn=10
connect_timeout=10
```

**Vector Search Settings:**
```python
# RAG Tutor
top_k = 3  # Number of documents to retrieve

# Quiz Generation
top_k = 12  # Number of documents to retrieve
context_limit = 9000  # Characters
```

### Changing Configuration

**To Change LLM Model:**
1. Update `GROQ_MODEL` in `rag_groq_bot.py` and `quiz_gen.py`
2. Restart backend server
3. Test with sample queries

**To Change Embedding Model:**
1. Update `EMBED_MODEL_NAME` and `EMBEDDING_DIM`
2. Update PostgreSQL vector column dimension
3. Re-populate vector table
4. Restart backend server

**To Change Database:**
1. Update `DATABASE_URL` in `.env`
2. Restart backend server
3. Verify connection on startup

**To Adjust Connection Pool:**
1. Edit `SimpleConnectionPool` parameters in `database.py`
2. Consider server capacity and expected load
3. Restart backend server

---

## Data Flow

### RAG Pipeline Data Flow

```
User Question
    ↓
Embedding Model (SentenceTransformer)
    ↓
384-dim Vector
    ↓
PostgreSQL pgvector (Cosine Similarity)
    ↓
Top 3 Documents Retrieved
    ↓
Context + Question → Groq API
    ↓
Response (Markdown + LaTeX)
    ↓
LaTeX Formatting (format_latex)
    ↓
Final Answer
```

### Quiz Generation Data Flow

```
Topic + Grade + Difficulty
    ↓
Embedding Model (SentenceTransformer)
    ↓
384-dim Vector
    ↓
PostgreSQL pgvector (Cosine Similarity)
    ↓
Top 12 Documents Retrieved
    ↓
Context + Prompt → Groq API (JSON mode)
    ↓
JSON Response (Quiz Items)
    ↓
LaTeX Formatting (format_latex)
    ↓
Normalized Quiz Items
```

---

## Performance Considerations

### Database Performance

**Indexes:**
- `users.email`: UNIQUE index (fast lookups)
- `quiz_attempts.student_id`: Index for statistics queries
- `session_time_tracking.student_id`: Index for time queries
- `k12_content.embedding`: IVFFlat index (vector search)

**Query Optimization:**
- Use connection pooling
- Limit result sets with LIMIT
- Use prepared statements (parameterized queries)
- Aggregate queries for statistics

### Vector Search Performance

**Index Configuration:**
- IVFFlat with 100 lists (for ~10K vectors)
- Adjust lists based on dataset size:
  - <10K vectors: 100 lists
  - 10K-100K: 100-1000 lists
  - >100K: 1000+ lists

**Query Performance:**
- Top-3 search: ~10-50ms
- Top-12 search: ~20-100ms
- Depends on dataset size and index quality

### Model Performance

**Embedding Model:**
- First load: ~2-5 seconds (model download/load)
- Subsequent queries: ~10-50ms per query
- Memory usage: ~200-300MB

**Groq API:**
- Response time: 1-10 seconds (depends on complexity)
- Rate limits: Check Groq documentation
- Token limits: 3000 (RAG), 3500 (Quiz)

---

## Troubleshooting

### Database Connection Issues

**Error:** "Database connection failed"  
**Solutions:**
- Verify `DATABASE_URL` is correct
- Check network connectivity
- Verify Supabase project is active
- Check firewall settings

**Error:** "Connection pool exhausted"  
**Solutions:**
- Increase `maxconn` in connection pool
- Check for connection leaks (not returning connections)
- Reduce concurrent requests

### Vector Search Issues

**Error:** "Vector table is empty"  
**Solutions:**
- Run `populate_vector_table()` function
- Check `data/test.jsonl` exists
- Verify embeddings are being created

**Error:** "pgvector extension not found"  
**Solutions:**
- Run `CREATE EXTENSION vector;` in PostgreSQL
- Verify Supabase project has pgvector enabled

### Model Issues

**Error:** "Missing GROQ_API_KEY"  
**Solutions:**
- Set `GROQ_API_KEY` in `.env` file
- Restart backend server
- Verify API key is valid

**Error:** "Embedding model not found"  
**Solutions:**
- Check internet connection (first download)
- Verify `sentence-transformers` package installed
- Check disk space for model cache

---

## Security Considerations

### API Keys

- Never commit API keys to git
- Use `.env` file (in `.gitignore`)
- Rotate keys periodically
- Use environment variables in production

### Database Security

- Use SSL connections (required for Supabase)
- Limit database user permissions
- Use connection pooling (prevents connection exhaustion)
- Parameterized queries (prevents SQL injection)

### Data Privacy

- User passwords: Hashed with SHA-256 (upgrade to bcrypt recommended)
- Vector embeddings: Stored in PostgreSQL (encrypted at rest by Supabase)
- API responses: Transmitted over HTTPS



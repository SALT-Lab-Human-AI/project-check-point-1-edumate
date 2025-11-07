# Migration to Supabase & Cloud Deployment - Summary

## ✅ Completed Changes

### 1. Database Migration (SQLite → Supabase PostgreSQL)
- **File**: `backend/database.py`
  - Replaced SQLite with PostgreSQL using `psycopg2`
  - Added connection pooling for better performance
  - Updated all SQL syntax for PostgreSQL compatibility
  - Added pgvector extension support

### 2. Vector Database Migration (ChromaDB → Supabase Vector)
- **File**: `backend/rag_groq_bot.py`
  - Replaced ChromaDB with Supabase Vector (pgvector)
  - Created vector table with proper indexing
  - Implemented similarity search using cosine distance
  - Maintained compatibility with existing `quiz_gen.py` module

### 3. API Updates
- **File**: `backend/main.py`
  - Updated all database queries from SQLite (`?`) to PostgreSQL (`%s`) syntax
  - Updated connection handling to use connection pool
  - Updated cursor usage to use `RealDictCursor` for dict-like row access
  - Fixed all `conn.close()` to properly return connections to pool

### 4. Dependencies
- **File**: `requirements.txt`
  - Added: `psycopg2-binary`, `supabase`
  - Removed: `chromadb` (replaced with Supabase Vector)

### 5. Configuration Files
- **File**: `env.example`
  - Added Supabase configuration variables
  - Updated documentation for new database setup

### 6. Deployment Configurations
- **File**: `render.yaml` - Render deployment configuration
- **File**: `Procfile` - Render process file
- **File**: `vercel.json` - Vercel deployment configuration
- **File**: `DEPLOYMENT.md` - Complete deployment guide

## 🔄 Migration Steps Required

### Before Deployment:

1. **Set up Supabase**:
   - Create a Supabase project
   - Enable pgvector extension (run `CREATE EXTENSION IF NOT EXISTS vector;`)
   - Get your `DATABASE_URL` connection string

2. **Update Environment Variables**:
   - Copy `env.example` to `.env` (for local development)
   - Set `DATABASE_URL` with your Supabase connection string
   - Set `GROQ_API_KEY` with your Groq API key

3. **Test Locally**:
   ```bash
   cd application
   pip install -r requirements.txt
   uvicorn backend.main:app --reload
   ```
   - The first run will create all tables and populate the vector database

### Deployment:

1. **Deploy Backend to Render**:
   - Follow `DEPLOYMENT.md` Step 2
   - Set environment variables in Render dashboard
   - First deployment will initialize the database

2. **Deploy Frontend to Vercel**:
   - Follow `DEPLOYMENT.md` Step 3
   - Set `NEXT_PUBLIC_API_URL` to your Render backend URL

## 📝 Key Changes in Code

### Database Connection Pattern
**Before (SQLite)**:
```python
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
```

**After (PostgreSQL)**:
```python
conn = get_db()  # From connection pool
cursor = get_cursor(conn)  # RealDictCursor
cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
# ... use cursor ...
cursor.close()
return_db(conn)  # Return to pool
```

### Vector Search Pattern
**Before (ChromaDB)**:
```python
results = collection.query(query_embeddings=[embedding], n_results=3)
```

**After (Supabase Vector)**:
```python
cursor.execute(
    "SELECT document FROM k12_content ORDER BY embedding <=> %s::vector LIMIT 3",
    (embedding_str,)
)
```

## ⚠️ Important Notes

1. **First Deployment**: The vector table will be populated automatically on first backend startup. This may take a few minutes depending on your dataset size.

2. **Connection Pooling**: The new implementation uses connection pooling. Always use `get_cursor()` and `return_db()` instead of direct connections.

3. **Vector Format**: Embeddings are stored as PostgreSQL `vector` type. The code automatically converts Python lists to the correct format.

4. **Free Tier Limitations**:
   - Render free tier spins down after 15 min inactivity
   - Supabase free tier: 500MB database, 2GB bandwidth
   - Consider upgrading for production use

## 🐛 Troubleshooting

### Database Connection Errors
- Verify `DATABASE_URL` format: `postgresql://postgres:password@host:port/dbname`
- Check Supabase project is active
- Verify pgvector extension is enabled

### Vector Search Errors
- Ensure pgvector extension is enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- Check vector table exists: `SELECT * FROM k12_content LIMIT 1;`
- Verify embedding dimension matches (384 for all-MiniLM-L6-v2)

### Import Errors
- Run `pip install -r requirements.txt` to install all dependencies
- Ensure Python 3.8+ is being used

## 📚 Additional Resources

- [Supabase Vector Docs](https://supabase.com/docs/guides/ai/vector-columns)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Render Deployment Guide](https://render.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)


# Configuration Files and Settings

This document describes all configuration files and settings used in the EduMate system.

## Environment Configuration

### File: `application/env.example`

Template for environment variables. Copy to `.env` and fill in values.

**Required Variables:**

```bash
# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false

# Backend Configuration
DATABASE_URL=postgresql://user:password@host:port/database
GROQ_API_KEY=your_groq_api_key_here
```

### Variable Descriptions

- **`NEXT_PUBLIC_API_URL`**: Backend API URL (default: `http://localhost:8000`)
- **`NEXT_PUBLIC_USE_MOCK`**: Use mock service instead of real API (default: `false`)
- **`DATABASE_URL`**: PostgreSQL connection string with pgvector
  - Format: `postgresql://user:password@host:port/database`
  - Supabase format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **`GROQ_API_KEY`**: API key from Groq (get from https://console.groq.com/)

## Deployment Configuration

### Vercel (Frontend)

**File:** `application/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Environment Variables (set in Vercel dashboard):**
- `NEXT_PUBLIC_API_URL`: Production backend URL
- `NEXT_PUBLIC_USE_MOCK`: `false`

### Render (Backend)

**File:** `application/render.yaml`

```yaml
services:
  - type: web
    name: edumate-backend
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: python -c "import os; port = int(os.environ.get('PORT', '10000')); import uvicorn; uvicorn.run('backend.main:app', host='0.0.0.0', port=port)"
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: GROQ_API_KEY
        sync: false
      - key: PORT
        value: 10000
    healthCheckPath: /
```

**Environment Variables (set in Render dashboard):**
- `DATABASE_URL`: PostgreSQL connection string
- `GROQ_API_KEY`: Groq API key
- `PORT`: Server port (default: 10000)

## Model Configuration

### LLM Model (Groq)

**Model:** `openai/gpt-oss-20b`

**Tutoring Configuration:**
- **Location:** `application/backend/rag_groq_bot.py`
- **Max Tokens:** 3000
- **Temperature:** Default (not specified)
- **Response Format:** Text (Markdown with LaTeX)

**Quiz Generation Configuration:**
- **Location:** `application/backend/quiz_gen.py`
- **Max Tokens:** 3500
- **Temperature:** 0.1 (low for consistency)
- **Response Format:** JSON (`{"type": "json_object"}`)

### Embedding Model

**Model:** `sentence-transformers/all-MiniLM-L6-v2`

**Configuration:**
- **Dimensions:** 384
- **Location:** `application/backend/rag_groq_bot.py`
- **Usage:** Query and document encoding for vector search

## Database Configuration

### PostgreSQL with pgvector

**Extension Required:** `vector`

**Core Tables:**
- `users`: User accounts (students, parents)
- `k12_content`: Vector table for RAG retrieval
- `quiz_attempts`: Quiz completion tracking
- `session_time_tracking`: Time spent per module
- `total_time_tracking`: Daily time aggregates
- `daily_goals`: Parent-set learning goals
- `parent_student_links`: Parent-student relationships
- `s1_sessions`, `s2_sessions`: Module-specific sessions

**Vector Index:**
```sql
CREATE INDEX k12_content_embedding_idx 
ON k12_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### Connection Pooling

**Configuration:**
- **Min Connections:** 1
- **Max Connections:** 10
- **Location:** `application/backend/database.py`

## RAG Configuration

### Retrieval Parameters

**Tutoring Queries:**
- **Top-k:** 3 documents
- **Context Limit:** ~3000 characters
- **Similarity Metric:** Cosine similarity

**Quiz Generation:**
- **Normal Mode (memory ≤ 450MB):**
  - Top-k: 12 documents
  - Context Limit: 3000 characters
- **Minimal Mode (memory > 450MB):**
  - Top-k: 2 documents
  - Context Limit: 1500 characters
- **Ultra-minimal Mode (1 question):**
  - RAG: Disabled
  - Context: Topic description only

### Memory Optimization

**Memory Thresholds:**
- **High Memory (> 480MB):** Skip RAG entirely
- **Medium Memory (450-480MB):** Minimal RAG mode
- **Low Memory (< 450MB):** Normal RAG mode

**Location:** `application/backend/quiz_gen.py` (lines 233-260)

## Frontend Configuration

### Next.js

**Version:** 15.2.4  
**Framework:** React 18.2.0  
**TypeScript:** Enabled

**Key Dependencies:**
- `katex`: 0.16.23 (LaTeX rendering)
- `recharts`: 2.15.4 (Charts for parent dashboard)
- `tailwindcss`: 4.1.9 (Styling)

### API Configuration

**Base URL:** Set via `NEXT_PUBLIC_API_URL`  
**Mock Mode:** Controlled by `NEXT_PUBLIC_USE_MOCK`

**API Endpoints:**
- `/ask` - RAG tutoring
- `/quiz/generate` - Quiz generation
- `/quiz/grade` - Quiz grading
- `/auth/*` - Authentication
- `/stats/*` - Statistics
- `/goals/*` - Goal management

## Backend Configuration

### FastAPI

**Version:** Latest (from requirements.txt)  
**Server:** Uvicorn  
**Port:** 8000 (development), 10000 (Render)

### CORS Configuration

**Allowed Origins:** Configured in `application/backend/main.py`  
**Methods:** GET, POST, PUT, DELETE, OPTIONS  
**Headers:** Content-Type, Authorization

## Security Configuration

### Password Hashing

**Current:** SHA-256  
**Location:** `application/backend/main.py`  
**Note:** Should be upgraded to bcrypt in production

### Rate Limiting

**Status:** Not implemented  
**Recommendation:** Add rate limiting for production

### Content Filtering

**Method:** System prompts with safety instructions  
**Location:** Prompt files (see `artifacts/prompts/`)

## Performance Configuration

### Memory Management

**Target:** 512MB RAM (Render free tier)  
**Strategies:**
- Lazy model loading
- Model unloading after use
- Adaptive RAG retrieval
- Connection pooling

### Response Time Targets

- **Tutoring (`/ask`):** 1-2 seconds
- **Quiz Generation (`/quiz/generate`):** 2-3 seconds
- **Quiz Grading (`/quiz/grade`):** <100ms

## Development Configuration

### Scripts

**Package.json Scripts:**
- `npm run dev` - Start frontend dev server
- `npm run backend` - Start backend server
- `npm run dev:full` - Start both concurrently
- `npm run build` - Build for production
- `npm run test:e2e` - Run end-to-end tests

**Shell Scripts:**
- `start.sh` - Start both services (macOS/Linux)
- `start.bat` - Start both services (Windows)
- `start_backend.sh` - Start backend only
- `start-frontend.sh` - Start frontend only

## Testing Configuration

### End-to-End Tests

**Framework:** Playwright  
**Configuration:** `application/playwright.config.ts`  
**Test Files:** `application/e2e/*.spec.ts`

**Test Coverage:**
- Authentication flows
- Module navigation
- Quiz generation and grading
- Progress tracking
- Parent dashboard

## Logging Configuration

### Backend Logging

**Level:** INFO (default)  
**Format:** Standard Python logging  
**Location:** Console output

### Frontend Logging

**Method:** Console.log (development)  
**Production:** Vercel Analytics (optional)

## Additional Configuration Files

- **`application/package.json`**: Node.js dependencies and scripts
- **`application/requirements.txt`**: Python dependencies
- **`application/tsconfig.json`**: TypeScript configuration
- **`application/next.config.mjs`**: Next.js configuration
- **`application/tailwind.config.js`**: Tailwind CSS configuration
- **`application/components.json`**: shadcn/ui configuration

## Configuration Best Practices

1. **Never commit `.env` files** - Use `env.example` as template
2. **Use environment variables** for all sensitive data
3. **Set appropriate CORS** origins for production
4. **Enable rate limiting** in production
5. **Use connection pooling** for database connections
6. **Monitor memory usage** on resource-constrained deployments
7. **Enable logging** for debugging and monitoring

## Troubleshooting Configuration

### Issue: Environment variables not loading

**Solution:** Ensure `.env` file exists and is in the correct location:
```bash
ls -la application/.env
```

### Issue: Database connection failed

**Solution:** Verify `DATABASE_URL` format:
```bash
echo $DATABASE_URL
# Should be: postgresql://user:password@host:port/database
```

### Issue: API key not working

**Solution:** Verify Groq API key:
```bash
echo $GROQ_API_KEY
# Should be a valid key from https://console.groq.com/
```

### Issue: Port already in use

**Solution:** Change port in configuration or kill existing process:
```bash
# Find process on port 8000
lsof -ti:8000 | xargs kill -9
```


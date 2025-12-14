# Quick Start Guide

This guide provides a quick path to reproducing the EduMate system and results.

## Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL with pgvector (or Supabase account)
- Groq API key (from https://console.groq.com/)

## 5-Minute Setup

### 1. Clone and Navigate

```bash
cd /path/to/project-check-point-1-edumate/application
```

### 2. Configure Environment

```bash
cp env.example .env
# Edit .env and add:
# - DATABASE_URL (PostgreSQL connection string)
# - GROQ_API_KEY (from Groq console)
```

### 3. Install Dependencies

```bash
# Frontend
npm install

# Backend
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

### 4. Setup Database

```bash
# Enable pgvector extension in your PostgreSQL database
# (In Supabase: SQL Editor > CREATE EXTENSION IF NOT EXISTS vector;)

# Initialize schema
python3 -c "from backend.database import init_db; init_db()"
```

### 5. Populate Data

```bash
# Run data setup script
bash ../artifacts/scripts/reproduce_data_setup.sh
```

### 6. Start Services

```bash
# Option 1: Both together
npm run dev:full

# Option 2: Separately
# Terminal 1:
npm run backend

# Terminal 2:
npm run dev
```

### 7. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

## Verify Installation

### Test Backend

```bash
curl http://localhost:8000/
# Should return: {"status":"API is running"}
```

### Test Frontend

Open http://localhost:3000 in browser - should see login page.

### Test RAG

```bash
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is 2+2?", "grade": 3}'
```

## Common Issues

### Port Already in Use

```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

- Verify `DATABASE_URL` in `.env`
- Ensure PostgreSQL is running
- Check pgvector extension is enabled

### Missing API Key

- Get Groq API key from https://console.groq.com/
- Add to `.env` as `GROQ_API_KEY=your_key_here`

## Next Steps

1. **Create Account:** Navigate to http://localhost:3000/signup
2. **Test Modules:** Try S1, S2, and S3 modules
3. **View Dashboard:** Check parent dashboard features
4. **Review Documentation:** See `application/docs/FINAL_REPORT.md`

## Full Documentation

- **Installation:** `application/INSTALL.md`
- **Artifact Package:** `artifacts/README.md`
- **Data Access:** `artifacts/DATA_ACCESS.md`
- **Configuration:** `artifacts/CONFIGURATION.md`
- **Final Report:** `application/docs/FINAL_REPORT.md`

## Production Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

### Backend (Render)

1. Push code to GitHub
2. Create new web service in Render
3. Use `render.yaml` configuration
4. Set environment variables
5. Deploy

See `application/VERCEL_DEPLOYMENT.md` for details.


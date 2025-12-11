# EduMate Installation Guide

This guide will help you set up EduMate on your local machine for development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/downloads/)
- **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
  - Or use **Supabase** (recommended) - [Sign up](https://supabase.com/)
- **Git** - [Download](https://git-scm.com/downloads)

### Verify Installation

```bash
node --version    # Should be v18+
python --version  # Should be v3.8+
psql --version    # Optional, only if using local PostgreSQL
```

## 🚀 Quick Start

1. **Clone the repository** (if you haven't already)
   ```bash
   git clone <repository-url>
   cd project-check-point-1-edumate/application
   ```

2. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env and add your API keys (see Configuration section below)
   ```

3. **Install dependencies and run**
   ```bash
   # Option 1: Use the provided run script (recommended)
   chmod +x start.sh
   ./start.sh

   # Option 2: Manual setup (see detailed steps below)
   ```

## 📦 Detailed Installation Steps

### Step 1: Frontend Setup (Next.js)

1. **Navigate to the application directory**
   ```bash
   cd application
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Verify installation**
   ```bash
   npm run build  # This should complete without errors
   ```

### Step 2: Backend Setup (Python/FastAPI)

1. **Create a Python virtual environment**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment**
   
   **On macOS/Linux:**
   ```bash
   source venv/bin/activate
   ```
   
   **On Windows:**
   ```bash
   venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Verify installation**
   ```bash
   python -c "import fastapi; print('FastAPI installed successfully')"
   ```

### Step 3: Database Setup

EduMate uses PostgreSQL with the `pgvector` extension. You have two options:

#### Option A: Supabase (Recommended - Easiest)

1. **Create a Supabase account** at [supabase.com](https://supabase.com/)
2. **Create a new project**
3. **Enable pgvector extension:**
   - Go to your project dashboard
   - Navigate to **SQL Editor**
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`
4. **Get your connection string:**
   - Go to **Project Settings** → **Database**
   - Copy the **Connection string** (URI format)
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

#### Option B: Local PostgreSQL

1. **Install PostgreSQL** (if not already installed)
2. **Create a database**
   ```bash
   createdb edumate
   ```
3. **Enable pgvector extension**
   ```bash
   psql edumate -c "CREATE EXTENSION IF NOT EXISTS vector;"
   ```
4. **Set up connection string**
   - Format: `postgresql://username:password@localhost:5432/edumate`

### Step 4: ChromaDB Setup (Vector Database)

ChromaDB is used for RAG (Retrieval-Augmented Generation). The setup script will initialize it automatically.

1. **Run the ChromaDB setup script** (optional - runs automatically on first use)
   ```bash
   # Make sure virtual environment is activated
   source venv/bin/activate  # macOS/Linux
   # or
   venv\Scripts\activate     # Windows
   
   python backend/setup_chroma.py
   ```

   This will:
   - Create a ChromaDB collection
   - Load embeddings from the dataset in `data/test.jsonl`
   - Store data in `chroma_db/` directory

### Step 5: Environment Configuration

1. **Copy the example environment file**
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` file** with your configuration:
   ```bash
   # Required: API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_USE_MOCK=false
   
   # Required: Database
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # Required: Groq API Key
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Get your Groq API key:**
   - Sign up at [console.groq.com](https://console.groq.com/)
   - Create an API key
   - Add it to your `.env` file

### Step 6: Initialize Database Schema

The database schema will be automatically created when you first start the backend. However, you can also initialize it manually:

```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start Python and run initialization
python -c "from backend.database import init_db; init_db()"
```

## 🏃 Running the Application

### Option 1: Using Run Scripts (Recommended)

**macOS/Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```bash
start.bat
```

These scripts will:
- Start the backend server on `http://localhost:8000`
- Start the frontend dev server on `http://localhost:3000`
- Handle virtual environment activation automatically

### Option 2: Using npm Scripts

```bash
# Start both frontend and backend concurrently
npm run dev:full
```

### Option 3: Manual Start

**Terminal 1 - Backend:**
```bash
# Activate virtual environment
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Start backend
npm run backend
# or
python start_backend.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Health Check:** http://localhost:8000/

## 🧪 Testing the Setup

1. **Test Backend API:**
   ```bash
   curl http://localhost:8000/
   # Should return: {"status":"API is running"}
   ```

2. **Test Frontend:**
   - Open http://localhost:3000 in your browser
   - You should see the EduMate login page

3. **Test Database Connection:**
   - The backend will automatically initialize tables on first request
   - Check backend logs for "Database initialized successfully!"

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error:** `Port 8000 is already in use` or `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
# or
netstat -ano | findstr :8000   # Windows, then kill PID

# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9  # macOS/Linux
```

#### 2. Database Connection Failed

**Error:** `Database connection failed`

**Solutions:**
- Verify `DATABASE_URL` in `.env` is correct
- Check if PostgreSQL/Supabase is running
- Verify network connectivity
- Ensure `pgvector` extension is enabled

#### 3. Missing GROQ_API_KEY

**Error:** `Missing GROQ_API_KEY`

**Solution:**
- Get API key from [console.groq.com](https://console.groq.com/)
- Add it to `.env` file as `GROQ_API_KEY=your_key_here`
- Restart the backend server

#### 4. Python Module Not Found

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

#### 5. Node Modules Issues

**Error:** `Cannot find module` or build errors

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### 6. ChromaDB Setup Issues

**Error:** ChromaDB collection not found

**Solution:**
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run setup script manually
python backend/setup_chroma.py
```

## 📚 Additional Resources

- **Backend API Documentation:** http://localhost:8000/docs (when backend is running)
- **Project README:** See `../README.md` for project overview
- **Deployment Guide:** See `DEPLOYMENT.md` for production deployment

## 🎯 Next Steps

After successful installation:

1. **Create a test account:**
   - Navigate to http://localhost:3000/signup
   - Create a student or parent account

2. **Explore the features:**
   - **S1:** Structured Problem-Solving Practice
   - **S2:** AI-Powered Solution Feedback
   - **S3:** Mathematical Quiz Generation

3. **Check the parent dashboard:**
   - Link a student account
   - View progress and analytics

## 💡 Development Tips

- **Hot Reload:** Both frontend and backend support hot reload during development
- **API Testing:** Use the Swagger UI at http://localhost:8000/docs
- **Database Management:** Use Supabase dashboard or pgAdmin for local PostgreSQL
- **Logs:** Check terminal output for detailed error messages

## 🆘 Getting Help

If you encounter issues not covered here:

1. Check the error logs in your terminal
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed and up to date
4. Review the troubleshooting section above

---

**Happy Coding! 🚀**


# EduMate Artifact Package

This artifact package contains all materials necessary to reproduce the results and deploy the EduMate system as described in the final report.

## 📦 Package Contents

1. **Deployed Link and Reproducible Code**
2. **Cleaned Data and Access Instructions**
3. **Prompt Files and Configuration**
4. **Reproduction Scripts**
5. **Additional Figures and Charts**

---

## 1. Deployed Link and Reproducible Code

### 🌐 Live Deployment

**Production URL:** https://project-check-point-1-edumate.vercel.app/login

The application is deployed on Vercel (frontend) and Render (backend). The system is fully functional and accessible at the above URL.

### 📂 Source Code Repository

The complete source code is available in this repository:
- **Repository Root:** `/Users/adityakansara/Desktop/Github/project-check-point-1-edumate/`
- **Application Code:** `/application/`
- **Backend:** `/application/backend/`
- **Frontend:** `/application/app/` (Next.js)

### 🔧 Reproducibility

To reproduce the deployment:

1. **Frontend (Vercel):**
   - Configuration: `application/vercel.json`
   - Build command: `npm run build`
   - Framework: Next.js 15.2.4

2. **Backend (Render):**
   - Configuration: `application/render.yaml`
   - Build command: `pip install -r requirements.txt`
   - Start command: See `render.yaml` for details
   - Environment: Python 3.8+ with FastAPI

3. **Database:**
   - PostgreSQL with pgvector extension (Supabase recommended)
   - Schema initialization: See `application/backend/database.py`

### 📋 Installation Instructions

See `application/INSTALL.md` for detailed setup instructions.

**Quick Start:**
```bash
cd application
cp env.example .env
# Edit .env with your API keys and database URL
npm install
pip install -r requirements.txt
npm run dev:full
```

---

## 2. Cleaned Data and Access Instructions

### 📊 Dataset Files

**Location:** `application/data/`

1. **`test.jsonl`** - Primary K-12 mathematics dataset
   - Format: JSONL (one JSON object per line)
   - Fields: `question`, `answer`, `grade` (optional)
   - Purpose: RAG knowledge base for tutoring and quiz generation
   - Size: See file for exact count

2. **`test_without_grade1.jsonl`** - Alternative dataset variant
   - Same format as `test.jsonl`
   - Excludes grade 1 content

### 🔍 Data Access

**Direct Access:**
```bash
# View dataset
cat application/data/test.jsonl | head -5

# Count entries
wc -l application/data/test.jsonl
```

**Data Loading Script:**
- **Script:** `application/backend/prepare_data.py`
- **Usage:** See `scripts/reproduce_data_setup.sh`

### 📝 Data Format

Each line in the JSONL file follows this structure:
```json
{
  "question": "What is 2 + 2?",
  "answer": "2 + 2 = 4. This is basic addition.",
  "grade": 1
}
```

### 🗄️ Database Population

The data is loaded into PostgreSQL with pgvector for RAG retrieval:

1. **Vector Database Setup:**
   - Script: `application/backend/setup_chroma.py` (legacy ChromaDB)
   - Current: PostgreSQL with pgvector (see `application/backend/database.py`)

2. **Population Process:**
   - Embeddings generated using `sentence-transformers/all-MiniLM-L6-v2`
   - Stored in `k12_content` table with vector(384) embeddings
   - Index: IVFFlat index for fast cosine similarity search

**Reproduction Script:** See `scripts/reproduce_data_setup.sh`

---

## 3. Prompt Files and Configuration

### 📝 System Prompts

All system prompts are documented in:
- **Full Documentation:** `application/docs/prompts.md`
- **Report Appendix:** `application/docs/FINAL_REPORT.md` (Appendix A)

### 🔑 Key Prompt Files

1. **RAG Tutor Prompts**
   - **Location:** `application/backend/rag_groq_bot.py`
   - **System Prompt:** Lines 257
   - **User Prompt:** Lines 258
   - **Extracted:** See `prompts/rag_tutor_prompts.txt`

2. **Quiz Generation Prompts**
   - **Location:** `application/backend/quiz_gen.py`
   - **System Prompt:** Lines 232-241
   - **User Prompt:** Lines 242-272
   - **Extracted:** See `prompts/quiz_generation_prompts.txt`

3. **Grade Adaptation Hints**
   - **Location:** `application/backend/rag_groq_bot.py` (function `get_grade_hint`)
   - **Extracted:** See `prompts/grade_hints.txt`

### ⚙️ Configuration Files

1. **Environment Configuration:**
   - **Template:** `application/env.example`
   - **Required Variables:**
     - `DATABASE_URL` - PostgreSQL connection string
     - `GROQ_API_KEY` - Groq API key for LLM access
     - `NEXT_PUBLIC_API_URL` - Backend API URL

2. **Deployment Configuration:**
   - **Vercel:** `application/vercel.json`
   - **Render:** `application/render.yaml`

3. **Model Configuration:**
   - **LLM Model:** `openai/gpt-oss-20b` (Groq)
   - **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2`
   - **Max Tokens:** 3000 (tutoring), 3500 (quiz generation)
   - **Temperature:** Default (tutoring), 0.1 (quiz generation)

### 📋 Prompt Templates

See `prompts/` directory for extracted prompt templates in plain text format.

---

## 4. Scripts to Reproduce Results

### 🔄 Reproduction Scripts

All reproduction scripts are located in `scripts/`:

1. **`reproduce_data_setup.sh`**
   - Sets up vector database
   - Populates PostgreSQL with embeddings
   - Verifies data loading

2. **`reproduce_evaluation.sh`**
   - Runs comparative evaluation
   - Generates scoring results
   - Produces evaluation reports

3. **`reproduce_full_setup.sh`**
   - Complete system setup
   - Database initialization
   - Data population
   - Service startup

### 🧪 Evaluation Scripts

1. **Comparative Evaluation:**
   - Manual evaluation process documented in `application/docs/FINAL_REPORT.md` (Section 4)
   - Test prompts: See `application/docs/FINAL_REPORT.md` (Appendix B)
   - Scoring rubric: See `application/docs/FINAL_REPORT.md` (Appendix C)

2. **User Survey:**
   - Survey results: See `application/docs/FINAL_REPORT.md` (Section 5.5)
   - Survey data: See `application/docs/images/` for feedback screenshots

3. **End-to-End Testing:**
   - **Scripts:** `application/e2e/*.spec.ts`
   - **Run:** `npm run test:e2e`
   - **Coverage:** Authentication, module navigation, quiz generation, progress tracking

### 📊 Performance Metrics

System performance metrics are documented in:
- **Report Section:** `application/docs/FINAL_REPORT.md` (Section 5.6)
- **Metrics Include:**
  - API response times
  - Memory usage patterns
  - Vector search performance
  - Database query performance
  - Error rates

---

## 5. Additional Figures and Charts

### 📈 Evaluation Figures

**Location:** `application/docs/images/`

1. **User Survey Results:**
   - `S1_Feedback.png` - S1 module feedback
   - `S2_Feedback.png` - S2 module feedback
   - `S3_Feedback.png` - S3 module feedback
   - `progress_Feedback.png` - Progress tracking feedback
   - `pdboard_Feedback.png` - Parent dashboard feedback
   - `controls.png` - Learning controls feedback
   - `math_Feedback.png` - Mathematical expression clarity
   - `good.png` - Positive feedback
   - `improve.png` - Areas for improvement

2. **System Screenshots:**
   - `S1.png` - S1 Structured Problem-Solving Practice
   - `S2.png` - S2 AI-Powered Solution Feedback
   - `S3.png` - S3 Mathematical Quiz Generation
   - `pdboard.png` - Parent Dashboard
   - `supabase_database_schema.png` - Database schema

3. **Architecture Diagrams:**
   - **Location:** `application/docs/Architecture/`
   - `Architecture.png` - High-level system architecture
   - `Backend Components.png` - Backend service architecture
   - Additional flow diagrams available

### 📊 Performance Charts

Performance metrics are documented in the final report (Section 5.6):
- API response times: 1-3 seconds average
- Memory usage: Optimized for 512MB RAM constraint
- Vector search: 15-50ms latency
- Error rates: <2% across all operations

### 📉 Learning Curves and Cost Analysis

**Note:** Detailed learning curves and cost charts are not included in this artifact package as they were not generated during the evaluation phase. The system focuses on:
- Response quality (measured via rubric)
- User satisfaction (measured via survey)
- System performance (measured via technical metrics)

For cost analysis:
- **Groq API:** Free tier used (no cost during evaluation)
- **Vercel:** Free tier (frontend hosting)
- **Render:** Free tier (backend hosting, 512MB RAM)
- **Supabase:** Free tier (PostgreSQL with pgvector)

---

## 🚀 Quick Reproduction Guide

### Step 1: Environment Setup
```bash
cd application
cp env.example .env
# Edit .env with your credentials
```

### Step 2: Install Dependencies
```bash
npm install
pip install -r requirements.txt
```

### Step 3: Database Setup
```bash
# Set up PostgreSQL with pgvector (Supabase recommended)
# Update DATABASE_URL in .env
```

### Step 4: Data Population
```bash
# Run data setup script
bash scripts/reproduce_data_setup.sh
```

### Step 5: Start Services
```bash
npm run dev:full
```

### Step 6: Verify Deployment
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📚 Additional Documentation

- **Final Report:** `application/docs/FINAL_REPORT.md`
- **Installation Guide:** `application/INSTALL.md`
- **Architecture Documentation:** `application/docs/Architecture/`
- **Prompt Documentation:** `application/docs/prompts.md`
- **Project README:** `README.md`

---

## 🔐 Access Credentials

**Note:** The deployed system requires:
- Groq API key (get from https://console.groq.com/)
- PostgreSQL database with pgvector (Supabase recommended)
- Environment variables configured (see `application/env.example`)

For local reproduction, all credentials should be set in `.env` file.

---

## 📞 Support

For questions or issues with reproduction:
1. Check `application/INSTALL.md` for troubleshooting
2. Review `application/docs/FINAL_REPORT.md` for system details
3. Examine error logs in terminal output

---

**Last Updated:** 2025-01-XX
**Version:** 1.0
**Author:** Aditya Kansara


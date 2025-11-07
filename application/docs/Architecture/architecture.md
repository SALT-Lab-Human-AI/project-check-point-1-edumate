# EduMate Architecture Documentation

This document provides a comprehensive overview of the EduMate system architecture, including component interactions, data flows, and technology stack.

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Technology Stack](#technology-stack)
6. [Database Schema](#database-schema)
7. [API Architecture](#api-architecture)
8. [RAG Pipeline Architecture](#rag-pipeline-architecture)

---

## System Overview

EduMate is a K-12 AI-powered tutoring platform that combines:
- **Retrieval-Augmented Generation (RAG)** for accurate, curriculum-aligned answers
- **Multi-module learning system** (S1: Structured Practice, S2: Solution Feedback, S3: Quiz Generation)
- **Parent dashboard** for progress tracking and goal setting
- **Real-time analytics** and progress monitoring

---

## High-Level Architecture

![High-Level Architecture](Architecture.png)

---

## Component Architecture

### Frontend Components

![Frontend Components](Frontend%20Components.png)

### Backend Components

![Backend Components](Backend%20Components.png)

---

## Data Flow Diagrams

### Tutor Question Flow (S1 & S2)

![Tutor Question Flow (S1 & S2)](Tutor%20Question%20Flow%20(S1%20%26%20S2).png)

### Quiz Generation Flow (S3)

![Quiz Generation Flow (S3)](Quiz%20Generation%20Flow%20(S3).png)

### Authentication & Session Flow

![Authentication & Session Flow](Authentication%20%26%20Session%20Flow.png)

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4 (React 18.2.0)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4.1.9
- **UI Components**: shadcn/ui (Radix UI)
- **Math Rendering**: KaTeX 0.16.23
- **State Management**: React Context API
- **HTTP Client**: Fetch API

### Backend
- **Framework**: FastAPI (Python)
- **Server**: Uvicorn
- **Language**: Python 3.8+
- **Database ORM**: psycopg2 (PostgreSQL adapter)
- **Validation**: Pydantic

### AI & ML
- **LLM Provider**: Groq API (openai/gpt-oss-20b)
- **Embedding Model**: SentenceTransformer (all-MiniLM-L6-v2, 384-dim)
- **Vector Database**: PostgreSQL with pgvector extension
- **Local Development**: ChromaDB (DuckDB + Parquet)

### Database
- **Primary Database**: PostgreSQL (Supabase)
- **Extensions**: pgvector (for vector similarity search)
- **Connection Pooling**: psycopg2 SimpleConnectionPool

### Infrastructure
- **Development**: Local (Node.js + Python)
- **Deployment**: 
  - Frontend: Vercel
  - Backend: Render
  - Database: Supabase

---

## Database Schema

### Core Tables

![Core Tables](Core%20Tables.png)

### Vector Store Schema

The `k12_content` table stores embeddings for RAG:

```sql
CREATE TABLE k12_content (
    id VARCHAR(255) PRIMARY KEY,
    document TEXT NOT NULL,
    question TEXT,
    embedding vector(384)  -- 384-dimensional embeddings from all-MiniLM-L6-v2
);

CREATE INDEX k12_content_embedding_idx 
ON k12_content 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## API Architecture

### REST API Endpoints

```mermaid
graph TB
    subgraph "Public Endpoints"
        HEALTH[GET /<br/>Health Check]
    end
    
    subgraph "Tutor Endpoints"
        ASK_ENDPOINT[POST /ask<br/>Ask Question]
    end
    
    subgraph "Quiz Endpoints"
        QUIZ_GEN_ENDPOINT[POST /quiz/generate<br/>Generate Quiz]
        QUIZ_GRADE_ENDPOINT[POST /quiz/grade<br/>Grade Quiz]
        QUIZ_TRACK[POST /quiz/track<br/>Track Attempt]
    end
    
    subgraph "Authentication Endpoints"
        SIGNUP[POST /auth/signup]
        LOGIN[POST /auth/login]
        LINK[POST /auth/link-account]
        GET_STUDENTS[GET /auth/students/:parent_id]
    end
    
    subgraph "Analytics Endpoints"
        STATS[GET /stats/student/:student_id]
        TIME_TRACK[POST /time/track]
    end
    
    subgraph "Goal Management"
        GET_GOALS[GET /goals/student/:student_id]
        SET_GOALS[POST /goals/student/:student_id]
        PARENT_SET_GOALS[POST /goals/parent/:parent_id/student/:student_id]
        GOALS_COMPLETION[GET /goals/student/:student_id/month/:year/:month]
    end
    
    subgraph "Student Management"
        UPDATE_GRADE[POST /students/parent/:parent_id/student/:student_id/grade]
    end
```

### API Request/Response Examples

#### Tutor Question
```http
POST /ask
Content-Type: application/json

{
  "question": "How do I solve 2x + 5 = 13?",
  "grade": 7
}

Response:
{
  "answer": "To solve $2x + 5 = 13$:\n\n1. Subtract 5 from both sides: $2x = 8$\n2. Divide by 2: $x = 4$"
}
```

#### Quiz Generation
```http
POST /quiz/generate
Content-Type: application/json

{
  "topic": "Linear Equations",
  "grade": 7,
  "num_questions": 5,
  "difficulty": "medium"
}

Response:
{
  "items": [
    {
      "id": "q1",
      "question_md": "Solve for $x$: $3x - 7 = 14$",
      "choices": {
        "A": "$x = 5$",
        "B": "$x = 7$",
        "C": "$x = 9$",
        "D": "$x = 11$"
      },
      "correct": "B",
      "explanation_md": "Add 7 to both sides: $3x = 21$, then divide by 3: $x = 7$",
      "skill_tag": "solving_linear_equations"
    }
  ],
  "meta": {
    "topic": "Linear Equations",
    "grade": 7,
    "difficulty": "medium"
  }
}
```

---

## RAG Pipeline Architecture

### Detailed RAG Flow

```mermaid
graph TB
    subgraph "Input Processing"
        QUERY[User Question<br/>+ Grade Level]
        GRADE_HINT[Generate Grade Hint<br/>K-3, 4-6, 7-9, 10-12]
    end
    
    subgraph "Embedding Generation"
        EMBED_MODEL[SentenceTransformer<br/>all-MiniLM-L6-v2]
        QUERY_EMBED[Query Embedding<br/>384-dimensional vector]
    end
    
    subgraph "Vector Retrieval"
        VECTOR_SEARCH[Cosine Similarity Search<br/>top_k=3]
        CONTEXT[Retrieved Context<br/>Relevant K-12 Content]
    end
    
    subgraph "LLM Generation"
        PROMPT[Construct Prompt<br/>Context + Question + Grade Hint]
        GROQ[Groq API<br/>openai/gpt-oss-20b]
        RAW_ANSWER[Raw Answer<br/>Markdown + LaTeX]
    end
    
    subgraph "Post-Processing"
        LATEX_FORMAT[Format LaTeX<br/>Convert to KaTeX format]
        FINAL_ANSWER[Final Answer<br/>Formatted Markdown]
    end
    
    QUERY --> EMBED_MODEL
    QUERY --> GRADE_HINT
    EMBED_MODEL --> QUERY_EMBED
    QUERY_EMBED --> VECTOR_SEARCH
    VECTOR_SEARCH --> CONTEXT
    CONTEXT --> PROMPT
    QUERY --> PROMPT
    GRADE_HINT --> PROMPT
    PROMPT --> GROQ
    GROQ --> RAW_ANSWER
    RAW_ANSWER --> LATEX_FORMAT
    LATEX_FORMAT --> FINAL_ANSWER
```

### RAG Prompt Structure

```
Context: [Retrieved relevant K-12 content from vector database]

Question: [User's question]

Grade Level: [K-3 / 4-6 / 7-9 / 10-12 appropriate hint]

Instructions:
- Provide step-by-step explanation
- Use grade-appropriate language
- Include LaTeX for mathematical expressions
- Verify the answer is correct
```

### Vector Search Algorithm

1. **Embed Query**: Convert user question to 384-dimensional vector
2. **Similarity Search**: Use cosine similarity (`<=>` operator in pgvector)
3. **Retrieve Top-K**: Get top 3 most similar documents
4. **Context Assembly**: Combine retrieved documents into context string
5. **LLM Generation**: Pass context + question to Groq API

---

## System Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend (Vercel)"
            VERCEL[Vercel CDN]
            NEXTJS_PROD[Next.js Build]
        end
        
        subgraph "Backend (Render)"
            RENDER[Render Service]
            FASTAPI_PROD[FastAPI App]
        end
        
        subgraph "Database (Supabase)"
            SUPABASE[Supabase PostgreSQL]
            PG_VECTOR[pgvector Extension]
        end
        
        subgraph "External APIs"
            GROQ_PROD[Groq Cloud API]
        end
    end
    
    subgraph "Development Environment"
        LOCAL_NEXT[Local Next.js<br/>localhost:3000]
        LOCAL_API[Local FastAPI<br/>localhost:8000]
        LOCAL_PG[Local PostgreSQL<br/>or Supabase]
        LOCAL_CHROMA[ChromaDB<br/>Local Storage]
    end
    
    VERCEL --> NEXTJS_PROD
    NEXTJS_PROD --> RENDER
    RENDER --> FASTAPI_PROD
    FASTAPI_PROD --> SUPABASE
    SUPABASE --> PG_VECTOR
    FASTAPI_PROD --> GROQ_PROD
    
    LOCAL_NEXT --> LOCAL_API
    LOCAL_API --> LOCAL_PG
    LOCAL_API --> LOCAL_CHROMA
    LOCAL_API --> GROQ_PROD
```

---

## Security Architecture

### Authentication Flow

![Authentication Flow](Authentication%20Flow.png)

### Security Measures

- **Password Hashing**: SHA-256 (upgrade to bcrypt recommended for production)
- **CORS**: Configured for frontend origin
- **Environment Variables**: Sensitive keys stored in `.env`
- **API Validation**: Pydantic models for request validation
- **Role-Based Access**: Student vs Parent roles

---

## Performance Considerations

### Caching Strategy
- **Embedding Model**: Lazy loading to reduce memory usage
- **Database Connections**: Connection pooling (1-10 connections)
- **Vector Index**: IVFFlat index for fast similarity search

### Scalability
- **Stateless Backend**: FastAPI is stateless, can scale horizontally
- **Database Connection Pooling**: Handles concurrent requests
- **Vector Search Optimization**: Indexed vector search for fast retrieval

---

## Monitoring & Logging

### Key Metrics
- API response times
- Vector search performance
- Database query performance
- Groq API latency
- Error rates

### Logging Points
- API requests/responses
- Database operations
- RAG pipeline steps
- Authentication events
- Quiz attempts



# Telemetry & Observability Report

This document reports on the current telemetry, logging, and observability implementation in the EduMate platform, including what data is stored in the database and how test cases are debugged.

## Table of Contents

1. [Overview](#overview)
2. [Database Telemetry](#database-telemetry)
3. [Application Logging](#application-logging)
4. [Error Tracking](#error-tracking)
5. [Debugging Test Cases](#debugging-test-cases)
6. [Current Limitations](#current-limitations)

---

## Overview

EduMate currently implements telemetry and observability through:
- **Database logging**: Structured data stored in PostgreSQL tables
- **Console logging**: Print statements for debugging and monitoring
- **Error responses**: API error messages returned to clients
- **Statistics tracking**: Aggregated data for analytics

The current implementation focuses on:
- User activity tracking (quizzes, sessions, time spent)
- Performance monitoring (response times, errors)
- Debug information (print statements in key areas)

---

## Database Telemetry

### User Activity Tracking

#### Quiz Attempts (`quiz_attempts` table)

**Location:** `application/backend/database.py` lines 111-126

**Current Schema:**
```sql
CREATE TABLE quiz_attempts (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    quiz_topic VARCHAR(255) NOT NULL,
    quiz_grade INTEGER NOT NULL,
    quiz_difficulty VARCHAR(50) NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_answers INTEGER NOT NULL,
    score_percentage REAL NOT NULL,
    quiz_items TEXT NOT NULL,  -- JSON string
    answers TEXT NOT NULL,      -- JSON string
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Data Logged:**
- Quiz completion metadata (topic, grade, difficulty)
- Performance metrics (score, correct answers, percentage)
- Full quiz content (questions and student answers as JSON)
- Timestamp of completion

**Usage:**
- Stored via `/quiz/track` endpoint (`application/backend/main.py` lines 535-570)
- Used for statistics calculation (`/stats/student/:id`)
- Enables progress tracking and analytics

**Example Record:**
```json
{
  "id": "abc123...",
  "student_id": "student-id",
  "quiz_topic": "Linear Equations",
  "quiz_grade": 7,
  "quiz_difficulty": "medium",
  "total_questions": 5,
  "correct_answers": 4,
  "score_percentage": 80.0,
  "quiz_items": "[{\"id\":\"q1\",\"question_md\":\"...\",...}]",
  "answers": "[{\"id\":\"q1\",\"selected\":\"B\"},...]",
  "completed_at": "2025-01-27T10:30:00Z"
}
```

#### Session Time Tracking (`session_time_tracking` table)

**Location:** `application/backend/database.py` lines 156-168

**Current Schema:**
```sql
CREATE TABLE session_time_tracking (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    module VARCHAR(10) NOT NULL CHECK(module IN ('s1', 's2', 's3')),
    time_spent_seconds INTEGER NOT NULL,
    session_date DATE NOT NULL,
    session_started_at TIMESTAMP,
    session_ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Data Logged:**
- Individual session records per module (S1, S2, S3)
- Time spent in each session (seconds)
- Session start and end timestamps
- Date of session

**Usage:**
- Stored via `/time/track` endpoint (`application/backend/main.py` lines 572-664)
- Used for daily time totals and activity tracking
- Enables time-on-task analytics

**Example Record:**
```json
{
  "id": "session-id",
  "student_id": "student-id",
  "module": "s1",
  "time_spent_seconds": 300,
  "session_date": "2025-01-27",
  "session_started_at": "2025-01-27T10:00:00Z",
  "session_ended_at": "2025-01-27T10:05:00Z",
  "created_at": "2025-01-27T10:05:00Z"
}
```

#### Cumulative Time Tracking (`total_time_tracking` table)

**Location:** `application/backend/database.py` lines 182-193

**Current Schema:**
```sql
CREATE TABLE total_time_tracking (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    module VARCHAR(10) NOT NULL CHECK(module IN ('s1', 's2', 's3')),
    total_time_seconds INTEGER NOT NULL DEFAULT 0,
    session_date DATE NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, module, session_date)
)
```

**Data Logged:**
- Daily cumulative time totals per module
- Updated timestamp for each modification
- Aggregated from individual sessions

**Usage:**
- Automatically updated when sessions are recorded
- Used for daily goal tracking
- Enables quick time-on-task queries

#### S1 Practice Sessions (`s1_sessions` table)

**Location:** `application/backend/database.py` lines 129-139

**Current Schema:**
```sql
CREATE TABLE s1_sessions (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    grade INTEGER NOT NULL,
    question TEXT NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Data Logged:**
- Practice questions completed in S1 module
- Topic and grade level
- Question text (full question)

**Usage:**
- Tracks structured practice activity
- Used in statistics (`s1_sessions` count)

#### S2 Feedback Sessions (`s2_sessions` table)

**Location:** `application/backend/database.py` lines 142-153

**Current Schema:**
```sql
CREATE TABLE s2_sessions (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    student_solution TEXT NOT NULL,
    is_correct BOOLEAN,
    feedback_mode VARCHAR(50) NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Data Logged:**
- Solution feedback sessions
- Student's question and solution
- Correctness flag
- Feedback mode used (hints vs direct answer)

**Usage:**
- Tracks solution feedback activity
- Used in statistics (`s2_sessions` count)

#### Daily Goals (`daily_goals` table)

**Location:** `application/backend/database.py` lines 196-208

**Current Schema:**
```sql
CREATE TABLE daily_goals (
    id VARCHAR(255) PRIMARY KEY,
    student_id VARCHAR(255) NOT NULL,
    target_time_seconds INTEGER NOT NULL DEFAULT 0,
    target_quizzes INTEGER NOT NULL DEFAULT 0,
    goal_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, goal_date)
)
```

**Data Logged:**
- Daily goal settings per student
- Target time and quiz counts
- Creation and update timestamps

**Usage:**
- Tracks goal settings over time
- Used for goal completion calculations

#### User Accounts (`users` table)

**Location:** `application/backend/database.py` lines 83-95

**Current Schema:**
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK(role IN ('student', 'parent')),
    grade INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_id VARCHAR(255)
)
```

**Data Logged:**
- User account information
- Account creation timestamp
- Role and grade level
- Parent-student relationships

**Usage:**
- Authentication and authorization
- User profile management
- Relationship tracking

#### Parent-Student Links (`parent_student_links` table)

**Location:** `application/backend/database.py` lines 98-108

**Current Schema:**
```sql
CREATE TABLE parent_student_links (
    id VARCHAR(255) PRIMARY KEY,
    parent_id VARCHAR(255) NOT NULL,
    student_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_id, student_id)
)
```

**Data Logged:**
- Parent-student relationship mappings
- Link creation timestamp

**Usage:**
- Access control (parent viewing student data)
- Relationship verification

---

## Application Logging

### Console Logging (Print Statements)

**Current Implementation:** Uses Python `print()` statements for logging

#### Database Initialization Logs

**Location:** `application/backend/main.py` lines 24-36

**Current Logs:**
```python
print("Database initialized successfully on startup")
print(f"Warning: Database initialization deferred: {e}")
print("Will retry on first database request")
print("Vector table initialized successfully on startup")
print(f"Warning: Could not initialize vector table on startup: {e}")
print("Will retry on first vector operation")
```

**Purpose:**
- Startup status messages
- Error warnings for deferred initialization
- Connection status

#### Embedding Model Loading

**Location:** `application/backend/rag_groq_bot.py` lines 43-45

**Current Logs:**
```python
print("Loading embedding model...")
print("Embedding model loaded!")
```

**Purpose:**
- Indicates when embedding model is being loaded (lazy loading)
- Useful for debugging slow first requests

#### Vector Database Operations

**Location:** `application/backend/rag_groq_bot.py` lines 88-150

**Current Logs:**
```python
print(f"Vector table '{COLLECTION_NAME}' initialized!")
print(f"Error initializing vector table: {e}")
print(f"Vector table '{COLLECTION_NAME}' already has {count} documents. Skipping population.")
print(f"Dataset file not found: {DATASET_PATH}")
print(f"Total QA pairs found: {len(data)}")
print(f"Populating vector table '{COLLECTION_NAME}'...")
print(f"Vector table '{COLLECTION_NAME}' populated with {len(data)} documents!")
print(f"Error populating vector table: {e}")
print(f"Vector table is empty. Will populate in background.")
print(f"Background population failed: {e}")
print(f"Could not start background population: {e}")
print(f"Warning: Could not access vector database: {e}")
```

**Purpose:**
- Vector table initialization status
- Population progress and errors
- Background operation status

#### Time Tracking Errors

**Location:** `application/backend/main.py` line 658

**Current Logs:**
```python
print(f"[Time Track Error] {e}")
```

**Purpose:**
- Error logging for time tracking failures
- Includes error message for debugging

#### Statistics API Debug Logs

**Location:** `application/backend/main.py` lines 759-833

**Current Logs:**
```python
print(f"[Stats API] Processing {len(session_tracking)} sessions for student {student_id}")
print(f"[Stats API] WARNING: No sessions found for student {student_id}")
print(f"[Stats API] Raw session data: {track}")
print(f"[Stats API] Skipping session with no date: {track}")
print(f"[Stats API] Adding session activity: {activity_entry}")
print(f"[Stats API] Error parsing date '{date_val}': {e}")
print(f"[Stats API] Error sorting: {e}")
print(f"[Stats API] Returning {len(recent_activities)} activities:")
print(f"  {i+1}. {act.get('type')} - {act.get('title')} - {act.get('time_spent')} - {act.get('date')}")
```

**Purpose:**
- Debug information for statistics aggregation
- Activity processing status
- Error tracking for date parsing and sorting
- Activity list output for verification

#### Database Connection Errors

**Location:** `application/backend/database.py` lines 37, 73, 214

**Current Logs:**
```python
print(f"Error creating connection pool: {e}")
print(f"Error getting database connection: {e}")
print("Database initialized successfully!")
print(f"Error initializing database: {e}")
```

**Purpose:**
- Connection pool errors
- Database initialization status
- Connection failure diagnostics

---

## Error Tracking

### API Error Responses

**Current Implementation:** Errors are returned as JSON responses with error messages

#### Error Response Format

**Standard Format:**
```json
{
  "error": "Error message description",
  "success": false
}
```

**Success Response Format:**
```json
{
  "success": true,
  "data": {...}
}
```

#### Error Types Logged

**Authentication Errors:**
- "Email already registered" (`/auth/signup`)
- "Grade is required for students" (`/auth/signup`)
- "Invalid email or role" (`/auth/login`)
- "Invalid password" (`/auth/login`)
- "Student not found" (`/auth/link-account`)
- "Account already linked" (`/auth/link-account`)

**Validation Errors:**
- "Invalid payload" (`/time/track`)
- "Invalid module. Only s1, s2, s3 are allowed" (`/time/track`)
- "Invalid request: must specify is_session or update_total_only" (`/time/track`)
- "Student not linked to this parent" (`/goals/parent/:id/student/:id`)
- "Goals must be non-negative" (`/goals/parent/:id/student/:id`)
- "Grade is required" (`/students/parent/:id/student/:id/grade`)
- "Grade must be an integer between 1 and 12" (`/students/parent/:id/student/:id/grade`)

**Quiz Generation Errors:**
- "Quiz generation failed: {e}" (`/quiz/generate`)
- Returns empty items array with error message

**Quiz Grading Errors:**
- "Quiz grading failed: {e}" (`/quiz/grade`)
- Returns zero score with error message

**Database Errors:**
- Database connection failures logged to console
- Transaction rollbacks on errors
- Error messages returned to client

### Exception Handling

**Current Pattern:**
```python
try:
    # Operation
    conn.commit()
    return {"success": True, ...}
except Exception as e:
    conn.rollback()
    print(f"[Error] {e}")  # Console log
    return {"error": str(e), "success": False}  # API response
finally:
    cursor.close()
    return_db(conn)
```

**Coverage:**
- All database operations wrapped in try-except
- Errors logged to console
- Errors returned to client
- Resources cleaned up in finally blocks

---

## Debugging Test Cases

### Database Query Verification

**Current Approach:** Direct SQL queries to verify test data

#### User Verification

**Query:**
```sql
SELECT id, email, name, role, grade, created_at
FROM users
WHERE email = 'test@example.com';
```

**Purpose:**
- Verify user creation in signup tests
- Check role and grade assignment
- Verify account linking

#### Quiz Attempt Verification

**Query:**
```sql
SELECT student_id, quiz_topic, quiz_grade, quiz_difficulty,
       total_questions, correct_answers, score_percentage, completed_at
FROM quiz_attempts
WHERE student_id = 'student-id'
ORDER BY completed_at DESC;
```

**Purpose:**
- Verify quiz tracking in test cases
- Check score calculations
- Validate metadata storage

#### Time Tracking Verification

**Query:**
```sql
-- Individual sessions
SELECT student_id, module, time_spent_seconds, session_date,
       session_started_at, session_ended_at
FROM session_time_tracking
WHERE student_id = 'student-id'
ORDER BY session_ended_at DESC;

-- Cumulative totals
SELECT student_id, module, total_time_seconds, session_date, last_updated
FROM total_time_tracking
WHERE student_id = 'student-id' AND session_date = CURRENT_DATE;
```

**Purpose:**
- Verify session recording
- Check cumulative totals
- Validate time calculations

#### Statistics Verification

**Query:**
```sql
-- Quiz statistics
SELECT 
    COUNT(DISTINCT qa.id) as total_quizzes,
    AVG(qa.score_percentage) as avg_score,
    SUM(qa.correct_answers) as total_correct,
    SUM(qa.total_questions) as total_questions,
    (SUM(qa.correct_answers)::float / NULLIF(SUM(qa.total_questions), 0) * 100) as accuracy
FROM quiz_attempts qa
WHERE qa.student_id = 'student-id';
```

**Purpose:**
- Verify statistics calculations
- Compare with API response
- Debug aggregation issues

### Console Log Analysis

**Current Debugging Method:** Review console output for print statements

#### Key Debug Points

**Startup:**
- Database initialization status
- Vector table initialization
- Connection pool creation

**Request Processing:**
- Embedding model loading (first request)
- Vector search operations
- Statistics aggregation details

**Error Scenarios:**
- Database connection failures
- Vector table population errors
- Time tracking errors
- Statistics processing errors

### API Response Inspection

**Current Approach:** Check API response structure and error messages

#### Response Verification

**Success Cases:**
- Check `success: true` field
- Verify data structure matches expected format
- Validate timestamps and IDs

**Error Cases:**
- Check `success: false` field
- Read `error` message for details
- Verify error type matches expected failure

### Network Tab Debugging

**Current Approach:** Use browser DevTools Network tab

**Information Available:**
- Request/response payloads
- Response times
- HTTP status codes
- Error responses

**Usage:**
- Verify API calls are made
- Check request parameters
- Inspect response data
- Identify timeout issues

### Test Data Cleanup

**Current Approach:** Manual SQL cleanup after testing

**Cleanup Queries:**
```sql
-- Remove test users
DELETE FROM users
WHERE email LIKE '%test%' OR email LIKE '%example.com%';

-- Remove test quiz attempts
DELETE FROM quiz_attempts
WHERE student_id IN (
    SELECT id FROM users WHERE email LIKE '%test%'
);

-- Remove test time tracking
DELETE FROM session_time_tracking
WHERE student_id IN (
    SELECT id FROM users WHERE email LIKE '%test%'
);

DELETE FROM total_time_tracking
WHERE student_id IN (
    SELECT id FROM users WHERE email LIKE '%test%'
);
```

---

## Current Limitations

### Logging Infrastructure

**Current State:**
- No structured logging framework (using `print()` statements)
- No log levels (INFO, WARN, ERROR, DEBUG)
- No log aggregation or centralized logging
- No log rotation or retention policies
- Console output only (not persisted to files)

**Impact:**
- Logs lost on server restart
- No historical log analysis
- Difficult to filter by severity
- No correlation between related events

### Telemetry Gaps

**Missing Metrics:**
- API response times (not logged)
- Request counts (not tracked)
- Error rates (not aggregated)
- Vector search performance (not measured)
- Groq API latency (not tracked)
- Database query performance (not measured)

**Missing Events:**
- User login/logout events (not logged)
- Page navigation (not tracked)
- Feature usage (limited tracking)
- Error frequency by endpoint (not aggregated)

### Debugging Limitations

**Current Constraints:**
- No distributed tracing
- No request ID correlation
- Limited error context (just error messages)
- No performance profiling
- No automated alerting

**Impact:**
- Difficult to debug production issues
- Hard to trace requests across services
- No performance monitoring
- Reactive debugging (after issues occur)

### Observability Coverage

**Currently Observable:**
- ✅ User activity (quizzes, sessions, time)
- ✅ Database state (all tables)
- ✅ Basic error messages
- ✅ Statistics aggregation

**Not Observable:**
- ❌ API performance metrics
- ❌ System resource usage
- ❌ External API (Groq) performance
- ❌ Database query performance
- ❌ Frontend errors
- ❌ User session flows
- ❌ Feature adoption rates

---

## Current Observability Architecture

### Data Flow

```
User Action
    ↓
API Request (FastAPI)
    ↓
Database Operation
    ↓
Data Stored (PostgreSQL)
    ↓
Statistics Aggregation
    ↓
Response Returned
```

**Logging Points:**
- Database initialization (startup)
- Vector operations (RAG pipeline)
- Error occurrences (try-except blocks)
- Statistics processing (debug prints)

### Monitoring Approach

**Current Method:**
- Manual inspection of database tables
- Console log review
- API response inspection
- Test case verification queries

**Tools Used:**
- PostgreSQL queries (data verification)
- Browser DevTools (network inspection)
- Console output (server logs)
- Test scripts (automated verification)

---

## Statistics and Analytics

### Current Statistics Tracked

**Student Statistics (`/stats/student/:id`):**
- Total quizzes completed
- Average score percentage
- Total correct answers
- Total questions answered
- Accuracy percentage
- S1 session count
- S2 session count
- Today's total time (seconds)
- Today's quiz count
- Recent quizzes (last 10)
- Recent activities (last 5)

**Data Sources:**
- `quiz_attempts` table (quiz statistics)
- `session_time_tracking` table (session counts)
- `total_time_tracking` table (time totals)
- `s1_sessions` table (S1 count)
- `s2_sessions` table (S2 count)

### Aggregation Methods

**Current Implementation:**
- SQL aggregations (COUNT, SUM, AVG)
- Date filtering (today's data)
- Sorting and limiting (recent items)
- Activity merging (quizzes + sessions)

**Location:** `application/backend/main.py` lines 666-870

---

## Error Patterns and Debugging

### Common Error Scenarios

**Database Connection Errors:**
- Symptom: "Database connection failed" error
- Debug: Check console for connection pool errors
- Verification: Test DATABASE_URL connection string

**Vector Table Empty:**
- Symptom: RAG falls back to direct Groq (no context)
- Debug: Check console for "Vector table is empty" message
- Verification: Query `k12_content` table count

**Quiz Generation Failures:**
- Symptom: Empty items array with error message
- Debug: Check console for Groq API errors
- Verification: Test GROQ_API_KEY validity

**Time Tracking Errors:**
- Symptom: "[Time Track Error]" in console
- Debug: Check payload structure and module validation
- Verification: Query `session_time_tracking` table

**Statistics Aggregation Issues:**
- Symptom: "[Stats API] Error" messages in console
- Debug: Review debug prints for activity processing
- Verification: Compare SQL queries with API response




# Minimal Test Cases - Critical Paths

**Purpose:** Document minimal test scenarios for critical functionality that MUST work in production.

**Test Strategy:** Generic test scenarios without hardcoded data. Each test should be repeatable with any valid user/content.

**Performance Requirements:**

- AI responses (RAG pipeline): Maximum 10 minutes timeout
- Quiz generation: Maximum 2 minutes timeout
- Other operations: No specific baseline (best effort)

---

## Test Suite 1: Authentication & User Management (MISSION CRITICAL)

### Test 1.1: New Student Signup Flow

**Priority:** CRITICAL

**Path:** Frontend → FastAPI `/auth/signup` → PostgreSQL User Creation → Session Initialization

**Steps:**

1. Navigate to `/signup`

2. Select "Student" role

3. Enter any email (e.g., `newstudent@example.com`)

4. Enter any password (minimum 6 characters)

5. Enter any name (e.g., `Test Student`)

6. Select any grade (1-12)

7. Click "Sign up"

**Expected Outcome:**

- ✅ Redirected to `/student` (Student Dashboard)

- ✅ User appears in PostgreSQL `users` table

- ✅ User profile shows in header/navigation

- ✅ No console errors

- ✅ Can access all three learning modules (S1, S2, S3)

**PostgreSQL Verification:**

```sql
SELECT id, email, name, role, grade, created_at
FROM users
WHERE email = 'newstudent@example.com';
-- Should return one row with role='student'
```

**Failure Scenarios:**

- ❌ If PostgreSQL connection fails: Returns error message, stays on signup page

- ❌ If email already exists: Shows "Email already registered" error

- ❌ If grade missing for student: Shows "Grade is required for students" error

- ❌ If password too short: Frontend validation prevents submission

---

### Test 1.2: New Parent Signup Flow

**Priority:** CRITICAL

**Path:** Frontend → FastAPI `/auth/signup` → PostgreSQL User Creation

**Steps:**

1. Navigate to `/signup`

2. Select "Parent" role

3. Enter any email (e.g., `newparent@example.com`)

4. Enter any password

5. Enter any name (e.g., `Test Parent`)

6. Click "Sign up"

**Expected Outcome:**

- ✅ Redirected to `/parent` (Parent Dashboard)

- ✅ User created in PostgreSQL with `role='parent'`

- ✅ Can view student management section

- ✅ Can link student accounts

**PostgreSQL Verification:**

```sql
SELECT id, email, name, role, grade, created_at
FROM users
WHERE email = 'newparent@example.com' AND role = 'parent';
-- Should return one row with role='parent', grade=NULL
```

**Failure Scenarios:**

- ❌ If email exists: Shows "Email already registered"

- ❌ If database error: Returns error response

---

### Test 1.3: Existing User Login Flow

**Priority:** CRITICAL

**Path:** Frontend → FastAPI `/auth/login` → PostgreSQL Credential Verification → Session

**Steps:**

1. Navigate to `/login`

2. Select role (Student or Parent)

3. Enter existing user credentials

4. Click "Log in"

**Expected Outcome:**

- ✅ Redirected to appropriate dashboard (`/student` or `/parent`)

- ✅ No "Loading..." stuck screen

- ✅ User profile loads correctly

- ✅ Previous activity visible (if any)

- ✅ No console errors

**PostgreSQL Verification:**

```sql
SELECT u.id, u.email, u.name, u.role, u.grade,
       COUNT(DISTINCT qa.id) as quiz_attempts,
       COUNT(DISTINCT stt.id) as sessions
FROM users u
LEFT JOIN quiz_attempts qa ON u.id = qa.student_id
LEFT JOIN session_time_tracking stt ON u.id = stt.student_id
WHERE u.email = 'existinguser@example.com'
GROUP BY u.id;
-- Should return user with activity counts
```

**Failure Scenarios:**

- ❌ If credentials invalid: Shows "Invalid email or role" or "Invalid password"

- ❌ If role mismatch: Shows "Invalid email or role"

- ❌ If database connection fails: Returns error, stays on login page

---

### Test 1.4: Parent-Student Account Linking

**Priority:** HIGH

**Path:** Parent Dashboard → Link Account → PostgreSQL Relationship Creation

**Steps:**

1. Parent logs in

2. Navigate to Parent Dashboard

3. Enter student email in "Link Account" section

4. Click "Link Account"

**Expected Outcome:**

- ✅ Student account linked to parent

- ✅ Relationship created in `parent_student_links` table

- ✅ Student appears in parent's student list

- ✅ Parent can view student progress

**PostgreSQL Verification:**

```sql
SELECT psl.id, p.email as parent_email, s.email as student_email, psl.created_at
FROM parent_student_links psl
JOIN users p ON psl.parent_id = p.id
JOIN users s ON psl.student_id = s.id
WHERE p.email = 'parent@example.com' AND s.email = 'student@example.com';
-- Should return linked relationship
```

**Failure Scenarios:**

- ❌ If student not found: Shows "Student not found" error

- ❌ If already linked: Shows "Account already linked" error

- ❌ If parent_id invalid: Returns error

---

## Test Suite 2: RAG Tutor Pipeline (MISSION CRITICAL)

### Test 2.1: Basic Tutor Question Response

**Priority:** CRITICAL

**Path:** User Question → FastAPI `/ask` → Embedding → Vector Search → Groq API → Response

**Steps:**

1. Log in as student

2. Navigate to `/student/s1` (Structured Practice)

3. Enter any math question (e.g., "How do I solve 2x + 5 = 13?")

4. Select grade level (e.g., 7)

5. Click "Ask" or submit

6. Wait for response (max 10 minutes)

**Expected Outcome:**

- ✅ User question appears immediately in chat/display

- ✅ AI shows "thinking" or loading indicator

- ✅ AI response appears within 10 minutes

- ✅ Response is relevant to question

- ✅ Response includes LaTeX formatting (e.g., `$2x = 8$` or `$$x = 4$$`)

- ✅ Response is grade-appropriate (simpler for lower grades)

- ✅ LaTeX renders correctly with KaTeX

**API Call Verification:**

```bash
# Check Network tab in DevTools
POST /ask
Request: { "question": "Solve 2x + 5 = 13", "grade": 7 }
Response: { "answer": "To solve $2x + 5 = 13$..." }
```

**PostgreSQL Verification (Vector Store):**

```sql
SELECT COUNT(*) as vector_count
FROM k12_content;
-- Should have embeddings if vector table populated

-- Check if query was processed
SELECT document, question
FROM k12_content
ORDER BY embedding <=> '[query_embedding_vector]'::vector
LIMIT 3;
-- Should return top 3 similar documents
```

**Failure Scenarios:**

- ❌ No GROQ_API_KEY: Returns error, check `backend/rag_groq_bot.py` line 17-23

- ❌ Vector table empty: Falls back to direct Groq call (no RAG context)

- ❌ Embedding model fails: Check `get_embed_model()` in `rag_groq_bot.py` line 39-46

- ❌ Groq API timeout: Response takes >10 minutes or fails

- ❌ LaTeX formatting broken: Check `format_latex()` in `main.py` lines 48-217

---

### Test 2.2: Grade-Appropriate Response Verification

**Priority:** HIGH

**Path:** Same Question → Different Grades → Different Response Complexity

**Test Cases:**

| Question | Grade | Expected Complexity |
|----------|-------|---------------------|
| "What is addition?" | 2 | Simple, visual, examples |
| "What is addition?" | 11 | More abstract, mathematical definition |

**Steps:**

1. Ask same question with grade 2

2. Note response complexity

3. Ask same question with grade 11

4. Compare responses

**Expected Outcome:**

- ✅ Lower grade response uses simpler language

- ✅ Higher grade response uses more technical terms

- ✅ Both responses are mathematically correct

- ✅ Grade hint included in prompt (check `get_grade_hint()`)

**PostgreSQL Verification:**

```sql
-- Check grade hint generation
-- Grade 2: "Provide a simple, visual explanation suitable for early elementary students."
-- Grade 11: "Provide a detailed explanation suitable for advanced learners."
```

---

### Test 2.3: Vector Database Population & Retrieval

**Priority:** HIGH

**Path:** Dataset → Embeddings → PostgreSQL Vector Store → Similarity Search

**Steps:**

1. Verify vector table has data

2. Send question that should match dataset content

3. Verify retrieved context is relevant

**Expected Outcome:**

- ✅ Vector table `k12_content` has embeddings

- ✅ Similarity search returns relevant documents

- ✅ Retrieved context improves answer quality

**PostgreSQL Verification:**

```sql
-- Check vector table population
SELECT COUNT(*) as total_embeddings
FROM k12_content;
-- Should be > 0 if data loaded

-- Check embedding dimension
SELECT id, document, 
       array_length(string_to_array(embedding::text, ','), 1) as dim
FROM k12_content
LIMIT 1;
-- Should show 384 dimensions (all-MiniLM-L6-v2)

-- Test similarity search
SELECT document, question,
       1 - (embedding <=> '[test_vector]'::vector) as similarity
FROM k12_content
ORDER BY embedding <=> '[test_vector]'::vector
LIMIT 3;
-- Should return top 3 most similar
```

**Setup Command (if vector table empty):**

```bash
cd application
source venv/bin/activate
python backend/setup_chroma.py  # For ChromaDB (local dev)
# OR populate PostgreSQL vector table via rag_groq_bot.py populate_vector_table()
```

**Failure Scenarios:**

- ❌ Vector table empty: RAG falls back to direct Groq (no context)

- ❌ pgvector extension not enabled: Check `CREATE EXTENSION vector;`

- ❌ Embedding dimension mismatch: Should be 384 for all-MiniLM-L6-v2

---

## Test Suite 3: Quiz Generation & Grading (MISSION CRITICAL)

### Test 3.1: Quiz Generation with Parameters

**Priority:** CRITICAL

**Path:** Frontend → FastAPI `/quiz/generate` → Groq API → Quiz Items → LaTeX Formatting

**Steps:**

1. Navigate to `/student/s3` (Quiz Generation)

2. Select topic (e.g., "Linear Equations")

3. Select grade (e.g., 7)

4. Select difficulty (easy/medium/hard)

5. Enter number of questions (e.g., 5)

6. Click "Generate Quiz"

7. Wait for generation (max 2 minutes)

**Expected Outcome:**

- ✅ Quiz generated within 2 minutes

- ✅ Returns exact number of questions requested

- ✅ Each question has:
  - `id` (unique identifier)
  - `question_md` (Markdown with LaTeX)
  - `choices` (A, B, C, D options)
  - `correct` (correct answer letter)
  - `explanation_md` (explanation with LaTeX)
  - `skill_tag` (topic/skill identifier)

- ✅ LaTeX properly formatted for KaTeX rendering

- ✅ Questions are grade-appropriate

- ✅ Difficulty affects question complexity

**API Call Verification:**

```bash
POST /quiz/generate
Request: {
  "topic": "Linear Equations",
  "grade": 7,
  "num_questions": 5,
  "difficulty": "medium"
}
Response: {
  "items": [
    {
      "id": "q1",
      "question_md": "Solve for $x$: $3x - 7 = 14$",
      "choices": {"A": "$x = 5$", "B": "$x = 7$", "C": "$x = 9$", "D": "$x = 11$"},
      "correct": "B",
      "explanation_md": "Add 7 to both sides: $3x = 21$, then divide by 3: $x = 7$",
      "skill_tag": "solving_linear_equations"
    },
    ...
  ],
  "meta": {
    "topic": "Linear Equations",
    "grade": 7,
    "difficulty": "medium"
  }
}
```

**Failure Scenarios:**

- ❌ No GROQ_API_KEY: Returns error in response, check `quiz_gen.py`

- ❌ Groq API timeout: Takes >2 minutes or fails

- ❌ Invalid parameters: Returns empty items array with error message

- ❌ LaTeX formatting broken: Questions don't render correctly

---

### Test 3.2: Quiz Grading - Perfect Score

**Priority:** CRITICAL

**Path:** Submit Answers → FastAPI `/quiz/grade` → Score Calculation → Results

**Steps:**

1. Generate quiz (5 questions)

2. Answer all questions correctly (select correct option for each)

3. Submit answers

**Expected Outcome:**

- ✅ Score calculated: `score = 5`, `total = 5`

- ✅ All results show `is_correct: true`

- ✅ Explanations displayed for each question

- ✅ Quiz attempt can be tracked (optional `student_id`)

**API Call Verification:**

```bash
POST /quiz/grade
Request: {
  "items": [
    {"id": "q1", "question_md": "...", "choices": {...}, "correct": "B", "explanation_md": "..."},
    ...
  ],
  "answers": [
    {"id": "q1", "selected": "B"},
    {"id": "q2", "selected": "A"},
    ...
  ],
  "student_id": "optional-student-id"
}
Response: {
  "score": 5,
  "total": 5,
  "results": [
    {
      "id": "q1",
      "is_correct": true,
      "selected": "B",
      "correct": "B",
      "explanation_md": "..."
    },
    ...
  ]
}
```

**PostgreSQL Verification (if tracked):**

```sql
SELECT student_id, quiz_topic, quiz_grade, quiz_difficulty,
       total_questions, correct_answers, score_percentage, completed_at
FROM quiz_attempts
WHERE student_id = 'student-id'
ORDER BY completed_at DESC
LIMIT 1;
-- Should show perfect score (correct_answers = total_questions)
```

**Failure Scenarios:**

- ❌ Answer ID mismatch: Question not graded (skipped in results)

- ❌ Missing items: Returns error or incomplete results

- ❌ Score calculation wrong: Check logic in `main.py` lines 324-359

---

### Test 3.3: Quiz Grading - Partial Score

**Priority:** HIGH

**Path:** Submit Mixed Answers → Score Calculation → Partial Results

**Steps:**

1. Generate quiz (5 questions)

2. Answer some correctly, some incorrectly

3. Submit answers

**Expected Outcome:**

- ✅ Score reflects correct count (e.g., `score = 3`, `total = 5`)

- ✅ Results show `is_correct: true/false` for each

- ✅ Explanations shown for all questions (correct and incorrect)

- ✅ User can see which answers were wrong

**Test Cases:**

| Correct Answers | Expected Score | Expected Results |
|----------------|---------------|------------------|
| 0/5 | 0 | All `is_correct: false` |
| 3/5 | 3 | 3 true, 2 false |
| 5/5 | 5 | All `is_correct: true` |

**PostgreSQL Verification:**

```sql
SELECT correct_answers, total_questions, score_percentage
FROM quiz_attempts
WHERE student_id = 'student-id'
ORDER BY completed_at DESC
LIMIT 5;
-- Should show various scores based on performance
```

---

### Test 3.4: Quiz Tracking & Persistence

**Priority:** HIGH

**Path:** Quiz Completion → FastAPI `/quiz/track` → PostgreSQL Storage

**Steps:**

1. Complete quiz (any score)

2. Submit with `student_id` included

3. Verify tracking API called

**Expected Outcome:**

- ✅ Quiz attempt stored in `quiz_attempts` table

- ✅ All metadata stored:
  - `student_id`
  - `quiz_topic`
  - `quiz_grade`
  - `quiz_difficulty`
  - `total_questions`
  - `correct_answers`
  - `score_percentage`
  - `quiz_items` (JSON)
  - `answers` (JSON)
  - `completed_at` (timestamp)

**API Call Verification:**

```bash
POST /quiz/track
Request: {
  "student_id": "student-id",
  "topic": "Linear Equations",
  "grade": 7,
  "difficulty": "medium",
  "total_questions": 5,
  "correct_answers": 4,
  "score_percentage": 80.0,
  "quiz_items": [...],
  "answers": [...]
}
Response: {
  "success": true,
  "attempt_id": "generated-id"
}
```

**PostgreSQL Verification:**

```sql
SELECT id, student_id, quiz_topic, quiz_grade, quiz_difficulty,
       total_questions, correct_answers, score_percentage,
       completed_at
FROM quiz_attempts
WHERE student_id = 'student-id'
ORDER BY completed_at DESC;
-- Should show all quiz attempts with full metadata
```

**Failure Scenarios:**

- ❌ Missing required fields: Returns error

- ❌ Invalid student_id: Foreign key constraint fails

- ❌ JSON serialization fails: Check quiz_items and answers format

---

## Test Suite 4: Time Tracking (IMPORTANT)

### Test 4.1: Session Time Recording

**Priority:** HIGH

**Path:** Module Activity → FastAPI `/time/track` → PostgreSQL Session Storage

**Steps:**

1. Navigate to any module (S1, S2, or S3)

2. Spend time in module (e.g., 5 minutes)

3. Time tracking automatically records session

4. Verify session stored

**Expected Outcome:**

- ✅ Session recorded in `session_time_tracking` table

- ✅ Fields populated:
  - `student_id`
  - `module` (s1, s2, or s3)
  - `time_spent_seconds`
  - `session_date` (today's date)
  - `session_started_at` (timestamp)
  - `session_ended_at` (timestamp)

- ✅ Cumulative total updated in `total_time_tracking`

**API Call Verification:**

```bash
POST /time/track
Request: {
  "student_id": "student-id",
  "module": "s1",
  "time_spent_seconds": 300,
  "is_session": true,
  "session_started_at": "2025-01-27T10:00:00Z",
  "session_ended_at": "2025-01-27T10:05:00Z"
}
Response: {
  "success": true
}
```

**PostgreSQL Verification:**

```sql
-- Check individual sessions
SELECT student_id, module, time_spent_seconds, session_date,
       session_started_at, session_ended_at
FROM session_time_tracking
WHERE student_id = 'student-id'
ORDER BY session_ended_at DESC
LIMIT 10;
-- Should show recent sessions

-- Check cumulative daily totals
SELECT student_id, module, total_time_seconds, session_date, last_updated
FROM total_time_tracking
WHERE student_id = 'student-id' AND session_date = CURRENT_DATE;
-- Should show today's cumulative time per module
```

**Failure Scenarios:**

- ❌ Invalid module: Returns "Invalid module. Only s1, s2, s3 are allowed"

- ❌ Missing required fields: Returns "Invalid payload"

- ❌ Time <= 0: Returns error

---

### Test 4.2: Cumulative Time Tracking

**Priority:** HIGH

**Path:** Multiple Sessions → Cumulative Total Update

**Steps:**

1. Have multiple sessions in same module on same day

2. Verify cumulative total increases

**Expected Outcome:**

- ✅ First session creates entry in `total_time_tracking`

- ✅ Subsequent sessions add to existing total

- ✅ `total_time_seconds` = sum of all session times for that day/module

- ✅ `last_updated` timestamp updates

**PostgreSQL Verification:**

```sql
-- Verify cumulative totals match session sums
SELECT 
    stt.student_id,
    stt.module,
    stt.session_date,
    SUM(stt.time_spent_seconds) as session_total,
    ttt.total_time_seconds as cumulative_total
FROM session_time_tracking stt
LEFT JOIN total_time_tracking ttt 
    ON stt.student_id = ttt.student_id 
    AND stt.module = ttt.module 
    AND stt.session_date = ttt.session_date
WHERE stt.student_id = 'student-id'
GROUP BY stt.student_id, stt.module, stt.session_date, ttt.total_time_seconds
HAVING SUM(stt.time_spent_seconds) != ttt.total_time_seconds;
-- Should return 0 rows (totals should match)
```

---

## Test Suite 5: Statistics & Analytics (IMPORTANT)

### Test 5.1: Student Statistics Retrieval

**Priority:** HIGH

**Path:** Frontend → FastAPI `/stats/student/:id` → PostgreSQL Aggregation → Response

**Steps:**

1. Log in as student with some activity

2. Navigate to dashboard or profile

3. View statistics

**Expected Outcome:**

- ✅ Statistics retrieved successfully

- ✅ Includes:
  - `total_quizzes` (count)
  - `avg_score` (average percentage)
  - `total_correct` (sum of correct answers)
  - `total_questions` (sum of all questions)
  - `accuracy` (percentage)
  - `s1_sessions` (count)
  - `s2_sessions` (count)
  - `today_total_time_seconds` (sum)
  - `today_quiz_count` (count)
  - `recent_quizzes` (array)
  - `recent_activities` (array)

**API Call Verification:**

```bash
GET /stats/student/{student_id}
Response: {
  "success": true,
  "stats": {
    "total_quizzes": 10,
    "avg_score": 75.5,
    "total_correct": 151,
    "total_questions": 200,
    "accuracy": 75.5,
    "s1_sessions": 5,
    "s2_sessions": 3,
    "today_total_time_seconds": 1800,
    "today_quiz_count": 2,
    "recent_quizzes": [...],
    "recent_activities": [...]
  }
}
```

**PostgreSQL Verification:**

```sql
-- Verify statistics calculations
SELECT 
    COUNT(DISTINCT qa.id) as total_quizzes,
    AVG(qa.score_percentage) as avg_score,
    SUM(qa.correct_answers) as total_correct,
    SUM(qa.total_questions) as total_questions,
    (SUM(qa.correct_answers)::float / NULLIF(SUM(qa.total_questions), 0) * 100) as accuracy
FROM quiz_attempts qa
WHERE qa.student_id = 'student-id';
-- Should match API response
```

**Failure Scenarios:**

- ❌ Invalid student_id: Returns error

- ❌ No data: Returns zeros/defaults (not error)

- ❌ Database query fails: Returns error response

---

### Test 5.2: Recent Activities Aggregation

**Priority:** MEDIUM

**Path:** Quiz Attempts + Sessions → Combined Activity Feed

**Steps:**

1. Student has both quiz attempts and session tracking

2. View recent activities

**Outcome:**

- ✅ `recent_activities` combines quizzes and sessions

- ✅ Sorted by date (most recent first)

- ✅ Limited to top 5 most recent

- ✅ Each activity has:
  - `type` ("quiz" or "session")
  - `module` (S1, S2, S3)
  - `title` (descriptive name)
  - `score` (for quizzes) or `time_spent` (for sessions)
  - `date` (timestamp)

**PostgreSQL Verification:**

```sql
-- Verify activity aggregation
SELECT 
    'quiz' as type,
    'S3' as module,
    quiz_topic || ' Quiz' as title,
    correct_answers || '/' || total_questions || ' (' || score_percentage || '%)' as score,
    completed_at as date
FROM quiz_attempts
WHERE student_id = 'student-id'

UNION ALL

SELECT 
    'session' as type,
    UPPER(module) as module,
    CASE module
        WHEN 's1' THEN 'Structured Problem-Solving Practice'
        WHEN 's2' THEN 'AI-Powered Solution Feedback'
        WHEN 's3' THEN 'Mathematical Quiz Generation'
    END as title,
    time_spent_seconds || 's' as time_spent,
    COALESCE(session_ended_at, created_at) as date
FROM session_time_tracking
WHERE student_id = 'student-id'

ORDER BY date DESC
LIMIT 5;
-- Should match recent_activities array
```

---

## Test Suite 6: Daily Goals Management (IMPORTANT)

### Test 6.1: Get Daily Goals

**Priority:** MEDIUM

**Path:** Frontend → FastAPI `/goals/student/:id` → PostgreSQL → Response

**Steps:**

1. Navigate to student dashboard

2. View daily goals section

**Expected Outcome:**

- ✅ Goals retrieved successfully

- ✅ Returns today's goals if set, otherwise most recent goals

- ✅ Defaults if no goals exist:
  - `target_time_seconds`: 1800 (30 minutes)
  - `target_quizzes`: 2

**API Call Verification:**

```bash
GET /goals/student/{student_id}
Response: {
  "success": true,
  "goals": {
    "target_time_seconds": 1800,
    "target_quizzes": 2
  }
}
```

**PostgreSQL Verification:**

```sql
-- Check today's goal
SELECT target_time_seconds, target_quizzes, goal_date
FROM daily_goals
WHERE student_id = 'student-id' AND goal_date = CURRENT_DATE;

-- Check most recent goal if today's doesn't exist
SELECT target_time_seconds, target_quizzes, goal_date
FROM daily_goals
WHERE student_id = 'student-id'
ORDER BY goal_date DESC
LIMIT 1;
```

---

### Test 6.2: Set Daily Goals by Parent

**Priority:** HIGH

**Path:** Parent Dashboard → FastAPI `/goals/parent/:parent_id/student/:student_id` → PostgreSQL

**Steps:**

1. Parent logs in

2. Navigate to student management

3. Set goals for linked student

4. Enter target time (e.g., 2400 seconds = 40 minutes)

5. Enter target quizzes (e.g., 3)

6. Click "Set Goals"

**Expected Outcome:**

- ✅ Goals saved for today's date

- ✅ Parent-student relationship verified

- ✅ Goals persist (used as default if not updated)

**API Call Verification:**

```bash
POST /goals/parent/{parent_id}/student/{student_id}
Request: {
  "target_time_seconds": 2400,
  "target_quizzes": 3
}
Response: {
  "success": true,
  "goals": {
    "target_time_seconds": 2400,
    "target_quizzes": 3
  }
}
```

**PostgreSQL Verification:**

```sql
-- Verify goal set with parent verification
SELECT dg.*, psl.parent_id
FROM daily_goals dg
JOIN parent_student_links psl ON dg.student_id = psl.student_id
WHERE dg.student_id = 'student-id' 
  AND psl.parent_id = 'parent-id'
  AND dg.goal_date = CURRENT_DATE;
-- Should return goal with parent link verified
```

**Failure Scenarios:**

- ❌ Student not linked: Returns "Student not linked to this parent"

- ❌ Invalid values: Returns error for negative values

- ❌ Parent ID mismatch: Returns error

---

## Test Suite 7: Error Handling & Edge Cases

### Test 7.1: Missing API Keys

**Priority:** CRITICAL

**Path:** Request → Missing GROQ_API_KEY → Error Response

**Steps:**

1. Remove or invalidate `GROQ_API_KEY` in `.env`

2. Restart backend

3. Try to ask tutor question

4. Try to generate quiz

**Expected Outcome:**

- ✅ Returns graceful error (not 500 crash)

- ✅ Error message indicates missing API key

- ✅ Frontend shows user-friendly error

- ✅ Other endpoints still work (e.g., `/auth/login`)

**Error Response Example:**

```json
{
  "error": "Missing GROQ_API_KEY. Set it in your environment variables or .env file."
}
```

---

### Test 7.2: Database Connection Failure

**Priority:** CRITICAL

**Path:** Request → Database Unavailable → Error Handling

**Steps:**

1. Stop PostgreSQL or use invalid `DATABASE_URL`

2. Try various endpoints

**Expected Outcome:**

- ✅ Returns error response (not crash)

- ✅ Error message indicates database issue

- ✅ Health check endpoint still responds (if possible)

- ✅ Frontend handles error gracefully

**Error Response Example:**

```json
{
  "error": "Database connection failed: ...",
  "success": false
}
```

---

### Test 7.3: Invalid Request Payloads

**Priority:** HIGH

**Path:** Invalid JSON → Pydantic Validation → Error Response

**Test Cases:**

| Endpoint | Invalid Payload | Expected Error |
|----------|----------------|----------------|
| `/auth/signup` | Missing `grade` for student | "Grade is required for students" |
| `/ask` | Missing `question` | Pydantic validation error |
| `/quiz/generate` | `num_questions` = 0 | Should handle gracefully |
| `/time/track` | `module` = "invalid" | "Invalid module. Only s1, s2, s3 are allowed" |

**Expected Outcome:**

- ✅ Returns 422 or 400 status code

- ✅ Error message describes validation issue

- ✅ No database writes for invalid data

- ✅ Frontend can parse and display error

---

### Test 7.4: Concurrent Requests

**Priority:** MEDIUM

**Path:** Multiple Simultaneous Requests → Race Conditions

**Steps:**

1. Send multiple quiz generation requests simultaneously

2. Send multiple time tracking updates simultaneously

**Expected Outcome:**

- ✅ All requests processed (eventually)

- ✅ No data corruption

- ✅ Database constraints prevent duplicates where applicable

- ✅ Connection pool handles load

**Known Limitations:**

- No transaction locking for XP updates (if implemented)

- Last write wins for time tracking updates

---

## Test Suite 8: Performance & Scalability

### Test 8.1: RAG Response Time

**Priority:** MEDIUM

**Path:** Question → Full RAG Pipeline → Response

**Performance Budget:**

- Simple question: <30 seconds
- Complex question: <2 minutes
- Maximum timeout: 10 minutes

**Steps:**

1. Ask simple question (e.g., "What is 2+2?")

2. Measure response time

3. Ask complex question (e.g., "Explain calculus")

4. Measure response time

**Expected Outcome:**

- ✅ Simple questions respond quickly

- ✅ Complex questions may take longer but within budget

- ✅ Vector search completes in <5 seconds

- ✅ Groq API call completes in reasonable time

**Performance Monitoring:**

```bash
# Check response times in Network tab
POST /ask
# Note: Time to First Byte (TTFB) and Total Time
```

---

### Test 8.2: Quiz Generation Performance

**Priority:** MEDIUM

**Path:** Generate Request → Groq API → Response

**Performance Budget:**

- 5 questions: <1 minute
- 10 questions: <2 minutes

**Steps:**

1. Generate quiz with 5 questions

2. Measure time

3. Generate quiz with 10 questions

4. Measure time

**Expected Outcome:**

- ✅ Within performance budget

- ✅ Time scales roughly linearly with question count

- ✅ No timeout errors for reasonable question counts

---

### Test 8.3: Database Query Performance

**Priority:** MEDIUM

**Path:** Statistics Request → Complex Queries → Response

**Performance Budget:**

- Statistics query: <2 seconds
- Recent activities: <1 second

**Steps:**

1. Student with 100+ quiz attempts

2. Request statistics

3. Measure query time

**Expected Outcome:**

- ✅ Queries complete within budget

- ✅ Indexes used effectively

- ✅ No N+1 query problems

**PostgreSQL Index Verification:**

```sql
-- Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('quiz_attempts', 'session_time_tracking', 'users');

-- Should have indexes on:
-- - quiz_attempts.student_id
-- - session_time_tracking.student_id
-- - users.email (unique)
```

---

## Critical Failure Indicators

**⚠️ System is DEGRADED if:**

1. RAG responses take >5 minutes (should be 30s-2min normally)

2. Quiz generation takes >2 minutes

3. Database queries take >5 seconds

4. Vector search returns no results (empty vector table)
# Safety & Privacy Report

This document reports on the current safety and privacy implementation in the EduMate platform, including Personally Identifiable Information (PII) handling, rate limiting, and abuse/jailbreak mitigations.

## Table of Contents

1. [Overview](#overview)
2. [Personally Identifiable Information (PII) Handling](#personally-identifiable-information-pii-handling)
3. [Rate Limiting](#rate-limiting)
4. [Abuse and Jailbreak Mitigations](#abuse-and-jailbreak-mitigations)
5. [Current Security Measures](#current-security-measures)
6. [Data Storage and Transmission](#data-storage-and-transmission)
7. [Access Control](#access-control)
8. [Current Limitations](#current-limitations)

---

## Overview

EduMate currently implements safety and privacy measures through:
- **Password Hashing**: SHA-256 hashing for stored passwords
- **Parameterized Queries**: SQL injection prevention
- **Input Validation**: Pydantic models and role-based checks
- **CORS Configuration**: Cross-origin request handling
- **Data Minimization**: Password exclusion from API responses

The current implementation focuses on:
- Basic authentication security
- Database query safety
- Input validation
- User data protection

---

## Personally Identifiable Information (PII) Handling

### PII Data Collected

**User Account Information:**
- Email addresses (stored in `users.email`)
- Names (stored in `users.name`)
- Passwords (hashed, stored in `users.password_hash`)
- Grade levels (stored in `users.grade`)
- User IDs (generated, stored in `users.id`)

**Activity Data:**
- Quiz attempts (linked to `student_id`)
- Session time tracking (linked to `student_id`)
- Practice questions (stored in `s1_sessions.question`)
- Solution feedback (stored in `s2_sessions.student_solution`)
- Daily goals (linked to `student_id`)

**Relationship Data:**
- Parent-student links (stored in `parent_student_links`)

### Password Storage

**Current Implementation:**
**Location:** `application/backend/database.py` lines 219-225

**Hashing Method:**
```python
def hash_password(password: str) -> str:
    """Hash password using SHA256 (upgrade to bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash
```

**Current Status:**
- Passwords hashed using SHA-256
- Hash stored in `users.password_hash` column
- Plain text passwords never stored
- Comment in code indicates upgrade to bcrypt recommended for production

**Security Considerations:**
- SHA-256 is not a password hashing algorithm (designed for fast hashing)
- No salt applied to passwords
- Vulnerable to rainbow table attacks
- No key derivation function (PBKDF2, Argon2, etc.)

### PII in API Responses

**Current Implementation:**
**Location:** `application/backend/main.py` lines 407-420, 448-457

**Signup Response:**
```python
# Return user (without password)
cursor.execute("SELECT id, email, name, role, grade FROM users WHERE id = %s", (user_id,))
user = cursor.fetchone()

return {
    "success": True,
    "user": {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "grade": user["grade"]
    }
}
```

**Login Response:**
```python
return {
    "success": True,
    "user": {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "grade": user["grade"]
    }
}
```

**Current Status:**
- Password hashes excluded from API responses
- Email addresses included in responses
- Names included in responses
- Grade levels included in responses
- User IDs included in responses

### PII in Frontend Storage

**Current Implementation:**
**Location:** `application/store/app-context.tsx` lines 45-86

**LocalStorage Usage:**
```typescript
// Load user from localStorage
const savedUser = localStorage.getItem("edumate_user")
if (savedUser) {
  setUser(JSON.parse(savedUser))
}

// Save user to localStorage
setUser(user)
localStorage.setItem("edumate_user", JSON.stringify(user))
```

**Data Stored:**
- User ID
- Email address
- Name
- Role
- Grade level

**Current Status:**
- User data stored in browser localStorage
- Persists across browser sessions
- Accessible via JavaScript
- Not encrypted in storage

### PII in Database

**Current Schema:**
**Location:** `application/backend/database.py` lines 83-95

**Users Table:**
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

**Current Status:**
- Email addresses stored as plain text
- Names stored as plain text
- Passwords stored as SHA-256 hashes
- Grade levels stored as integers
- Timestamps stored for account creation

**Database Security:**
- PostgreSQL with Supabase (encrypted at rest)
- SSL connections required
- Connection pooling for performance
- Foreign key constraints for data integrity

### Activity Data and PII

**Quiz Attempts:**
- Linked to `student_id` (not email)
- Contains quiz content and answers
- Timestamped with `completed_at`

**Session Tracking:**
- Linked to `student_id` (not email)
- Contains time spent and module information
- Timestamped with `session_date`, `session_started_at`, `session_ended_at`

**Practice Sessions:**
- Linked to `student_id` (not email)
- Contains question text
- Timestamped with `completed_at`

**Current Status:**
- Activity data linked via user IDs (not direct PII)
- Requires database join to connect to email/name
- Timestamps enable activity tracking over time

---

## Rate Limiting

### Current Rate Limiting Implementation

**Status:** No explicit rate limiting implemented

**API Endpoints:**
- No rate limiting on `/auth/signup`
- No rate limiting on `/auth/login`
- No rate limiting on `/ask` (RAG tutor)
- No rate limiting on `/quiz/generate`
- No rate limiting on `/quiz/grade`
- No rate limiting on `/time/track`
- No rate limiting on `/stats/student/:id`

**Current Protection:**
- None (all endpoints are publicly accessible without rate limits)

### External API Rate Limits

**Groq API:**
**Location:** `application/backend/rag_groq_bot.py`, `application/backend/quiz_gen.py`

**Current Status:**
- Rate limits enforced by Groq API (not documented in code)
- No client-side rate limiting or queuing
- No retry logic with exponential backoff
- No rate limit error handling

**Documentation Reference:**
- Rate limits mentioned in `data-connectors-model-settings.md` as "Check Groq documentation"
- No specific limits documented in codebase

### Database Connection Limits

**Current Implementation:**
**Location:** `application/backend/database.py` lines 26-50

**Connection Pool:**
```python
_pool = SimpleConnectionPool(
    minconn=1,      # Minimum connections
    maxconn=10,     # Maximum connections
    dsn=DATABASE_URL
)
```

**Current Status:**
- Maximum 10 concurrent database connections
- Connection pool exhaustion possible under high load
- No explicit rate limiting per user/IP
- Connection timeout: 10 seconds

### CORS Configuration

**Current Implementation:**
**Location:** `application/backend/main.py` lines 38-45

**CORS Settings:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # Allow all origins
    allow_credentials=False,      # Must be False when using allow_origins=["*"]
    allow_methods=["*"],          # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],          # Allow all headers
)
```

**Current Status:**
- Allows all origins (`*`)
- Allows all HTTP methods
- Allows all headers
- Credentials disabled (required when using `*` origins)
- Comment in code: "tighten in prod"

**Security Considerations:**
- Permissive CORS allows any website to make requests
- No origin validation
- No method restrictions
- No header restrictions

---

## Abuse and Jailbreak Mitigations

### Input Validation

**Current Implementation:**
**Location:** `application/backend/main.py` (various endpoints)

**Pydantic Models:**
```python
class SignupPayload(BaseModel):
    email: str
    password: str
    name: str
    role: str
    grade: Optional[int] = None
    parent_email: Optional[str] = None

class LoginPayload(BaseModel):
    email: str
    password: str
    role: str
```

**Validation Checks:**
- Email uniqueness check (`/auth/signup`)
- Role validation (must be 'student' or 'parent')
- Grade requirement for students
- Module validation (must be 's1', 's2', or 's3')
- Grade range validation (1-12 for students)
- Non-negative goal validation

**Current Status:**
- Basic type validation via Pydantic
- Business logic validation in endpoints
- No input length limits
- No content filtering
- No sanitization of user input

### SQL Injection Prevention

**Current Implementation:**
**Location:** `application/backend/main.py`, `application/backend/database.py`

**Parameterized Queries:**
```python
cursor.execute("SELECT id FROM users WHERE email = %s", (payload.email,))
cursor.execute("""
    INSERT INTO users (id, email, password_hash, name, role, grade, parent_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
""", (user_id, payload.email, password_hash, payload.name, payload.role, payload.grade, parent_id))
```

**Current Status:**
- All database queries use parameterized statements
- User input never directly concatenated into SQL
- `psycopg2` parameterization prevents SQL injection
- Consistent pattern across all endpoints

### Prompt Injection Protection

**Current Implementation:**
**Location:** `application/backend/rag_groq_bot.py` lines 250-261

**RAG Tutor Prompt:**
```python
response = client.chat.completions.create(
    model=GROQ_MODEL,
    messages=[
        {"role": "system", "content": f"You are a helpful K-12 tutor. {grade_hint}"},
        {"role": "user", "content": question + "\n\nContext: " + context}
    ],
    max_tokens=3000
)
```

**Quiz Generation Prompt:**
**Location:** `application/backend/quiz_gen.py` lines 232-272

**Current Status:**
- User questions passed directly to LLM
- No prompt injection detection
- No content filtering
- No instruction following prevention
- Context from vector database included (may contain user-generated content)

**Potential Vulnerabilities:**
- Users could inject instructions in questions
- Users could attempt to override system prompts
- No validation of question content
- No filtering of malicious prompts

### Content Filtering

**Current Status:**
- No content filtering implemented
- No profanity filtering
- No inappropriate content detection
- No moderation of user-generated content
- Questions and solutions stored as-is

### Authentication Abuse Prevention

**Current Implementation:**
**Location:** `application/backend/main.py` lines 363-463

**Signup Protection:**
- Email uniqueness check prevents duplicate accounts
- No email verification required
- No CAPTCHA or bot detection
- No account creation rate limiting

**Login Protection:**
- Password verification via hash comparison
- Generic error messages ("Invalid email or role", "Invalid password")
- No account lockout after failed attempts
- No brute force protection
- No login rate limiting

**Current Status:**
- Basic authentication checks
- No brute force mitigation
- No account lockout
- No suspicious activity detection

### API Abuse Prevention

**Current Status:**
- No rate limiting per user/IP
- No request throttling
- No abuse detection
- No automated bot detection
- No DDoS protection
- All endpoints publicly accessible

### Data Access Abuse Prevention

**Current Implementation:**
**Location:** `application/backend/main.py` lines 666-870, 992-1061

**Parent-Student Access Control:**
```python
# Verify parent-student link
cursor.execute("""
    SELECT id FROM parent_student_links 
    WHERE parent_id = %s AND student_id = %s
""", (parent_id, student_id))
link = cursor.fetchone()
if not link:
    return {"error": "Student not linked to this parent", "success": False}
```

**Current Status:**
- Parent-student relationship verification
- Role-based access checks
- No user ID validation (assumes valid IDs)
- No request origin validation
- No session-based authentication

---

## Current Security Measures

### Password Security

**Hashing:**
- SHA-256 hashing (not recommended for passwords)
- No salt applied
- No key derivation function

**Storage:**
- Hashes stored in database
- Never returned in API responses
- Verified via hash comparison

### Database Security

**Connection Security:**
- SSL required for Supabase connections
- Connection pooling (1-10 connections)
- Parameterized queries (SQL injection prevention)
- Transaction rollback on errors

**Data Protection:**
- Encrypted at rest (Supabase)
- Foreign key constraints
- Unique constraints on email
- Check constraints on roles and modules

### API Security

**Input Validation:**
- Pydantic models for type checking
- Business logic validation
- Parameterized database queries

**Response Security:**
- Passwords excluded from responses
- Error messages don't leak sensitive information
- Generic error messages for authentication failures

**CORS:**
- Permissive configuration (allows all origins)
- Credentials disabled
- All methods and headers allowed

### Frontend Security

**LocalStorage:**
- User data stored in browser localStorage
- Not encrypted
- Accessible via JavaScript
- Persists across sessions

**API Communication:**
- HTTP/HTTPS (depends on deployment)
- No explicit authentication tokens
- User data sent in request payloads

---

## Data Storage and Transmission

### Data Storage

**Database:**
- PostgreSQL (Supabase)
- Encrypted at rest
- SSL connections
- Connection pooling

**Frontend:**
- Browser localStorage
- Not encrypted
- Accessible via JavaScript

### Data Transmission

**API Requests:**
- HTTP/HTTPS (depends on deployment)
- JSON payloads
- No encryption of request bodies
- CORS allows all origins

**External API Calls:**
- Groq API (HTTPS)
- API key in environment variable
- No request encryption beyond HTTPS

### Data Retention

**Current Status:**
- No explicit data retention policy
- No data deletion mechanisms
- All data stored indefinitely
- No user data export functionality
- No account deletion endpoint

---

## Access Control

### Authentication

**Current Implementation:**
- Email and password authentication
- Role-based access (student/parent)
- No session management
- No JWT tokens
- No refresh tokens

**Authentication Flow:**
1. User submits email, password, role
2. Backend verifies credentials
3. Returns user data (without password)
4. Frontend stores user in localStorage
5. No token-based authentication

### Authorization

**Role-Based Access:**
- Students can access student dashboard
- Parents can access parent dashboard
- Parent-student links verified for data access
- No fine-grained permissions

**Data Access:**
- Students can view their own data
- Parents can view linked student data
- No cross-student data access
- Relationship verification required

**Current Status:**
- Basic role-based access control
- Parent-student relationship checks
- No token-based authorization
- No permission system

---

## Current Limitations

### Security Limitations

**Password Security:**
- SHA-256 not suitable for password hashing
- No salt applied
- Vulnerable to rainbow table attacks
- Comment in code recommends bcrypt upgrade

**Rate Limiting:**
- No rate limiting implemented
- Vulnerable to brute force attacks
- Vulnerable to DDoS
- No abuse detection

**Authentication:**
- No account lockout
- No brute force protection
- No suspicious activity detection
- No session management

**Input Validation:**
- No content filtering
- No prompt injection protection
- No input length limits
- No sanitization

**CORS:**
- Permissive configuration (allows all origins)
- Comment indicates need to tighten in production
- No origin validation

### Privacy Limitations

**PII Handling:**
- Email addresses stored as plain text
- Names stored as plain text
- User data in localStorage (not encrypted)
- No data minimization beyond password exclusion

**Data Retention:**
- No data retention policy
- No data deletion mechanisms
- All data stored indefinitely

**Data Export:**
- No user data export functionality
- No GDPR compliance features
- No data portability

### Abuse Prevention Limitations

**Prompt Injection:**
- No prompt injection detection
- User questions passed directly to LLM
- No content filtering
- No instruction following prevention

**API Abuse:**
- No rate limiting
- No request throttling
- No abuse detection
- No bot detection

**Content Moderation:**
- No content filtering
- No profanity detection
- No inappropriate content detection
- No moderation system

---

## Security Recommendations (Noted in Code)

### Code Comments Indicating Security Concerns

**Password Hashing:**
```python
"""Hash password using SHA256 (upgrade to bcrypt in production)"""
```
**Location:** `application/backend/database.py` line 220

**CORS Configuration:**
```python
# === CORS (allow your React dev server; tighten in prod) ===
allow_origins=["*"],          # Allow all origins
```
**Location:** `application/backend/main.py` lines 38-41

**Current Status:**
- Comments indicate awareness of security limitations
- Recommendations noted but not implemented
- Production readiness concerns documented

---

## Current Security Posture Summary

### Implemented Security Measures

✅ **SQL Injection Prevention:**
- Parameterized queries throughout
- No direct string concatenation in SQL

✅ **Password Hashing:**
- Passwords hashed (SHA-256)
- Never returned in API responses

✅ **Input Validation:**
- Pydantic models for type checking
- Business logic validation
- Role and module validation

✅ **Access Control:**
- Role-based access
- Parent-student relationship verification

✅ **Database Security:**
- SSL connections
- Encrypted at rest (Supabase)
- Connection pooling
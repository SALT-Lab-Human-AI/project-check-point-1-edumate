# backend/main.py
from typing import List, Dict, Any, Optional

import re
import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.rag_groq_bot import ask_groq            # RAG tutor answer
from backend.quiz_gen import generate_quiz_items     # Quiz generator (new module)
from backend.database import init_db, get_db, hash_password, verify_password, generate_id
from datetime import datetime, date


app = FastAPI(title="K-12 RAG Tutor API")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    init_db()

# === CORS (allow your React dev server; tighten in prod) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # e.g. ["http://localhost:3000"] in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === LaTeX formatter for frontend KaTeX ===
def format_latex(answer: str) -> str:
    """
    Convert Groq-style LaTeX delimiters into KaTeX-friendly ones:
      \\[...\\]  -> $$...$$  (block)
      \\(...\\)  -> $...$    (inline)
      Standalone math expressions -> $...$ (inline)
      Handle complex expressions like \\begin{aligned}, \\boxed, etc.
    """
    if not answer:
        return answer
    
    # Step 0: Fix malformed LaTeX patterns with $ in wrong places (before any other processing)
    # Fix patterns like $\begin{aligned}...$\end${aligned}$ -> \begin{aligned}...\end{aligned}
    answer = re.sub(r'\$\\begin\{(\w+)\}([\s\S]*?)\$\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', answer)
    # Fix patterns like $\begin{aligned}...\end${aligned}$ -> \begin{aligned}...\end{aligned}
    answer = re.sub(r'\$\\begin\{(\w+)\}([\s\S]*?)\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', answer)
    # Fix patterns like \begin{aligned}$...$\end${aligned} -> \begin{aligned}...\end{aligned}
    answer = re.sub(r'\\begin\{(\w+)\}\$([\s\S]*?)\$\\end\$\{(\w+)\}', r'\\begin{\1}\2\\end{\3}', answer)
    # Fix patterns like $ \begin{aligned}...$\end${aligned}$ (with space)
    answer = re.sub(r'\$\s*\\begin\{(\w+)\}([\s\S]*?)\$\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', answer)
    # Fix patterns where $ appears inside the environment content: \begin{aligned}$content$\end{aligned}
    answer = re.sub(r'\\begin\{(\w+)\}\$([\s\S]*?)\$\\end\{(\w+)\}', r'\\begin{\1}\2\\end{\3}', answer)
    # Fix patterns like $\end${aligned} -> \end{aligned}
    answer = re.sub(r'\$\\end\$\{(\w+)\}', r'\\end{\1}', answer)
    # Fix patterns like $\begin${aligned} -> \begin{aligned}
    answer = re.sub(r'\$\\begin\$\{(\w+)\}', r'\\begin{\1}', answer)
    # Fix patterns where $ appears in the middle: \end${aligned} -> \end{aligned}
    answer = re.sub(r'\\end\$\{(\w+)\}', r'\\end{\1}', answer)
    answer = re.sub(r'\\begin\$\{(\w+)\}', r'\\begin{\1}', answer)
    # Fix patterns like $\end${cases} -> \end{cases}
    answer = re.sub(r'\$\$?\\end\$\{(\w+)\}', r'\\end{\1}', answer)
    answer = re.sub(r'\$\$?\\begin\$\{(\w+)\}', r'\\begin{\1}', answer)
    # Remove stray $ signs that appear before or after \begin/\end
    answer = re.sub(r'\$\\begin\{(\w+)\}', r'\\begin{\1}', answer)
    answer = re.sub(r'\\end\{(\w+)\}\$', r'\\end{\1}', answer)
    
    # Fix incorrect line break syntax: || -> \\ in cases/aligned environments
    # First, fix || anywhere in the string that should be \\ for LaTeX line breaks
    # Replace all || with \\ (but be careful not to break existing \\)
    answer = re.sub(r'\|\|', r'\\\\', answer)
    # But we need to be careful - if there are already proper \\, we don't want \\\\\ 
    # So fix any triple+ backslashes back to double
    answer = re.sub(r'\\{3,}', r'\\\\', answer)
    
    # Step 1: Fix the most complex malformed patterns first
    # Pattern: $$\begin${aligned}$$ ... $$$\end${aligned}$
    answer = re.sub(r'\$\$\\begin\$\{([^}]+)\}\$\$([\s\S]*?)\$\$\$\\end\$\{([^}]+)\}\$', 
                   r'$$\\begin{\1}\2\\end{\3}$$', answer)
    
    # Pattern: $$\begin${aligned}$$ ... $$$\end${aligned}$
    answer = re.sub(r'\$\$\\begin\$\{([^}]+)\}\$\$([\s\S]*?)\$\$\$\\end\$\{([^}]+)\}\$\$', 
                   r'$$\\begin{\1}\2\\end{\3}$$', answer)
    
    # Step 2: Fix individual malformed begin/end tags
    answer = re.sub(r'\$\$\\begin\$\{([^}]+)\}\$\$', r'$$\\begin{\1}$$', answer)
    answer = re.sub(r'\$\$\\end\$\{([^}]+)\}\$\$', r'$$\\end{\1}$$', answer)
    answer = re.sub(r'\$\$\\end\$\{([^}]+)\}\$', r'$$\\end{\1}$$', answer)
    
    # Step 3: Fix malformed boxed expressions
    answer = re.sub(r'\$\\boxed\$\{([^}]+)\}\$\$\$', r'$$\\boxed{\1}$$', answer)
    answer = re.sub(r'\$\\boxed\$\{([^}]+)\}\$\$', r'$$\\boxed{\1}$$', answer)
    
    # Step 4: Fix malformed fractions and other expressions
    # Pattern: $\frac${1}{r_i}$
    answer = re.sub(r'\$\\frac\$\{([^}]+)\}\$\{([^}]+)\}\$', r'$\\frac{\1}{\2}$', answer)
    
    # Pattern: $\frac${s_{3}$$}{s_{4}}
    answer = re.sub(r'\$\\frac\$\{([^}]+)\$\$\}\$\{([^}]+)\}', r'$\\frac{\1}{\2}$', answer)
    
    # Pattern: $\frac${-r}${s}$
    answer = re.sub(r'\$\\frac\$\{([^}]+)\}\$\{([^}]+)\}\$', r'$\\frac{\1}{\2}$', answer)
    
    # Step 5: Handle standard LaTeX patterns
    # Handle block math environments
    answer = re.sub(r"\\\[([\s\S]*?)\\\]", r"$$\1$$", answer)
    
    # Handle \begin{aligned}...\end{aligned} blocks
    # First, handle properly formatted ones (after Step 0 fixes malformed patterns)
    answer = re.sub(r"\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}", r"$$\\begin{aligned}\1\\end{aligned}$$", answer)
    
    # Handle \begin{array}...\end{array} blocks
    answer = re.sub(r"\\begin\{array\}([\s\S]*?)\\end\{array\}", r"$$\\begin{array}\1\\end{array}$$", answer)
    
    # Handle \begin{cases}...\end{cases} blocks
    answer = re.sub(r"\\begin\{cases\}([\s\S]*?)\\end\{cases\}", r"$$\\begin{cases}\1\\end{cases}$$", answer)
    
    # Handle \begin{matrix}...\end{matrix} blocks
    answer = re.sub(r"\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}", r"$$\\begin{matrix}\1\\end{matrix}$$", answer)
    
    # Handle \begin{pmatrix}...\end{pmatrix} blocks
    answer = re.sub(r"\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}", r"$$\\begin{pmatrix}\1\\end{pmatrix}$$", answer)
    
    # Handle \begin{vmatrix}...\end{vmatrix} blocks
    answer = re.sub(r"\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}", r"$$\\begin{vmatrix}\1\\end{vmatrix}$$", answer)
    
    # Handle \begin{bmatrix}...\end{bmatrix} blocks
    answer = re.sub(r"\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}", r"$$\\begin{bmatrix}\1\\end{bmatrix}$$", answer)
    
    # Handle inline math
    answer = re.sub(r"\\\(([\s\S]*?)\\\)", r"$\1$", answer)
    
    # Handle \boxed{...} expressions - these should be block math
    answer = re.sub(r"\\boxed\{([^}]+)\}", r"$$\\boxed{\1}$$", answer)
    
    # Step 6: Handle standalone math expressions
    math_patterns = [
        r'\\frac\{[^}]+\}\{[^}]+\}',  # fractions
        r'\\sqrt\{[^}]+\}',           # square roots
        r'\\[a-zA-Z]+\{[^}]*\}',      # other LaTeX commands with braces
        r'\\[a-zA-Z]+',               # simple LaTeX commands
    ]
    
    for pattern in math_patterns:
        # Find standalone math expressions not already wrapped in $ or $$
        answer = re.sub(
            r'(?<!\$)(?<!\$\$)\\frac\{[^}]+\}\{[^}]+\}(?!\$)', 
            r'$\g<0>$', 
            answer
        )
        answer = re.sub(
            r'(?<!\$)(?<!\$\$)\\sqrt\{[^}]+\}(?!\$)', 
            r'$\g<0>$', 
            answer
        )
        answer = re.sub(
            r'(?<!\$)(?<!\$\$)\\[a-zA-Z]+\{[^}]*\}(?!\$)', 
            r'$\g<0>$', 
            answer
        )
        answer = re.sub(
            r'(?<!\$)(?<!\$\$)\\[a-zA-Z]+(?!\$)', 
            r'$\g<0>$', 
            answer
        )
    
    # Step 7: Clean up any double dollar signs that might have been created
    answer = re.sub(r'\$\$\$\$', '$$', answer)
    
    # Step 8: Fix escaped dollar signs in currency contexts (e.g., \$7 -> $7)
    # Only replace escaped dollar signs followed by numbers (currency), not math expressions
    # Pattern: \$ followed by a number (not a math expression)
    answer = re.sub(r'\\\$(\d+(?:,\d{3})*(?:\.\d{2})?)', r'$\1', answer)
    
    # Step 9: Ensure proper spacing around block math for better readability
    # Add line breaks before and after $$ blocks if not present (for questions)
    answer = re.sub(r'([^\n])(\$\$[^$]+\$\$)', r'\1\n\n\2', answer)
    answer = re.sub(r'(\$\$[^$]+\$\$)([^\n])', r'\1\n\n\2', answer)
    # Clean up triple newlines
    answer = re.sub(r'\n{3,}', '\n\n', answer)
    
    return answer


# === Health check ===
@app.get("/")
def health():
    return {"status": "API is running"}


# === Payload models ===
class AskPayload(BaseModel):
    question: str
    grade: int


class QuizGenPayload(BaseModel):
    topic: str
    grade: int
    num_questions: int = 5
    difficulty: str = "medium"


class QuizAnswer(BaseModel):
    id: str            # question id
    selected: str      # "A"/"B"/"C"/"D"


class QuizGradePayload(BaseModel):
    # Original items returned by /quiz/generate (they include 'correct' & 'explanation_md')
    items: List[Dict[str, Any]]
    # User selections
    answers: List[QuizAnswer]
    # Optional: student_id for tracking
    student_id: Optional[str] = None


# === Authentication Payloads ===
class SignupPayload(BaseModel):
    email: str
    password: str
    name: str
    role: str  # "student" or "parent"
    grade: Optional[int] = None  # Required for students
    parent_email: Optional[str] = None  # For linking student to parent


class LoginPayload(BaseModel):
    email: str
    password: str
    role: str  # "student" or "parent"


class LinkAccountPayload(BaseModel):
    parent_id: str
    student_email: str


class QuizTrackingPayload(BaseModel):
    student_id: str
    topic: str
    grade: int
    difficulty: str
    total_questions: int
    correct_answers: int
    score_percentage: float
    quiz_items: List[Dict[str, Any]]
    answers: List[Dict[str, Any]]


# === Tutor endpoint ===
@app.post("/ask")
async def ask_question(payload: AskPayload):
    raw_answer = ask_groq(payload.question, payload.grade)
    return {"answer": format_latex(raw_answer)}


# === Quiz generation endpoint ===
@app.post("/quiz/generate")
async def quiz_generate(payload: QuizGenPayload):
    try:
        data = generate_quiz_items(
            topic=payload.topic,
            grade=payload.grade,
            n=payload.num_questions,
            difficulty=payload.difficulty,
        )
        # Normalize LaTeX so the frontend renders nicely
        for it in data.get("items", []):
            it["question_md"] = format_latex(it.get("question_md", ""))
            it["explanation_md"] = format_latex(it.get("explanation_md", ""))
        return data
    except Exception as e:
        # Never 500 to the browser; return a graceful payload
        return {
            "items": [],
            "meta": {
                "topic": payload.topic,
                "grade": payload.grade,
                "difficulty": payload.difficulty,
            },
            "error": f"Quiz generation failed: {e}",
        }


# === Quiz grading endpoint ===
@app.post("/quiz/grade")
async def quiz_grade(payload: QuizGradePayload):
    try:
        # Calculate score
        correct = 0
        total = len(payload.answers)
        results = []
        
        for answer in payload.answers:
            # Find the corresponding item
            item = next((item for item in payload.items if item["id"] == answer.id), None)
            if not item:
                continue
                
            is_correct = answer.selected == item["correct"]
            if is_correct:
                correct += 1
                
            results.append({
                "id": answer.id,
                "is_correct": is_correct,
                "selected": answer.selected,
                "correct": item["correct"],
                "explanation_md": item.get("explanation_md", "")
            })
        
        return {
            "score": correct,
            "total": total,
            "results": results
        }
    except Exception as e:
        return {
            "score": 0,
            "total": 0,
            "results": [],
            "error": f"Quiz grading failed: {e}"
        }


# === Authentication endpoints ===
@app.post("/auth/signup")
async def signup(payload: SignupPayload):
    """Sign up a new user (student or parent)"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if email already exists
        cursor.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
        if cursor.fetchone():
            return {"error": "Email already registered", "success": False}
        
        # Validate student requirements
        if payload.role == "student" and not payload.grade:
            return {"error": "Grade is required for students", "success": False}
        
        # Create user
        user_id = generate_id()
        password_hash = hash_password(payload.password)
        
        # Link to parent if parent_email provided
        parent_id = None
        if payload.parent_email:
            cursor.execute("SELECT id FROM users WHERE email = ? AND role = 'parent'", (payload.parent_email,))
            parent = cursor.fetchone()
            if parent:
                parent_id = parent["id"]
        
        cursor.execute(
            """INSERT INTO users (id, email, password_hash, name, role, grade, parent_id)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, payload.email, password_hash, payload.name, payload.role, payload.grade, parent_id)
        )
        
        # Create parent-student link if parent_email provided
        if parent_id:
            link_id = generate_id()
            cursor.execute(
                "INSERT INTO parent_student_links (id, parent_id, student_id) VALUES (?, ?, ?)",
                (link_id, parent_id, user_id)
            )
        
        conn.commit()
        
        # Return user (without password)
        cursor.execute("SELECT id, email, name, role, grade FROM users WHERE id = ?", (user_id,))
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
    except Exception as e:
        conn.rollback()
        return {"error": str(e), "success": False}
    finally:
        conn.close()


@app.post("/auth/login")
async def login(payload: LoginPayload):
    """Login user"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "SELECT id, email, password_hash, name, role, grade FROM users WHERE email = ? AND role = ?",
            (payload.email, payload.role)
        )
        user = cursor.fetchone()
        
        if not user:
            return {"error": "Invalid email or role", "success": False}
        
        if not verify_password(payload.password, user["password_hash"]):
            return {"error": "Invalid password", "success": False}
        
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
    except Exception as e:
        return {"error": str(e), "success": False}
    finally:
        conn.close()


@app.post("/auth/link-account")
async def link_account(payload: LinkAccountPayload):
    """Link a student account to a parent account"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get student by email
        cursor.execute("SELECT id FROM users WHERE email = ? AND role = 'student'", (payload.student_email,))
        student = cursor.fetchone()
        
        if not student:
            return {"error": "Student not found", "success": False}
        
        student_id = student["id"]
        
        # Check if link already exists
        cursor.execute(
            "SELECT id FROM parent_student_links WHERE parent_id = ? AND student_id = ?",
            (payload.parent_id, student_id)
        )
        if cursor.fetchone():
            return {"error": "Account already linked", "success": False}
        
        # Create link
        link_id = generate_id()
        cursor.execute(
            "INSERT INTO parent_student_links (id, parent_id, student_id) VALUES (?, ?, ?)",
            (link_id, payload.parent_id, student_id)
        )
        
        # Update student's parent_id
        cursor.execute("UPDATE users SET parent_id = ? WHERE id = ?", (payload.parent_id, student_id))
        
        conn.commit()
        return {"success": True, "message": "Account linked successfully"}
    except Exception as e:
        conn.rollback()
        return {"error": str(e), "success": False}
    finally:
        conn.close()


@app.get("/auth/students/{parent_id}")
async def get_linked_students(parent_id: str):
    """Get all students linked to a parent"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT u.id, u.email, u.name, u.grade
            FROM users u
            INNER JOIN parent_student_links psl ON u.id = psl.student_id
            WHERE psl.parent_id = ?
        """, (parent_id,))
        
        students = [dict(row) for row in cursor.fetchall()]
        return {"success": True, "students": students}
    except Exception as e:
        return {"error": str(e), "success": False}
    finally:
        conn.close()


# === Quiz tracking endpoints ===
@app.post("/quiz/track")
async def track_quiz(payload: QuizTrackingPayload):
    """Track a quiz attempt"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        attempt_id = generate_id()
        cursor.execute("""
            INSERT INTO quiz_attempts 
            (id, student_id, quiz_topic, quiz_grade, quiz_difficulty, total_questions, 
             correct_answers, score_percentage, quiz_items, answers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            attempt_id,
            payload.student_id,
            payload.topic,
            payload.grade,
            payload.difficulty,
            payload.total_questions,
            payload.correct_answers,
            payload.score_percentage,
            json.dumps(payload.quiz_items),
            json.dumps(payload.answers)
        ))
        
        conn.commit()
        return {"success": True, "attempt_id": attempt_id}
    except Exception as e:
        conn.rollback()
        return {"error": str(e), "success": False}
    finally:
        conn.close()


@app.post("/time/track")
async def track_time(payload: dict):
    """Record time spent in a module - either as a session or cumulative total"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        student_id = payload.get("student_id")
        module = payload.get("module")
        time_spent_seconds = payload.get("time_spent_seconds", 0)
        is_session = payload.get("is_session", False)
        update_total_only = payload.get("update_total_only", False)
        session_started_at = payload.get("session_started_at")
        session_ended_at = payload.get("session_ended_at")
        
        if not student_id or not module or time_spent_seconds <= 0:
            return {"error": "Invalid payload", "success": False}
        
        if module not in ["s1", "s2", "s3"]:
            return {"error": "Invalid module. Only s1, s2, s3 are allowed", "success": False}
        
        # Get today's date
        today = date.today().isoformat()
        
        if is_session and session_started_at and session_ended_at:
            # Record individual session
            session_id = generate_id()
            cursor.execute("""
                INSERT INTO session_time_tracking 
                (id, student_id, module, time_spent_seconds, session_date, session_started_at, session_ended_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (session_id, student_id, module, time_spent_seconds, today, session_started_at, session_ended_at))
            
            # Also update cumulative total
            cursor.execute("""
                SELECT id, total_time_seconds 
                FROM total_time_tracking 
                WHERE student_id = ? AND module = ? AND session_date = ?
            """, (student_id, module, today))
            
            total_record = cursor.fetchone()
            if total_record:
                new_total = total_record["total_time_seconds"] + time_spent_seconds
                cursor.execute("""
                    UPDATE total_time_tracking 
                    SET total_time_seconds = ?, last_updated = datetime('now')
                    WHERE id = ?
                """, (new_total, total_record["id"]))
            else:
                total_id = generate_id()
                cursor.execute("""
                    INSERT INTO total_time_tracking 
                    (id, student_id, module, total_time_seconds, session_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (total_id, student_id, module, time_spent_seconds, today))
        
        elif update_total_only:
            # Only update cumulative total (periodic updates during session)
            cursor.execute("""
                SELECT id, total_time_seconds 
                FROM total_time_tracking 
                WHERE student_id = ? AND module = ? AND session_date = ?
            """, (student_id, module, today))
            
            total_record = cursor.fetchone()
            if total_record:
                new_total = total_record["total_time_seconds"] + time_spent_seconds
                cursor.execute("""
                    UPDATE total_time_tracking 
                    SET total_time_seconds = ?, last_updated = datetime('now')
                    WHERE id = ?
                """, (new_total, total_record["id"]))
            else:
                total_id = generate_id()
                cursor.execute("""
                    INSERT INTO total_time_tracking 
                    (id, student_id, module, total_time_seconds, session_date)
                    VALUES (?, ?, ?, ?, ?)
                """, (total_id, student_id, module, time_spent_seconds, today))
        else:
            return {"error": "Invalid request: must specify is_session or update_total_only", "success": False}
        
        conn.commit()
        return {"success": True}
    except Exception as e:
        conn.rollback()
        print(f"[Time Track Error] {e}")
        return {"error": str(e), "success": False}
    finally:
        conn.close()


@app.get("/stats/student/{student_id}")
async def get_student_stats(student_id: str):
    """Get statistics for a student"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Quiz statistics
        cursor.execute("""
            SELECT 
                COUNT(*) as total_quizzes,
                AVG(score_percentage) as avg_score,
                SUM(correct_answers) as total_correct,
                SUM(total_questions) as total_questions,
                MAX(completed_at) as last_quiz_date
            FROM quiz_attempts
            WHERE student_id = ?
        """, (student_id,))
        quiz_stats = dict(cursor.fetchone() or {})
        
        # S1 sessions count
        cursor.execute("SELECT COUNT(*) as count FROM s1_sessions WHERE student_id = ?", (student_id,))
        s1_count = cursor.fetchone()["count"] or 0
        
        # S2 sessions count
        cursor.execute("SELECT COUNT(*) as count FROM s2_sessions WHERE student_id = ?", (student_id,))
        s2_count = cursor.fetchone()["count"] or 0
        
        # Recent quiz attempts
        cursor.execute("""
            SELECT quiz_topic as topic, score_percentage, completed_at, total_questions, correct_answers
            FROM quiz_attempts
            WHERE student_id = ?
            ORDER BY completed_at DESC
            LIMIT 10
        """, (student_id,))
        recent_quizzes = [dict(row) for row in cursor.fetchall()]
        
        # Get recent session activities (individual sessions, not cumulative)
        # Get the most recent sessions across all modules (we'll combine with quizzes and limit to 5 total)
        # Use COALESCE to handle old records that might not have session_ended_at
        cursor.execute("""
            SELECT module, time_spent_seconds, session_date, 
                   COALESCE(session_ended_at, created_at) as session_ended_at, 
                   created_at
            FROM session_time_tracking
            WHERE student_id = ?
            ORDER BY COALESCE(session_ended_at, created_at) DESC
            LIMIT 20
        """, (student_id,))
        session_tracking = [dict(row) for row in cursor.fetchall()]
        
        # Format recent activities combining quizzes and session tracking
        recent_activities = []
        
        # Add quiz activities
        for quiz in recent_quizzes:
            recent_activities.append({
                "type": "quiz",
                "module": "S3",
                "title": f"{quiz['topic']} Quiz",
                "score": f"{quiz['correct_answers']}/{quiz['total_questions']} ({quiz['score_percentage']:.0f}%)",
                "date": quiz['completed_at'],
                "time_spent": None
            })
        
        # Add session tracking activities (individual sessions only)
        module_names = {
            "s1": "Structured Problem-Solving Practice",
            "s2": "AI-Powered Solution Feedback",
            "s3": "Mathematical Quiz Generation"
        }
        
        print(f"[Stats API] Processing {len(session_tracking)} sessions for student {student_id}")
        if len(session_tracking) == 0:
            print(f"[Stats API] WARNING: No sessions found for student {student_id}")
        
        for track in session_tracking:
            print(f"[Stats API] Raw session data: {track}")
            # Skip portal entries (shouldn't exist but just in case)
            module = track.get('module')
            if not module or module == 'portal':
                continue
                
            minutes = track['time_spent_seconds'] // 60
            seconds = track['time_spent_seconds'] % 60
            time_str = f"{minutes}m {seconds}s" if minutes > 0 else f"{seconds}s"
            
            # Use session_ended_at as the activity date (when session completed)
            # session_ended_at comes from COALESCE, so it should always have a value
            activity_date = str(track.get('session_ended_at') or track.get('created_at') or '')
            
            if not activity_date or activity_date == 'None' or activity_date == '':
                print(f"[Stats API] Skipping session with no date: {track}")
                continue
            
            activity_entry = {
                "type": "session",
                "module": module.upper(),
                "title": module_names.get(module, module),
                "score": None,
                "date": activity_date,
                "time_spent": time_str,
                "time_spent_seconds": track['time_spent_seconds']
            }
            
            print(f"[Stats API] Adding session activity: {activity_entry}")
            recent_activities.append(activity_entry)
        
        # Sort by date (most recent first) - handle both string and datetime objects
        def get_sort_key(activity):
            date_val = activity.get('date')
            if isinstance(date_val, str):
                try:
                    from datetime import datetime
                    # Handle ISO format with Z: "2025-11-07T00:11:55.640Z"
                    if 'T' in date_val and 'Z' in date_val:
                        # Remove milliseconds and Z, add timezone
                        date_val_clean = date_val.split('.')[0].replace('Z', '+00:00')
                        parsed = datetime.fromisoformat(date_val_clean)
                        return parsed
                    # Handle SQLite datetime format: "2025-11-06 23:24:19"
                    elif ' ' in date_val and 'T' not in date_val:
                        parsed = datetime.strptime(date_val, '%Y-%m-%d %H:%M:%S')
                        return parsed
                    else:
                        # Try generic ISO format
                        parsed = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                        return parsed
                except Exception as e:
                    print(f"[Stats API] Error parsing date '{date_val}': {e}")
                    # Return a far past date so it sorts to the end
                    return datetime(1970, 1, 1)
            return date_val if date_val else datetime(1970, 1, 1)
        
        try:
            recent_activities.sort(key=get_sort_key, reverse=True)
        except Exception as e:
            print(f"[Stats API] Error sorting: {e}")
            # Keep original order if sorting fails
            pass
        
        recent_activities = recent_activities[:5]  # Limit to top 5 most recent (latest first)
        
        # Debug output
        print(f"[Stats API] Returning {len(recent_activities)} activities:")
        for i, act in enumerate(recent_activities):
            print(f"  {i+1}. {act.get('type')} - {act.get('title')} - {act.get('time_spent')} - {act.get('date')}")
        
        # Ensure we always return recent_activities, even if empty
        if not recent_activities and recent_quizzes:
            # If no time tracking but we have quizzes, return quiz activities
            for quiz in recent_quizzes[:5]:
                recent_activities.append({
                    "type": "quiz",
                    "module": "S3",
                    "title": f"{quiz['topic']} Quiz",
                    "score": f"{quiz['correct_answers']}/{quiz['total_questions']} ({quiz['score_percentage']:.0f}%)",
                    "date": quiz['completed_at'],
                    "time_spent": None
                })
        
        return {
            "success": True,
            "stats": {
                "total_quizzes": quiz_stats.get("total_quizzes", 0) or 0,
                "avg_score": round(quiz_stats.get("avg_score", 0) or 0, 2),
                "total_correct": quiz_stats.get("total_correct", 0) or 0,
                "total_questions": quiz_stats.get("total_questions", 0) or 0,
                "accuracy": round((quiz_stats.get("total_correct", 0) or 0) / max(quiz_stats.get("total_questions", 1) or 1, 1) * 100, 2),
                "s1_sessions": s1_count,
                "s2_sessions": s2_count,
                "recent_quizzes": recent_quizzes,
                "recent_activities": recent_activities
            }
        }
    except Exception as e:
        return {"error": str(e), "success": False}
    finally:
        conn.close()

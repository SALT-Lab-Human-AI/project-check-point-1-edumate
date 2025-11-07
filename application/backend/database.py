"""
Database models and setup for EduMate
Uses SQLite for simplicity, can be upgraded to PostgreSQL later
"""
import sqlite3
import hashlib
import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
import json

DB_PATH = Path(__file__).parent.parent / "edumate.db"

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('student', 'parent')),
            grade INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            parent_id TEXT,
            FOREIGN KEY (parent_id) REFERENCES users(id)
        )
    """)
    
    # Parent-Student relationships table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS parent_student_links (
            id TEXT PRIMARY KEY,
            parent_id TEXT NOT NULL,
            student_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES users(id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            UNIQUE(parent_id, student_id)
        )
    """)
    
    # Quiz attempts table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            quiz_topic TEXT NOT NULL,
            quiz_grade INTEGER NOT NULL,
            quiz_difficulty TEXT NOT NULL,
            total_questions INTEGER NOT NULL,
            correct_answers INTEGER NOT NULL,
            score_percentage REAL NOT NULL,
            quiz_items TEXT NOT NULL,
            answers TEXT NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """)
    
    # S1 practice sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS s1_sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            topic TEXT NOT NULL,
            grade INTEGER NOT NULL,
            question TEXT NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """)
    
    # S2 feedback sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS s2_sessions (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            question TEXT NOT NULL,
            student_solution TEXT NOT NULL,
            is_correct BOOLEAN,
            feedback_mode TEXT NOT NULL,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """)
    
    # Session time tracking table - tracks individual sessions
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS session_time_tracking (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            module TEXT NOT NULL CHECK(module IN ('s1', 's2', 's3')),
            time_spent_seconds INTEGER NOT NULL,
            session_date DATE NOT NULL,
            session_started_at TIMESTAMP,
            session_ended_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id)
        )
    """)
    
    # Add new columns to existing table if they don't exist (migration)
    try:
        cursor.execute("ALTER TABLE session_time_tracking ADD COLUMN session_started_at TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    try:
        cursor.execute("ALTER TABLE session_time_tracking ADD COLUMN session_ended_at TIMESTAMP")
    except sqlite3.OperationalError:
        pass  # Column already exists
    
    # Total time tracking table - tracks cumulative daily totals per module
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS total_time_tracking (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            module TEXT NOT NULL CHECK(module IN ('s1', 's2', 's3')),
            total_time_seconds INTEGER NOT NULL DEFAULT 0,
            session_date DATE NOT NULL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            UNIQUE(student_id, module, session_date)
        )
    """)
    
    # Daily goals table - tracks daily targets for students
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS daily_goals (
            id TEXT PRIMARY KEY,
            student_id TEXT NOT NULL,
            target_time_seconds INTEGER NOT NULL DEFAULT 0,
            target_quizzes INTEGER NOT NULL DEFAULT 0,
            goal_date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES users(id),
            UNIQUE(student_id, goal_date)
        )
    """)
    
    conn.commit()
    conn.close()
    
    print("Database initialized successfully!")

def hash_password(password: str) -> str:
    """Hash password using SHA256 (upgrade to bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash

def generate_id() -> str:
    """Generate a unique ID"""
    return secrets.token_hex(16)


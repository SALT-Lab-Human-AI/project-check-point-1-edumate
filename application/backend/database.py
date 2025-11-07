"""
Database models and setup for EduMate
Uses Supabase PostgreSQL with pgvector for vector operations
"""
import os
import hashlib
import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from dotenv import load_dotenv

load_dotenv()

# Supabase PostgreSQL connection string
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required. Get it from your Supabase project settings.")

# Connection pool for better performance
_pool = None

def get_pool():
    """Get or create connection pool"""
    global _pool
    if _pool is None:
        _pool = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL
        )
    return _pool

def get_db():
    """Get database connection from pool with RealDictCursor for dict-like rows"""
    pool = get_pool()
    conn = pool.getconn()
    # Return connection that will use RealDictCursor
    return conn

def get_cursor(conn):
    """Get cursor with RealDictCursor for dict-like row access"""
    return conn.cursor(cursor_factory=RealDictCursor)

def return_db(conn):
    """Return connection to pool"""
    pool = get_pool()
    pool.putconn(conn)

def init_db():
    """Initialize database tables and extensions"""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Enable pgvector extension for vector operations
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL CHECK(role IN ('student', 'parent')),
                grade INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                parent_id VARCHAR(255),
                FOREIGN KEY (parent_id) REFERENCES users(id)
            )
        """)
        
        # Parent-Student relationships table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS parent_student_links (
                id VARCHAR(255) PRIMARY KEY,
                parent_id VARCHAR(255) NOT NULL,
                student_id VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES users(id),
                FOREIGN KEY (student_id) REFERENCES users(id),
                UNIQUE(parent_id, student_id)
            )
        """)
        
        # Quiz attempts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                quiz_topic VARCHAR(255) NOT NULL,
                quiz_grade INTEGER NOT NULL,
                quiz_difficulty VARCHAR(50) NOT NULL,
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
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                topic VARCHAR(255) NOT NULL,
                grade INTEGER NOT NULL,
                question TEXT NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id)
            )
        """)
        
        # S2 feedback sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS s2_sessions (
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                question TEXT NOT NULL,
                student_solution TEXT NOT NULL,
                is_correct BOOLEAN,
                feedback_mode VARCHAR(50) NOT NULL,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES users(id)
            )
        """)
        
        # Session time tracking table - tracks individual sessions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS session_time_tracking (
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                module VARCHAR(10) NOT NULL CHECK(module IN ('s1', 's2', 's3')),
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
            cursor.execute("ALTER TABLE session_time_tracking ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP")
        except Exception:
            pass  # Column already exists
        
        try:
            cursor.execute("ALTER TABLE session_time_tracking ADD COLUMN IF NOT EXISTS session_ended_at TIMESTAMP")
        except Exception:
            pass  # Column already exists
        
        # Total time tracking table - tracks cumulative daily totals per module
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS total_time_tracking (
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
                module VARCHAR(10) NOT NULL CHECK(module IN ('s1', 's2', 's3')),
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
                id VARCHAR(255) PRIMARY KEY,
                student_id VARCHAR(255) NOT NULL,
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
        print("Database initialized successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error initializing database: {e}")
        raise
    finally:
        return_db(conn)

def hash_password(password: str) -> str:
    """Hash password using SHA256 (upgrade to bcrypt in production)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    """Verify password against hash"""
    return hash_password(password) == password_hash

def generate_id() -> str:
    """Generate a unique ID"""
    return secrets.token_hex(16)

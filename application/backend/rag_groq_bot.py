# rag_groq_bot.py
import json
import uuid
import os
import threading
from tqdm import tqdm
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.extensions import register_adapter, AsIs
import numpy as np
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not GROQ_API_KEY:
    raise ValueError("❌ Missing GROQ_API_KEY. Set it in your environment variables or .env file.")
if not DATABASE_URL:
    raise ValueError("❌ Missing DATABASE_URL. Set it in your Supabase project settings.")

# === Configuration ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "test.jsonl")
COLLECTION_NAME = "k12_content"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_MODEL = "openai/gpt-oss-20b"
EMBEDDING_DIM = 384  # all-MiniLM-L6-v2 produces 384-dimensional embeddings

# === Initialize Groq client ===
client = Groq(api_key=GROQ_API_KEY)

# === Lazy loading for embedding model (to save memory) ===
_embed_model = None

def get_embed_model():
    """Lazy load embedding model only when needed to reduce memory usage"""
    global _embed_model
    if _embed_model is None:
        print("Loading embedding model...")
        _embed_model = SentenceTransformer(EMBED_MODEL_NAME)
        print("Embedding model loaded!")
    return _embed_model

# === Helper function to adapt numpy arrays for PostgreSQL ===
def adapt_array(arr):
    """Convert numpy array to PostgreSQL array format"""
    return AsIs("'" + str(arr.tolist()).replace("'", '"') + "'")

# Register adapter for numpy arrays (if needed)
try:
    register_adapter(np.ndarray, adapt_array)
except:
    pass

# === Initialize Vector Table ===
def init_vector_table():
    """Create the vector table if it doesn't exist"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Enable pgvector extension
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Create table for storing embeddings
        cursor.execute(f"""
            CREATE TABLE IF NOT EXISTS {COLLECTION_NAME} (
                id VARCHAR(255) PRIMARY KEY,
                document TEXT NOT NULL,
                question TEXT,
                embedding vector({EMBEDDING_DIM})
            )
        """)
        
        # Create index for similarity search
        cursor.execute(f"""
            CREATE INDEX IF NOT EXISTS {COLLECTION_NAME}_embedding_idx 
            ON {COLLECTION_NAME} 
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 100)
        """)
        
        conn.commit()
        print(f"Vector table '{COLLECTION_NAME}' initialized!")
    except Exception as e:
        conn.rollback()
        print(f"Error initializing vector table: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

# === Populate Vector Table ===
def populate_vector_table():
    """Populate the vector table with embeddings from the dataset"""
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    try:
        # Check if table already has data
        cursor.execute(f"SELECT COUNT(*) FROM {COLLECTION_NAME}")
        count = cursor.fetchone()[0]
        
        if count > 0:
            print(f"Vector table '{COLLECTION_NAME}' already has {count} documents. Skipping population.")
            return
        
        # Load dataset
        if not os.path.exists(DATASET_PATH):
            print(f"Dataset file not found: {DATASET_PATH}")
            return
        
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            data = [json.loads(line) for line in f]
        
        print(f"Total QA pairs found: {len(data)}")
        print(f"Populating vector table '{COLLECTION_NAME}'...")
        
        # Insert embeddings
        for entry in tqdm(data, desc="Adding QA pairs to Supabase Vector"):
            text = entry.get("question", "") + " " + entry.get("answer", "")
            question = entry.get("question", "")
            
            if not text.strip():
                continue
            
            # Generate embedding (lazy load model if needed)
            embedding = get_embed_model().encode(text).tolist()
            
            # Insert into database
            # Convert embedding list to PostgreSQL vector format: '[0.1,0.2,...]'
            embedding_str = '[' + ','.join(map(str, embedding)) + ']'
            doc_id = str(uuid.uuid4())
            cursor.execute(
                f"""
                INSERT INTO {COLLECTION_NAME} (id, document, question, embedding)
                VALUES (%s, %s, %s, %s::vector)
                """,
                (doc_id, text, question, embedding_str)
            )
        
        conn.commit()
        print(f"Vector table '{COLLECTION_NAME}' populated with {len(data)} documents!")
    except Exception as e:
        conn.rollback()
        print(f"Error populating vector table: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

# === Initialize on import (but don't load model yet) ===
# Note: Vector table initialization happens on first request to avoid memory issues
# The model will be loaded lazily when first needed

# === Grade-based hint function ===
def get_grade_hint(grade) -> str:
    try:
        grade = int(grade)
    except ValueError:
        grade = 5

    if grade <= 2:
        return "Provide a very simple explanation suitable for young children."
    elif grade <= 5:
        return "Explain with simple examples and easy-to-understand language."
    elif grade <= 8:
        return "Use clear examples and some intermediate-level explanations."
    elif grade <= 12:
        return "Provide detailed explanation suitable for high school students."
    else:
        return "Provide a detailed explanation suitable for advanced learners."

# === RAG Query Function ===
def ask_groq(question: str, grade=5) -> str:
    """
    Ask a question to Groq with RAG context from Supabase Vector.
    Returns the complete answer (no token limit) and supports complex formulas.
    """
    try:
        context = "No additional context available."
        
        # Try to get RAG context from vector database (if available)
        try:
            # Check if vector table has data (quick check)
            conn_check = psycopg2.connect(DATABASE_URL)
            cursor_check = conn_check.cursor()
            try:
                cursor_check.execute(f"SELECT COUNT(*) FROM {COLLECTION_NAME}")
                count = cursor_check.fetchone()[0]
            finally:
                cursor_check.close()
                conn_check.close()
            
            # Only try to use RAG if we have data in the vector table
            if count > 0:
                # Generate query embedding (lazy load model if needed)
                query_embed = get_embed_model().encode(question).tolist()
                
                # Connect to database and perform similarity search
                conn = psycopg2.connect(DATABASE_URL)
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                try:
                    # Use cosine similarity to find top 3 most similar documents
                    # Convert query embedding to PostgreSQL vector format
                    query_embed_str = '[' + ','.join(map(str, query_embed)) + ']'
                    cursor.execute(
                        f"""
                        SELECT document, question
                        FROM {COLLECTION_NAME}
                        ORDER BY embedding <=> %s::vector
                        LIMIT 3
                        """,
                        (query_embed_str,)
                    )
                    
                    results = cursor.fetchall()
                    
                    if results:
                        # Combine documents for context
                        context_parts = [row['document'] for row in results]
                        context = " ".join(context_parts)
                finally:
                    cursor.close()
                    conn.close()
            else:
                # Vector table is empty - try to populate it in background (non-blocking)
                # But don't wait for it - just proceed without RAG context
                print(f"Vector table is empty. Will populate in background.")
                try:
                    # Try to populate, but don't block if it fails
                    def populate_async():
                        try:
                            populate_vector_table()
                        except Exception as e:
                            print(f"Background population failed: {e}")
                    thread = threading.Thread(target=populate_async, daemon=True)
                    thread.start()
                except Exception as e:
                    print(f"Could not start background population: {e}")
        except Exception as e:
            print(f"Warning: Could not access vector database: {e}")
            # Continue without RAG context - will still work with Groq

        # Grade-based hint
        grade_hint = get_grade_hint(grade)

        # Request full answer (increase max_tokens)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": f"You are a helpful K-12 tutor. {grade_hint}"},
                {"role": "user", "content": question + "\n\nContext: " + context}
            ],
            max_tokens=3000  # remove limit, allows full response
        )

        if hasattr(response, "choices") and len(response.choices) > 0:
            return response.choices[0].message.content
        else:
            return "Sorry, I couldn't generate an answer."

    except Exception as e:
        return f"Error occurred: {e}"

# === Export collection for quiz_gen.py ===
# Create a mock collection-like object for compatibility
class VectorCollection:
    """Mock collection interface for compatibility with quiz_gen.py"""
    
    def query(self, query_embeddings, n_results=3):
        """Query the vector database and return results in ChromaDB-like format"""
        try:
            query_embed = query_embeddings[0] if isinstance(query_embeddings, list) else query_embeddings
            
            conn = psycopg2.connect(DATABASE_URL)
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            try:
                # Convert query embedding to PostgreSQL vector format
                query_embed_str = '[' + ','.join(map(str, query_embed)) + ']'
                cursor.execute(
                    f"""
                    SELECT document, question
                    FROM {COLLECTION_NAME}
                    ORDER BY embedding <=> %s::vector
                    LIMIT %s
                    """,
                    (query_embed_str, n_results)
                )
                
                results = cursor.fetchall()
                documents = [row['document'] for row in results]
                
                return {
                    "documents": [documents] if documents else [[]]
                }
            finally:
                cursor.close()
                conn.close()
        except Exception as e:
            print(f"Error querying vector database: {e}")
            return {"documents": [[]]}

# Create collection instance for export
collection = VectorCollection()

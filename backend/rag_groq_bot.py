# rag_groq_bot.py
import json
import uuid
import os
from tqdm import tqdm
from chromadb import Client
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from groq import Groq
from dotenv import load_dotenv

# === Load environment variables ===
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("❌ Missing GROQ_API_KEY. Set it in your environment variables or .env file.")

# === Configuration ===
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "data", "test.jsonl")
CHROMA_DIR = os.path.join(BASE_DIR, "chroma_db")
COLLECTION_NAME = "k12_content"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_MODEL = "openai/gpt-oss-20b"

# === Load dataset ===
with open(DATASET_PATH, "r", encoding="utf-8") as f:
    data = [json.loads(line) for line in f]

print(f"Total QA pairs found: {len(data)}")

# === Initialize ChromaDB ===
chroma = Client(Settings())

# Check if collection exists, otherwise create it
try:
    collection = chroma.get_collection(name=COLLECTION_NAME)
    print(f"Collection '{COLLECTION_NAME}' loaded from ChromaDB!")
except Exception:
    print(f"Collection '{COLLECTION_NAME}' not found. Creating and populating...")
    collection = chroma.create_collection(name=COLLECTION_NAME)
    embed_model = SentenceTransformer(EMBED_MODEL_NAME)

    for entry in tqdm(data, desc="Adding QA pairs to ChromaDB"):
        text = entry["question"] + " " + entry["answer"]
        embedding = embed_model.encode(text).tolist()
        collection.add(
            ids=[str(uuid.uuid4())],
            documents=[text],
            embeddings=[embedding],
            metadatas=[{"question": entry["question"]}]
        )
    print(f"Chroma collection '{COLLECTION_NAME}' created and populated!")

# === Initialize Groq client ===
client = Groq(api_key=GROQ_API_KEY)
embed_model = SentenceTransformer(EMBED_MODEL_NAME)

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
    Ask a question to Groq with RAG context from ChromaDB.
    Returns the complete answer (no token limit) and supports complex formulas.
    """
    try:
        # Retrieve top-3 relevant docs
        query_embed = embed_model.encode(question).tolist()
        results = collection.query(query_embeddings=[query_embed], n_results=3)

        if results and "documents" in results and results["documents"][0]:
            context = " ".join(results["documents"][0])
        else:
            context = "No additional context available."

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
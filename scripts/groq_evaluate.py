cat > rag_groq_bot.py <<'PY'
import os
import re
import uuid
import json
from typing import List, Dict, Any

from dotenv import load_dotenv
from tqdm import tqdm
from chromadb import Client
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from groq import Groq

# ---------------------------
# Environment / Config
# ---------------------------
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("❌ Missing GROQ_API_KEY. Set it in your .env or environment.")

DATASET_PATH = "data/test.jsonl"        # used only if we need to build the collection once
CHROMA_DIR = "./chroma_db"              # persisted vector store directory
COLLECTION_NAME = "k12_content"
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
GROQ_MODEL = "openai/gpt-oss-20b"       # switch to another Groq model if you want

# ---------------------------
# Clients (Persisted Chroma + Embeddings + Groq)
# ---------------------------
chroma = Client(Settings(chroma_db_impl="duckdb+parquet", persist_directory=CHROMA_DIR))
embed_model = SentenceTransformer(EMBED_MODEL_NAME)
client = Groq(api_key=GROQ_API_KEY)

# ---------------------------
# Ensure collection exists (one-time build if missing)
# ---------------------------
def _ensure_collection() -> "Collection":
    """Load the collection if it exists; otherwise create it once from DATASET_PATH."""
    try:
        coll = chroma.get_collection(name=COLLECTION_NAME)
        print(f"Collection '{COLLECTION_NAME}' loaded from ChromaDB!")
        return coll
    except Exception:
        if not os.path.exists(DATASET_PATH):
            raise RuntimeError(
                f"Collection '{COLLECTION_NAME}' not found and dataset file '{DATASET_PATH}' is missing.\n"
                "Add your K-12 dataset (JSONL with {question,answer}) or run your setup script first."
            )
        print(f"Collection '{COLLECTION_NAME}' not found. Creating and populating...")
        with open(DATASET_PATH, "r", encoding="utf-8") as f:
            data = [json.loads(line) for line in f]
        print(f"Total QA pairs found: {len(data)}")
        coll = chroma.create_collection(name=COLLECTION_NAME)
        for entry in tqdm(data, desc="Adding QA pairs to ChromaDB"):
            text = f"{entry.get('question','')} {entry.get('answer','')}".strip()
            if not text:
                continue
            emb = embed_model.encode(text).tolist()
            coll.add(
                ids=[str(uuid.uuid4())],
                documents=[text],
                embeddings=[emb],
                metadatas=[{"question": entry.get("question","")}],
            )
        print(f"Chroma collection '{COLLECTION_NAME}' created and populated!")
        return coll

collection = _ensure_collection()

# ---------------------------
# Helpers
# ---------------------------
def get_grade_hint(grade) -> str:
    try:
        g = int(grade)
    except Exception:
        g = 5
    if g <= 2:
        return "Provide a very simple explanation suitable for young children."
    elif g <= 5:
        return "Explain with simple examples and easy-to-understand language."
    elif g <= 8:
        return "Use clear examples and some intermediate-level explanations."
    elif g <= 12:
        return "Provide detailed explanation suitable for high school students."
    return "Provide a detailed explanation suitable for advanced learners."

def _normalize_latex(md: str) -> str:
    """Convert \\[...\\] -> $$...$$ and \\(...\\) -> $...$ for KaTeX on the frontend."""
    if not md:
        return md
    
    # Handle block math environments
    md = re.sub(r"\\\[([\s\S]*?)\\\]", r"$$\1$$", md)
    
    # Handle \begin{aligned}...\end{aligned} blocks
    md = re.sub(r"\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}", r"$$\\begin{aligned}\1\\end{aligned}$$", md)
    
    # Handle \begin{array}...\end{array} blocks
    md = re.sub(r"\\begin\{array\}([\s\S]*?)\\end\{array\}", r"$$\\begin{array}\1\\end{array}$$", md)
    
    # Handle \begin{cases}...\end{cases} blocks
    md = re.sub(r"\\begin\{cases\}([\s\S]*?)\\end\{cases\}", r"$$\\begin{cases}\1\\end{cases}$$", md)
    
    # Handle \begin{matrix}...\end{matrix} blocks
    md = re.sub(r"\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}", r"$$\\begin{matrix}\1\\end{matrix}$$", md)
    
    # Handle \begin{pmatrix}...\end{pmatrix} blocks
    md = re.sub(r"\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}", r"$$\\begin{pmatrix}\1\\end{pmatrix}$$", md)
    
    # Handle \begin{vmatrix}...\end{vmatrix} blocks
    md = re.sub(r"\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}", r"$$\\begin{vmatrix}\1\\end{vmatrix}$$", md)
    
    # Handle \begin{bmatrix}...\end{bmatrix} blocks
    md = re.sub(r"\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}", r"$$\\begin{bmatrix}\1\\end{bmatrix}$$", md)
    
    # Handle inline math
    md = re.sub(r"\\\(([\s\S]*?)\\\)", r"$\1$", md)
    
    # Handle \boxed{...} expressions - these should be block math
    md = re.sub(r"\\boxed\{([^}]+)\}", r"$$\\boxed{\1}$$", md)
    
    # Clean up any double dollar signs that might have been created
    md = re.sub(r'\$\$\$\$', '$$', md)
    
    return md

# ---------------------------
# Tutor: RAG answer
# ---------------------------
def ask_groq(question: str, grade=5) -> str:
    """Answer a user question using RAG context from Chroma + Groq."""
    try:
        q_emb = embed_model.encode(question).tolist()
        res = collection.query(query_embeddings=[q_emb], n_results=3)
        docs = res.get("documents", [[]])[0] if res and res.get("documents") else []
        context = " ".join(docs) if docs else ""

        grade_hint = get_grade_hint(grade)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            temperature=0.2,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful K-12 tutor. "
                        f"{grade_hint} "
                        "Use LaTeX with $$...$$ for block equations and \\(...\\) for inline."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Question: {question}\n\nContext:\n{context}\n\nAnswer clearly.",
                },
            ],
            max_tokens=3000,
        )
        ans = response.choices[0].message.content if response.choices else "No answer."
        return _normalize_latex(ans)
    except Exception as e:
        return f"Error occurred: {e}"

# ---------------------------
# Quiz generator
# ---------------------------
def _extract_json_block(text: str) -> str:
    """Extract the largest JSON-looking block."""
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text

def _normalize_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for it in items:
        qid = it.get("id") or str(uuid.uuid4())
        qmd = (it.get("question_md") or it.get("question") or "").strip()
        choices = it.get("choices", {})
        fixed = {}
        for k in ["A", "B", "C", "D"]:
            if k in choices:
                fixed[k] = choices[k]
        if not fixed and all(k in choices for k in ["0", "1", "2", "3"]):
            fixed = {"A": choices["0"], "B": choices["1"], "C": choices["2"], "D": choices["3"]}
        correct = (it.get("correct") or "").strip().upper()
        corr = correct if correct in ["A", "B", "C", "D"] else correct[:1]
        exp = (it.get("explanation_md") or it.get("explanation") or "").strip()
        skill = it.get("skill_tag", "")
        out.append(
            {
                "id": qid,
                "question_md": _normalize_latex(qmd),
                "choices": fixed,
                "correct": corr,
                "explanation_md": _normalize_latex(exp),
                "skill_tag": skill,
            }
        )
    return out

def generate_quiz_items(topic: str, grade: int, n: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
    """
    Generate multiple-choice quiz items (A–D) with explanations, using
    retrieved context from Chroma and a Groq JSON-only response.
    """
    query = f"{topic} grade {grade} difficulty {difficulty}"
    q_emb = embed_model.encode(query).tolist()
    res = collection.query(query_embeddings=[q_emb], n_results=12)
    docs = res.get("documents", [[]])[0] if res and res.get("documents") else []
    context = ("\n\n---\n".join(docs))[:9000]

    system = (
        "You are an expert K-12 quiz writer. Use ONLY the provided context to avoid errors. "
        "For math, use LaTeX $$...$$ (block) and \\(...\\) (inline). "
        "Return STRICT JSON ONLY. Do not include backticks or extra prose."
    )
    user = f"""
Generate exactly {n} multiple-choice questions for grade {grade} on the topic "{topic}" at {difficulty} difficulty.
Each item must be solvable for that grade. Make choices plausible; only one correct option (A–D). Include a short explanation.

Return a JSON object exactly:
{{
  "items": [
    {{
      "id": "uuid",
      "question_md": "markdown with LaTeX if needed",
      "choices": {{"A":"...", "B":"...", "C":"...", "D":"..."}},
      "correct": "A",
      "explanation_md": "markdown with LaTeX if needed",
      "skill_tag": "e.g., linear_equations"
    }}
  ]
}}

CONTEXT:
{context}
""".strip()

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.2,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=3500,
    )
    raw = response.choices[0].message.content if response.choices else "{}"
    json_like = _extract_json_block(raw)

    try:
        data = json.loads(json_like)
    except Exception:
        fixed = re.sub(r",(\s*[}\]])", r"\1", json_like)
        data = json.loads(fixed)

    items = _normalize_items(data.get("items", []))
    if len(items) > n:
        items = items[:n]

    return {"items": items, "meta": {"topic": topic, "grade": grade, "difficulty": difficulty}}
PY

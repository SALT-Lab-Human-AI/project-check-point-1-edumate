# backend/main.py
from typing import List, Dict, Any

import re
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.rag_groq_bot import ask_groq            # RAG tutor answer
from backend.quiz_gen import generate_quiz_items     # Quiz generator (new module)


app = FastAPI(title="K-12 RAG Tutor API")

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

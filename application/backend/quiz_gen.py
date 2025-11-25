import re
import json
from typing import List, Dict, Any, Optional

from backend.rag_groq_bot import collection, get_embed_model, client, GROQ_MODEL


def _normalize_latex(md: str) -> str:
    r"""Convert \[...\] -> $$...$$ and \(...\) -> $...$ for KaTeX on the frontend."""
    if not md:
        return md
    
    # Step 0: Fix malformed LaTeX patterns first (before any other processing)
    # Fix patterns like $\begin{aligned}...$\end${aligned}$ -> \begin{aligned}...\end{aligned}
    md = re.sub(r'\$\\begin\{(\w+)\}([\s\S]*?)\$\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', md)
    # Fix patterns like $\begin{aligned}...\end${aligned}$ -> \begin{aligned}...\end{aligned}
    md = re.sub(r'\$\\begin\{(\w+)\}([\s\S]*?)\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', md)
    # Fix patterns like \begin{aligned}$...$\end${aligned} -> \begin{aligned}...\end{aligned}
    md = re.sub(r'\\begin\{(\w+)\}\$([\s\S]*?)\$\\end\$\{(\w+)\}', r'\\begin{\1}\2\\end{\3}', md)
    # Fix patterns like $ \begin{aligned}...$\end${aligned}$ (with space)
    md = re.sub(r'\$\s*\\begin\{(\w+)\}([\s\S]*?)\$\\end\$\{(\w+)\}\$', r'\\begin{\1}\2\\end{\3}', md)
    # Fix patterns where $ appears inside the environment content: \begin{aligned}$content$\end{aligned}
    md = re.sub(r'\\begin\{(\w+)\}\$([\s\S]*?)\$\\end\{(\w+)\}', r'\\begin{\1}\2\\end{\3}', md)
    # Fix patterns like $\end${aligned} -> \end{aligned}
    md = re.sub(r'\$\\end\$\{(\w+)\}', r'\\end{\1}', md)
    # Fix patterns like $\begin${aligned} -> \begin{aligned}
    md = re.sub(r'\$\\begin\$\{(\w+)\}', r'\\begin{\1}', md)
    # Fix patterns where $ appears in the middle: \end${aligned} -> \end{aligned
    md = re.sub(r'\\end\$\{(\w+)\}', r'\\end{\1}', md)
    md = re.sub(r'\\begin\$\{(\w+)\}', r'\\begin{\1}', md)
    # Fix patterns like $\end${cases} -> \end{cases}
    md = re.sub(r'\$\$?\\end\$\{(\w+)\}', r'\\end{\1}', md)
    md = re.sub(r'\$\$?\\begin\$\{(\w+)\}', r'\\begin{\1}', md)
    # Remove stray $ signs that appear before or after \begin/\end
    md = re.sub(r'\$\\begin\{(\w+)\}', r'\\begin{\1}', md)
    md = re.sub(r'\\end\{(\w+)\}\$', r'\\end{\1}', md)
    
    # Fix incorrect line break syntax: || -> \\ in cases/aligned environments
    # First, fix || anywhere in the string that should be \\ for LaTeX line breaks
    # Replace all || with \\ (but be careful not to break existing \\)
    md = re.sub(r'\|\|', r'\\\\', md)
    # But we need to be careful - if there are already proper \\, we don't want \\\\\ 
    # So fix any triple+ backslashes back to double
    md = re.sub(r'\\{3,}', r'\\\\', md)
    
    # Handle block math environments FIRST (before other processing)
    # Handle \begin{cases}...\end{cases} blocks - must be before other begin/end patterns
    md = re.sub(r"\\begin\{cases\}([\s\S]*?)\\end\{cases\}", r"$$\\begin{cases}\1\\end{cases}$$", md)
    
    # Handle \begin{aligned}...\end{aligned} blocks
    # First, handle properly formatted ones
    md = re.sub(r"\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}", r"$$\\begin{aligned}\1\\end{aligned}$$", md)
    
    # Handle \begin{array}...\end{array} blocks
    md = re.sub(r"\\begin\{array\}([\s\S]*?)\\end\{array\}", r"$$\\begin{array}\1\\end{array}$$", md)
    
    # Handle \begin{matrix}...\end{matrix} blocks
    md = re.sub(r"\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}", r"$$\\begin{matrix}\1\\end{matrix}$$", md)
    
    # Handle \begin{pmatrix}...\end{pmatrix} blocks
    md = re.sub(r"\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}", r"$$\\begin{pmatrix}\1\\end{pmatrix}$$", md)
    
    # Handle \begin{vmatrix}...\end{vmatrix} blocks
    md = re.sub(r"\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}", r"$$\\begin{vmatrix}\1\\end{vmatrix}$$", md)
    
    # Handle \begin{bmatrix}...\end{bmatrix} blocks
    md = re.sub(r"\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}", r"$$\\begin{bmatrix}\1\\end{bmatrix}$$", md)
    
    # Handle block math environments \[...\]
    md = re.sub(r"\\\[([\s\S]*?)\\\]", r"$$\1$$", md)
    
    # Handle inline math
    md = re.sub(r"\\\(([\s\S]*?)\\\)", r"$\1$", md)
    
    # Handle \boxed{...} expressions - these should be block math
    md = re.sub(r"\\boxed\{([^}]+)\}", r"$$\\boxed{\1}$$", md)
    
    # Clean up any double dollar signs that might have been created
    md = re.sub(r'\$\$\$\$', '$$', md)
    
    # Ensure proper spacing around block math - add line breaks before and after $$ blocks if not present
    # This makes it easier to read in questions
    md = re.sub(r'([^\n])(\$\$[^$]+\$\$)', r'\1\n\n\2', md)
    md = re.sub(r'(\$\$[^$]+\$\$)([^\n])', r'\1\n\n\2', md)
    # Clean up triple newlines
    md = re.sub(r'\n{3,}', '\n\n', md)
    
    return md


def _grade_hint(grade) -> str:
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


def _extract_json_block(text: str) -> str:
    """
    Try to pull a JSON-looking block from the response.
    Priority: fenced ```json ... ``` then largest {...}.
    """
    # fenced ```json ... ```
    m = re.search(r"```json\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    # largest {...}
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text.strip()


def _light_repair_json(s: str) -> str:
    """
    Very light repair: normalize quotes, remove trailing commas.
    """
    # Replace fancy quotes
    s = s.replace("“", '"').replace("”", '"').replace("’", "'")
    # Remove trailing commas before } ]
    s = re.sub(r",(\s*[}\]])", r"\1", s)
    # Ensure keys are quoted (best-effort)
    s = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*):", r'\1"\2"\3:', s)
    return s


def _normalize_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    out = []
    for it in items:
        qid = it.get("id") or it.get("uuid") or it.get("qid") or ""
        qmd = (it.get("question_md") or it.get("question") or "").strip()
        choices = it.get("choices", {})
        fixed = {}
        for k in ["A", "B", "C", "D"]:
            if k in choices:
                fixed[k] = choices[k]
        if not fixed and all(k in choices for k in ["0", "1", "2", "3"]):
            fixed = {"A": choices["0"], "B": choices["1"], "C": choices["2"], "D": choices["3"]}

        correct = (it.get("correct") or "").strip().upper()[:1]
        exp = (it.get("explanation_md") or it.get("explanation") or "").strip()
        skill = it.get("skill_tag", "")

        out.append(
            {
                "id": qid,
                "question_md": _normalize_latex(qmd),
                "choices": fixed,
                "correct": correct if correct in ["A", "B", "C", "D"] else "",
                "explanation_md": _normalize_latex(exp),
                "skill_tag": skill,
            }
        )
    return out


def _safe_parse_items(raw: str) -> Optional[List[Dict[str, Any]]]:
    """
    Try multiple strategies to parse JSON and return items list.
    """
    # 1) direct
    try:
        data = json.loads(raw)
        if isinstance(data, dict) and "items" in data:
            return data["items"]
    except Exception:
        pass

    # 2) fenced or block-extracted
    blk = _extract_json_block(raw)
    try:
        data = json.loads(blk)
        if isinstance(data, dict) and "items" in data:
            return data["items"]
    except Exception:
        pass

    # 3) light repair
    try:
        fixed = _light_repair_json(blk)
        data = json.loads(fixed)
        if isinstance(data, dict) and "items" in data:
            return data["items"]
    except Exception:
        pass

    return None


def _fallback_items(topic: str, grade: int, n: int) -> List[Dict[str, Any]]:
    """
    Last resort: return a minimal, valid quiz so the API never 500s.
    """
    base_q = f"Which option best matches the topic '{topic}'?"
    base_choices = {"A": topic, "B": "Not related", "C": "Unsure", "D": "Skip"}
    return [
        {
            "id": f"fallback-{i+1}",
            "question_md": _normalize_latex(base_q),
            "choices": base_choices,
            "correct": "A",
            "explanation_md": _normalize_latex("The topic itself is the best match."),
            "skill_tag": "fallback",
        }
        for i in range(n)
    ]


def generate_quiz_items(topic: str, grade: int, n: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
    """
    Generate multiple-choice quiz items (A–D) with explanations, using
    retrieved context from Chroma and a Groq JSON-only response.
    Memory-optimized version for Render free tier (512MB limit).
    Automatically reduces memory usage when memory is high.
    """
    # Check memory and optimize parameters accordingly
    use_minimal_mode = False
    try:
        from backend.memory_tracker import get_memory_usage
        memory = get_memory_usage()
        if memory['process_memory_mb'] > 500:
            use_minimal_mode = True
            print(f"[QUIZ-MEMORY] High memory detected ({memory['process_memory_mb']:.2f}MB). Using minimal RAG context.")
    except ImportError:
        pass
    
    # 1) Retrieve context (adaptive based on memory)
    context = ""
    if use_minimal_mode:
        # Minimal mode: 3 documents, 3000 chars max (saves ~20-30MB)
        try:
            query = f"{topic} grade {grade} difficulty {difficulty}"
            q_emb = get_embed_model().encode(query).tolist()
            res = collection.query(query_embeddings=[q_emb], n_results=3)  # Minimal: 3 results
            docs = res.get("documents", [[]])[0] if res and res.get("documents") else []
            context = ("\n\n---\n".join(docs))[:3000]  # Minimal: 3000 chars
        except Exception as e:
            print(f"[QUIZ-MEMORY] Could not retrieve context: {e}. Using topic-only context.")
            context = f"Topic: {topic} for grade {grade} students at {difficulty} difficulty level."
    else:
        # Normal mode: 5 documents, 5000 chars max
        query = f"{topic} grade {grade} difficulty {difficulty}"
        q_emb = get_embed_model().encode(query).tolist()
        res = collection.query(query_embeddings=[q_emb], n_results=5)
        docs = res.get("documents", [[]])[0] if res and res.get("documents") else []
        context = ("\n\n---\n".join(docs))[:5000]
    
    if not context:
        context = f"Topic: {topic} for grade {grade} students at {difficulty} difficulty level."

    # 2) Prompt
    system = (
        "You are an expert K-12 quiz writer. "
        f"{_grade_hint(grade)} "
        "Use ONLY the provided context to avoid errors. "
        "For math, use LaTeX $$...$$ (block) and \\(...\\) (inline). "
        "IMPORTANT: Use correct LaTeX syntax. For \\begin{{aligned}}...\\end{{aligned}}, use \\end{{aligned}} NOT $\\end${{aligned}} or \\end${{aligned}}. "
        "Never use $ signs inside \\begin or \\end commands. Use proper LaTeX syntax only. "
        "Return STRICT JSON ONLY. Do not include backticks or extra prose. "
        "The root must be an object with an 'items' array."
    )
    user = f"""
Generate exactly {n} multiple-choice questions for grade {grade} on the topic "{topic}" at {difficulty} difficulty.
Each item must be solvable for that grade. Make choices plausible; only one correct option (A–D). Include a short explanation.

LATEX FORMATTING RULES:
- For block math (equations, systems), use: $$\\begin{{aligned}}...\\end{{aligned}}$$
- For inline math, use: \\(...\\)
- NEVER use $ signs inside \\begin or \\end commands
- Use correct LaTeX syntax: \\end{{aligned}} NOT $\\end${{aligned}} or \\end${{aligned}}
- For systems of equations, use: $$\\begin{{cases}}...\\end{{cases}}$$
- For line breaks in cases/aligned environments, use \\\\ (double backslash) NOT || (double pipe)
- Example: $$\\begin{{cases}}x+y=5\\\\x-y=3\\end{{cases}}$$ NOT $$\\begin{{cases}}x+y=5||x-y=3\\end{{cases}}$$
- Always use proper LaTeX syntax with correct escaping

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

    # 3) Call Groq (adaptive max_tokens based on memory)
    max_tokens = 1500 if use_minimal_mode else 2000  # Further reduced when memory is high
    
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.1,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        response_format={"type": "json_object"},  # many Groq models honor this; safe to include
    )

    raw = response.choices[0].message.content if response.choices else "{}"

    # 4) Parse items safely
    items = _safe_parse_items(raw)
    if not items:
        # Fallback minimal quiz to avoid 500
        items = _fallback_items(topic, grade, n)

    items = _normalize_items(items)
    if len(items) > n:
        items = items[:n]

    return {
        "items": items,
        "meta": {"topic": topic, "grade": grade, "difficulty": difficulty},
        "raw_ok": items and not items[0]["id"].startswith("fallback-"),
    }

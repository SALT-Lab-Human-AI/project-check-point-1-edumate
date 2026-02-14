import re
import json
from typing import List, Dict, Any, Optional

from backend.rag_groq_bot import collection, get_embed_model, client, GROQ_MODEL


def _normalize_latex_if_needed(md: str) -> str:
    """Only normalize if LaTeX is detected - saves memory by skipping expensive regex"""
    if not md or ('\\' not in md and '$' not in md):
        return md  # Skip expensive regex if no LaTeX detected
    return _normalize_latex(md)

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
                "question_md": _normalize_latex_if_needed(qmd),
                "choices": fixed,
                "correct": correct if correct in ["A", "B", "C", "D"] else "",
                "explanation_md": _normalize_latex_if_needed(exp),
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
            "question_md": _normalize_latex_if_needed(base_q),
            "choices": base_choices,
            "correct": "A",
            "explanation_md": _normalize_latex_if_needed("The topic itself is the best match."),
            "skill_tag": "fallback",
        }
        for i in range(n)
    ]


def generate_quiz_items(topic: str, grade: int, n: int = 5, difficulty: str = "medium") -> Dict[str, Any]:
    """
    Ultra memory-optimized quiz generation for Render free tier (512MB limit).
    Implements multiple optimization strategies to minimize memory usage.
    """
    import gc
    from backend.memory_tracker import get_memory_usage
    
    # Get current memory usage
    try:
        memory = get_memory_usage()
        memory_mb = memory['process_memory_mb']
    except Exception:
        memory_mb = 500  # Assume high memory if we can't check
        print("[QUIZ-MEMORY] Could not check memory, assuming high memory mode")
    
    # Determine optimization level based on memory and question count
    # Ultra-minimal mode for single question
    if n == 1:
        context = f"Topic: {topic} for grade {grade}."
        max_tokens = 2000
        use_rag = False
        print(f"[QUIZ-MEMORY] Ultra-minimal mode for 1 question. Memory: {memory_mb:.2f}MB")
    # Skip RAG entirely if memory is high
    elif memory_mb > 480:
        context = f"Topic: {topic} for grade {grade} students at {difficulty} difficulty."
        max_tokens = 2000
        use_rag = False
        print(f"[QUIZ-MEMORY] Skipping RAG to save memory. Memory: {memory_mb:.2f}MB")
    # Minimal RAG mode
    elif memory_mb > 450:
        use_rag = True
        max_tokens = 2000
        n_results = 2  # Only 2 documents
        context_limit = 1500
        print(f"[QUIZ-MEMORY] Minimal RAG mode (2 docs, 1500 chars). Memory: {memory_mb:.2f}MB")
    # Normal mode
    else:
        use_rag = True
        max_tokens = 2000
        n_results = 3
        context_limit = 3000
        print(f"[QUIZ-MEMORY] Normal mode (3 docs, 3000 chars). Memory: {memory_mb:.2f}MB")
    
    # Retrieve context if using RAG
    if use_rag:
        try:
            query = f"{topic} grade {grade}"  # Simplified query
            q_emb = get_embed_model().encode(query).tolist()
            res = collection.query(query_embeddings=[q_emb], n_results=n_results)
            docs = res.get("documents", [[]])[0] if res and res.get("documents") else []
            context = ("\n\n---\n".join(docs))[:context_limit]
            
            # Clear large variables immediately to free memory
            del q_emb, res, docs
            gc.collect()
            
            # Unload embedding model if memory is high (saves ~80-100MB)
            if memory_mb > 480:
                import backend.rag_groq_bot as rag_module
                rag_module._embed_model = None
                gc.collect()
                print("[QUIZ-MEMORY] Unloaded embedding model to save memory")
        except Exception as e:
            print(f"[QUIZ-MEMORY] RAG failed: {e}. Using topic-only context.")
            context = f"Topic: {topic} for grade {grade}."
    
    if not context:
        context = f"Topic: {topic} for grade {grade} students at {difficulty} difficulty level."

    # Simplified prompts to reduce memory (shorter = less memory)
    system = (
        f"Expert K-12 quiz writer for grade {grade}. "
        f"{_grade_hint(grade)} "
        "Use context only. LaTeX: $$...$$ (block), \\(...\\) (inline). "
        "Return JSON only: {{'items': [...]}}"
    )
    
    # Simplified user prompt - removed verbose LaTeX rules to save memory
    user = (
        f"Generate {n} multiple-choice questions for grade {grade} on '{topic}' ({difficulty}). "
        f"One correct answer (A-D). Include explanation.\n\n"
        f"Return JSON with this exact structure:\n"
        f'{{"items": [{{"id": "uuid", "question_md": "...", "choices": {{"A": "actual answer text", "B": "actual answer text", "C": "actual answer text", "D": "actual answer text"}}, "correct": "A", "explanation_md": "...", "skill_tag": "..."}}]}}\n\n'
        f"IMPORTANT: The 'choices' field must have keys A, B, C, D with actual answer text (not 'Option A', 'Option B', etc.).\n\n"
        f"Context: {context}"
    )

    # Call Groq with optimized settings
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        temperature=0.1,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content if response.choices else "{}"
    
    # Clear response object immediately to free memory
    del response
    gc.collect()

    # Parse items safely
    items = _safe_parse_items(raw)
    if not items:
        items = _fallback_items(topic, grade, n)

    items = _normalize_items(items)
    if len(items) > n:
        items = items[:n]
    
    # Clear raw string after processing
    del raw
    gc.collect()

    return {
        "items": items,
        "meta": {"topic": topic, "grade": grade, "difficulty": difficulty},
        "raw_ok": items and not items[0]["id"].startswith("fallback-"),
    }

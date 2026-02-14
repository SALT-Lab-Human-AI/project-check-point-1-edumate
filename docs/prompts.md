# System Prompts & Configuration Report

This document reports on the system prompts, prompt templates, and configuration settings currently implemented in the EduMate platform.

## Table of Contents

1. [Overview](#overview)
2. [RAG Tutor Prompts](#rag-tutor-prompts)
3. [Quiz Generation Prompts](#quiz-generation-prompts)
4. [Grade-Based Hints](#grade-based-hints)
5. [LaTeX Formatting Rules](#latex-formatting-rules)
6. [Prompt Configuration](#prompt-configuration)

---

## Overview

EduMate currently uses structured prompts to guide AI responses for:
- **Tutor Questions (RAG Pipeline)**: Step-by-step explanations with grade-appropriate language
- **Quiz Generation**: Multiple-choice question creation with proper formatting
- **Grade Adaptation**: Dynamic hints based on student grade level

The current implementation:
- Uses curriculum-aligned content from the vector database
- Generates grade-appropriate responses
- Includes proper LaTeX formatting for mathematical expressions
- Follows consistent output formats

---

## RAG Tutor Prompts

### System Prompt

**Location:** `application/backend/rag_groq_bot.py` lines 257

**Current Implementation:**
```python
{"role": "system", "content": f"You are a helpful K-12 tutor. {grade_hint}"}
```

**Structure:**
- Base role: "You are a helpful K-12 tutor"
- Grade hint: Dynamically inserted based on student grade (see [Grade-Based Hints](#grade-based-hints))

**Purpose:**
- Establishes AI persona as educational tutor
- Sets appropriate language level for student grade
- Guides response style and complexity

**Example Output (Grade 7):**
```
You are a helpful K-12 tutor. Use clear examples and some intermediate-level explanations.
```

### User Prompt

**Location:** `application/backend/rag_groq_bot.py` lines 258

**Current Implementation:**
```python
{"role": "user", "content": question + "\n\nContext: " + context}
```

**Structure:**
- `question`: User's question (verbatim)
- `context`: Retrieved relevant content from vector database (top 3 similar documents)

**Context Retrieval:**
- Uses cosine similarity search on `k12_content` table
- Retrieves top 3 most similar documents
- Falls back to empty context if vector table is empty
- Context limited to prevent token overflow

**Example:**
```
How do I solve 2x + 5 = 13?

Context: To solve linear equations, isolate the variable by performing inverse operations. For 2x + 5 = 13, subtract 5 from both sides to get 2x = 8, then divide by 2 to get x = 4.
```

### Complete Implementation

**Code Location:** `application/backend/rag_groq_bot.py` lines 250-261

**Current Code:**
```python
grade_hint = get_grade_hint(grade)

response = client.chat.completions.create(
    model=GROQ_MODEL,
    messages=[
        {"role": "system", "content": f"You are a helpful K-12 tutor. {grade_hint}"},
        {"role": "user", "content": question + "\n\nContext: " + context}
    ],
    max_tokens=3000  # remove limit, allows full response
)
```

**Model Settings:**
- Model: `openai/gpt-oss-20b` (Groq)
- Max Tokens: 3000 (allows full response)
- Temperature: Default (not specified, uses model default)

---

## Quiz Generation Prompts

### System Prompt

**Location:** `application/backend/quiz_gen.py` lines 232-241

**Current Implementation:**
```python
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
```

**Full System Prompt (with grade hint example for grade 7):**
```
You are an expert K-12 quiz writer. Use clear examples and some intermediate-level explanations. Use ONLY the provided context to avoid errors. For math, use LaTeX $$...$$ (block) and \(...\) (inline). IMPORTANT: Use correct LaTeX syntax. For \begin{aligned}...\end{aligned}, use \end{aligned} NOT $\end${aligned} or \end${aligned}. Never use $ signs inside \begin or \end commands. Use proper LaTeX syntax only. Return STRICT JSON ONLY. Do not include backticks or extra prose. The root must be an object with an 'items' array.
```

**Key Components:**
1. Expert quiz writer persona
2. Grade-appropriate difficulty (via grade hint)
3. Use only provided context (prevents hallucination)
4. LaTeX formatting rules (see [LaTeX Formatting Rules](#latex-formatting-rules))
5. Strict JSON output format

### User Prompt

**Location:** `application/backend/quiz_gen.py` lines 242-272

**Current Implementation:**
```python
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
```

**Example with Actual Values:**
```
Generate exactly 5 multiple-choice questions for grade 7 on the topic "Linear Equations" at medium difficulty.
Each item must be solvable for that grade. Make choices plausible; only one correct option (A–D). Include a short explanation.

LATEX FORMATTING RULES:
- For block math (equations, systems), use: $$\begin{aligned}...\end{aligned}$$
- For inline math, use: \(...\)
- NEVER use $ signs inside \begin or \end commands
- Use correct LaTeX syntax: \end{aligned} NOT $\end${aligned} or \end${aligned}
- For systems of equations, use: $$\begin{cases}...\end{cases}$$
- For line breaks in cases/aligned environments, use \\ (double backslash) NOT || (double pipe)
- Example: $$\begin{cases}x+y=5\\x-y=3\end{cases}$$ NOT $$\begin{cases}x+y=5||x-y=3\end{cases}$$
- Always use proper LaTeX syntax with correct escaping

Return a JSON object exactly:
{
  "items": [
    {
      "id": "uuid",
      "question_md": "markdown with LaTeX if needed",
      "choices": {"A":"...", "B":"...", "C":"...", "D":"..."},
      "correct": "A",
      "explanation_md": "markdown with LaTeX if needed",
      "skill_tag": "e.g., linear_equations"
    }
  ]
}

CONTEXT:
[Retrieved relevant content from vector database...]
```

**Parameters:**
- `n`: Number of questions to generate
- `grade`: Student grade level (1-12)
- `topic`: Quiz topic (e.g., "Linear Equations")
- `difficulty`: "easy", "medium", or "hard"
- `context`: Retrieved relevant content from vector database

**Output Format:**
- Strict JSON object
- Root object contains `items` array
- Each item has: `id`, `question_md`, `choices`, `correct`, `explanation_md`, `skill_tag`

### Complete Implementation

**Code Location:** `application/backend/quiz_gen.py` lines 231-284

**Current Code:**
```python
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
[... full user prompt as shown above ...]
""".strip()

# 3) Call Groq (try JSON mode; if ignored, parser still handles it)
response = client.chat.completions.create(
    model=GROQ_MODEL,
    temperature=0.1,
    messages=[
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ],
    max_tokens=3500,
    response_format={"type": "json_object"},  # many Groq models honor this; safe to include
)
```

**Model Settings:**
- Model: `openai/gpt-oss-20b` (Groq)
- Temperature: 0.1 (low for consistency)
- Max Tokens: 3500
- Response Format: `{"type": "json_object"}` (enforces JSON output)

---

## Grade-Based Hints

### Grade Hint Function (RAG)

**Location:** `application/backend/rag_groq_bot.py` lines 161-177

**Current Implementation:**
```python
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
```

### Grade Hint Function (Quiz)

**Location:** `application/backend/quiz_gen.py` lines 91-104

**Current Implementation:**
```python
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
```

**Note:** Both functions return identical hint messages, only the function names differ.

### Grade Level Mapping

| Grade Range | Hint Message | Current Use Case |
|------------|--------------|-----------------|
| K-2 (≤2) | "Provide a very simple explanation suitable for young children." | Early elementary, visual learning |
| 3-5 (≤5) | "Explain with simple examples and easy-to-understand language." | Elementary, concrete examples |
| 6-8 (≤8) | "Use clear examples and some intermediate-level explanations." | Middle school, abstract concepts |
| 9-12 (≤12) | "Provide detailed explanation suitable for high school students." | High school, advanced topics |
| >12 | "Provide a detailed explanation suitable for advanced learners." | Advanced/college level |

### Current Usage

**In RAG Tutor:**
- Inserted into system prompt via `get_grade_hint(grade)`
- Affects language complexity and explanation depth
- Guides step-by-step instruction style

**In Quiz Generation:**
- Inserted into system prompt via `_grade_hint(grade)`
- Affects question difficulty and vocabulary
- Influences distractor plausibility

---

## LaTeX Formatting Rules

### LaTeX Syntax Requirements

All prompts include explicit LaTeX formatting rules to ensure proper rendering with KaTeX on the frontend.

### Block Math

**For equations and systems:**
```
$$\\begin{{aligned}}...\\end{{aligned}}$$
```

**For cases:**
```
$$\\begin{{cases}}...\\end{{cases}}$$
```

**For arrays:**
```
$$\\begin{{array}}...\\end{{array}}$$
```

### Inline Math

```
\\(...\\)
```

### Common Patterns

**Correct Patterns:**
- `$$\\begin{{aligned}}x+y=5\\\\x-y=3\\end{{aligned}}$$`
- `\\(x = 4\\)`
- `$$\\begin{{cases}}x>0\\\\x<10\\end{{cases}}$$`

**Incorrect Patterns (currently handled by post-processing):**
- `$\\begin{{aligned}}...$\\end${{aligned}}$` (dollar signs inside commands)
- `\\begin{{aligned}}...\\end${{aligned}}` (mixed syntax)
- `$$\\begin{{cases}}x+y=5||x-y=3\\end{{cases}}$$` (using || instead of \\\\)

### Post-Processing

**Location:** `application/backend/main.py` lines 48-217 (`format_latex()`)

The `format_latex()` function currently normalizes LaTeX output:
- Converts `\[...\]` → `$$...$$` (block math)
- Converts `\(...\)` → `$...$` (inline math)
- Fixes malformed patterns (e.g., `$\begin${aligned}` → `\begin{aligned}`)
- Handles special environments (aligned, cases, array, matrix, etc.)
- Fixes line breaks (`||` → `\\`)

---

## Prompt Configuration

### Model Configuration

**LLM Provider:** Groq API  
**Primary Model:** `openai/gpt-oss-20b`  
**Location:** `application/backend/rag_groq_bot.py` line 30

**Current Configuration:**
```python
GROQ_MODEL = "openai/gpt-oss-20b"
```

**Usage:**
- Used in both RAG tutor and quiz generation
- Referenced in `rag_groq_bot.py` and `quiz_gen.py`

### Embedding Model Configuration

**Model:** SentenceTransformer `all-MiniLM-L6-v2`  
**Location:** `application/backend/rag_groq_bot.py` line 29

**Current Configuration:**
```python
EMBED_MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384  # Dimension of embeddings
```

**Current Characteristics:**
- 384-dimensional embeddings
- Fast inference
- Good balance between quality and speed
- Lazy loading to reduce memory usage

### Temperature Settings

**RAG Tutor:**
- Temperature: Not specified (uses model default)
- Allows creative but accurate responses

**Quiz Generation:**
- Temperature: 0.1
- Low temperature for consistency and accuracy
- Reduces variation in question quality

### Token Limits

**RAG Tutor:**
- Max Tokens: 3000
- Allows full explanations without truncation

**Quiz Generation:**
- Max Tokens: 3500
- Accommodates multiple questions with explanations

### Context Limits

**Vector Retrieval:**
- Top K: 3 documents (RAG Tutor)
- Top K: 12 documents (Quiz Generation)
- Context length: 9000 characters (Quiz Generation, truncated)

**Current Purpose:**
- Prevents token overflow
- Focuses on most relevant content
- Maintains response quality

---

## Current Implementation Summary

### RAG Tutor Pipeline

**Flow:**
1. User question received
2. Grade hint generated via `get_grade_hint(grade)`
3. Query embedded using SentenceTransformer
4. Vector search retrieves top 3 documents
5. System prompt: "You are a helpful K-12 tutor. {grade_hint}"
6. User prompt: "{question}\n\nContext: {context}"
7. Groq API called with messages
8. Response formatted with `format_latex()`
9. Final answer returned

### Quiz Generation Pipeline

**Flow:**
1. Topic, grade, difficulty, and question count received
2. Grade hint generated via `_grade_hint(grade)`
3. Query embedded: "{topic} grade {grade} difficulty {difficulty}"
4. Vector search retrieves top 12 documents
5. Context truncated to 9000 characters
6. System prompt constructed with grade hint and LaTeX rules
7. User prompt constructed with full LaTeX formatting instructions
8. Groq API called with JSON response format
9. Response parsed and normalized
10. LaTeX formatted in questions and explanations
11. Quiz items returned

### Grade Adaptation

**Current Implementation:**
- Grade boundaries: ≤2, ≤5, ≤8, ≤12, >12
- Five distinct hint messages
- Applied to both RAG and Quiz prompts
- Defaults to grade 5 if parsing fails

### LaTeX Handling

**Current Implementation:**
- Prompts include explicit LaTeX formatting rules
- Post-processing via `format_latex()` function
- Handles multiple LaTeX environments (aligned, cases, array, matrix, etc.)
- Fixes common malformed patterns
- Converts Groq-style LaTeX to KaTeX-compatible format
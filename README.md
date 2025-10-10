<div align="center">

<a name="readme-top"></a>

<!-- Project banner -->
<img width="220" alt="EduMate Logo" src="logo.png">

# ✨ **EduMate**

**K**nowledge-grounded  
**12**-grade aware  
**R**etrieval-**A**ugmented **G**eneration  
**Tutor • Quiz • Parent Dashboard**

*Making learning addictive — the right way.*

[![License](https://img.shields.io/badge/license-Apache_2.0-red?style=for-the-badge)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-009485?logo=fastapi&logoColor=white&style=for-the-badge)](#)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-121212?style=for-the-badge)](#)
[![ChatGPT](https://img.shields.io/badge/ChatGPT-00A67E?style=for-the-badge&logo=openai&logoColor=white)](https://chat.openai.com/)
[![React](https://img.shields.io/badge/React-20232a?logo=react&logoColor=61DAFB&style=for-the-badge)](#)

</div>

---

## 📑 Table of Contents
1. [Problem Statement and Why It Matters](#-problem-statement-and-why-it-matters)  
2. [Target Users and Core Tasks](#-target-users-and-core-tasks)  
3. [Competitive Landscape & AI Limitations](#-competitive-landscape--ai-limitations)  
4. [Literature Review](#-literature-review)  
5. [Initial Concept and Value Proposition](#-initial-concept-and-value-proposition)  
6. [Workflow Overview](#-workflow-overview)  
7. [Architecture Overview](#-architecture-overview)  
8. [License](#-license)

---

## 🆘 Problem Statement and Why It Matters
Students need **instant, reliable, grade-level help** outside class. Generic chatbots hallucinate and aren’t aligned to standards; parents rarely see **which skills improved** and **where their child struggles**.  
**EduMate** is a **RAG-grounded** tutor + quiz system that:
- explains **with LaTeX and examples**,
- generates **curriculum-aligned quizzes** with **auto-grading + rationales**, and
- provides a **Parent Dashboard** with **trends, gaps, and recommendations**.

---

## 🎯 Target Users and Core Tasks

| **User** | **Primary Goal** | **What EduMate Provides** |
|---|---|---|
| **K–12 Students** | Learn effectively with the right level of support | **S1 Structured Practice** with grade/topic selectors, AI-generated or custom questions, and phased solutions (Understand → Strategy → Step-by-step LaTeX → Verify → Alternates). |
| **Students uploading their work** | Get precise guidance on mistakes | **S2 Solution Feedback** with text/file uploads (OCR preview), “Hints-first” mode, or **Direct Answer** (if parent-enabled), plus error annotations and fix-it tips. |
| **Students preparing for tests** | Targeted practice and quick assessment | **S3 Quiz Generation** with grade-aware topics, **misconception-based distractors**, optional “Check Answer,” progress dots, and detailed results/explanations. |
| **Parents / Guardians** | Control the learning environment & see progress | **Parent Portal Controls:** toggle Direct Answer (S2), allow/disallow S1 question generation, **fix question count**, **lock difficulty**, set daily goals. **Dashboard:** accuracy over time, topic heatmap, time-on-task, recent activity; export summaries. |
| **After-school staff / Tutors** | Monitor groups and run structured practice | Quick-start quiz presets by grade/topic, view attempt summaries, downloadable reports, and visibility into parent-locked settings for consistent sessions. |

---

## 🏁 Competitive Landscape & AI Limitations

| Platform                  | Strengths                               | Limitations                                                                 |
|----------------------------|-----------------------------------------|------------------------------------------------------------------------------|
| **Khan Academy / Khanmigo** | Great pedagogy                         | Limited custom RAG sources and parent analytics                              |
| **ChatGPT / Gemini**       | Flexible                                | Ungrounded; not grade-tuned; no per-skill reporting                          |
| **Photomath / Socratic**   | Solid step-by-step solutions            | Not a full tutor with mastery tracking                                       |
| **Perplexity**             | Provides citations                      | Citations ≠ tutoring; lacks student model and practice loop                  |
| **EduMate’s Edge**         | Retrieval-grounded answers, grade-aware explanations, auto-graded quizzes, Parent Dashboard | Converts activity into insight and action |

---

## 📚 Literature Review

- Effective learning with a personal AI tutor: A case study
- ARTIFICIAL INTELLIGENCE (AI) IN EDUCATION: USING AI TOOLS FOR TEACHING AND LEARNING PROCESS
- Designing an AI driven intelligent Tutorial System
- Tutor CoPilot: A Human-AI Approach for Scaling Real-Time Expertise
- Intelligent Tutoring Systems Powered by Generative AI: Advancing Personalized Education and Overcoming Challenges
- A systematic review of AI-driven intelligent tutoring systems (ITS) in K-12 education
- AI Driven Tutoring vs. Human Teachers Examining the on Student Teacher Relationship
- Investigating dialogic interaction in K12 online one-on-one mathematics tutoring using AI and sequence mining techniques

---

## 🚀 Initial Concept and Value Proposition

EduMate is a next-generation AI-driven tutoring platform designed to bridge the growing gap in K–12 education by combining Retrieval-Augmented Generation (RAG), multi-agent orchestration, and student progress tracking. Unlike generic AI assistants that provide quick answers, EduMate is built around pedagogical depth: guiding students through concepts, verifying correctness, and ensuring lasting comprehension.

At its heart lies an Orchestrator Agent that dynamically routes user input into two learning pathways:

**Tutor Bot** – Interactive, conversational help where students can ask questions and receive step-by-step Socratic guidance.

**Quiz Module** – Automatically generated, adaptive quizzes tailored to the student’s grade level, difficulty preferences, and learning history.

Both pathways feed into a RAG pipeline that ensures reliable, curriculum-aligned answers by combining large language models (LLMs) with a structured K–12 knowledge base stored in ChromaDB.

### 🔑 Key Value Propositions:
1. **Personalized AI Tutoring**  
   - Uses retrieval from **K–12 ChromaDB knowledge base**.  
   - Answers are step-based, with explanations instead of shortcuts.  

2. **Integrated Quiz System**  
   - Dynamically generates quizzes by grade, topic, and difficulty.  
   - Auto-grades responses and provides detailed explanations.  

3. **Parent & Educator Dashboards**  
   - Tracks progress, highlights strengths/weaknesses.  
   - Builds trust that EduMate is *teaching*, not *cheating*.  

4. **Answer Quality Assurance**  
   - All outputs undergo quality checks (accuracy, grade alignment).  
   - Incorrect answers trigger corrective hints and re-learning loops.  

---

## 📊 Workflow Overview  

### 📌 Architecture Screenshot 

![EduMate System Flow](flowchart.png)

The EduMate architecture follows a structured Orchestrated + RAG-enabled pipeline designed to support tutoring and quiz-based learning:

## User Input
A student, parent, or staff member interacts with the system (e.g., asks a question, requests a quiz).

## Orchestrator
The Orchestrator agent classifies the task:

- If it’s a help request or question, it routes to the Tutor Bot.  
- If it’s a quiz request or answer submission, it routes to the Quiz Module.

## RAG Pipeline
Both paths leverage the RAG (Retrieval-Augmented Generation) pipeline for accuracy.

**Steps inside RAG:**
- **Embedding:** The query is embedded into vector form.  
- **ChromaDB Retrieval:** Relevant K–12 content (JSONL knowledge base) is fetched.  
- **LLM Processing:** An LLM uses the retrieved context to draft an answer.  
- **Answer Quality Checks:** The output is verified for factual correctness, grade-level suitability, and clarity.  

## Tutor Bot Path
- Provides step-by-step guidance, explanations, and hints instead of direct answers.  
- Uses LLM reinforcement for improving weak or unclear answers.  

## Quiz Path
- **Quiz Generation:** Creates adaptive questions based on topic, grade, and difficulty.  
- **Quiz Grader:** Evaluates student submissions, highlights correct/incorrect answers, and provides detailed explanations.  

## Feedback & Learning Loop
- **Correct answers** → reinforce progress and update student profile.  
- **Incorrect answers** → trigger corrective hints and explanations.  
- Parent/educator dashboards display weekly progress reports, quiz outcomes, and learning trends.  

## Output
- Students receive answers, quizzes, or reports.  
- Parents receive progress dashboards.  
- Educators receive tracking and grading support.  

---

## 🏗️ Architecture Overview

**Frontend (React)**  
- Tutor view (grade slider + LaTeX rendering)  
- Quiz view (generate → answer → check → submit)  
- Parent Dashboard (progress & recommendations)

**Backend (FastAPI)**  
- `/ask` → RAG answer (Groq + ChromaDB)  
- `/quiz/generate` → AI-generated MCQs (JSON-only)  
- `/quiz/grade` → scoring + rationales  
- `/parent/*` → progress summaries & suggestions

**RAG Pipeline**  
1. **Embed** query with `SentenceTransformer`  
2. **Retrieve** top-k from **ChromaDB (DuckDB+Parquet persist)**  
3. **Compose** with Groq (`openai/gpt-oss-20b`) + **grade hint**  
4. **Return** Markdown + LaTeX (`$$...$$` blocks, `$...$` inline)

**Data**  
- `Attempt(student_id, item_id, selected, is_correct, ts)`  
- `QuizItem(id, topic, grade, skill_tag, choices{A..D}, correct)`  
- `SessionLog(student_id, minutes, date)`

## 📝 License

Distributed under the **Apache 2.0** License. 

<div align="right">

[⬆️ Back to top](#readme-top)

</div>

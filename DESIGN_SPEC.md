# EduMate — Design Specification

> **Live Clickthrough Prototype:** https://v0-edu-mate-prototype.vercel.app/login  

---

## Overview

**EduMate** is an AI-powered learning platform offering structured problem-solving, intelligent feedback, and adaptive quiz generation for K–12 students. The system uses **Retrieval-Augmented Generation (RAG)** to deliver grade-appropriate guidance while enabling parents to monitor and customize student learning experiences.

**Prototype Screens (replace placeholders below):**
- Login: `![Login](resources/slogin.png)`
- Student Dashboard: `![Student Dashboard](resources/sdhboard.png)`
- Parent Dashboard: `![Parent Dashboard](resources/pdboard.png)`
- Profile: `![Profile](resources/profile.jpeg)`

---

## Core System Structure

### 1) Login Page (Entry Screen)
**Purpose:** Provide secure, role-based access.

**Options:**
- **Student Portal Login**
- **Parent Portal Login**

**Interactions:**
- User selects role and authenticates (username + password or OTP).
- On success, user is redirected to the respective dashboard.

**Screenshot(s):**
- `![Student Login Screen](resources/slogin.png)`
- `![Parents Login Screen](resources/plogin.png)`

---

## Student Portal — Main Dashboard

After login, the **Student Dashboard** presents **three primary modules:**
1. **S1 Structured Problem-Solving Practice**
2. **S2 AI-Powered Solution Feedback**
3. **S3 Mathematical Quiz Generation**

Each module is accessible via clearly labeled cards or buttons.

**Screenshot(s):**
- `![Student Dashboard](resources/sdboard.png)`

---

### 🧩 S1 Structured Problem-Solving Practice

**Purpose:**  
Guide students step-by-step through the full problem-solving cycle—from understanding and planning to execution, verification, and exploring alternate strategies.

**Workflow:**
1. **Select Grade:** Slider (1–12) or dropdown to set grade level.  
2. **Select Topic:** Dropdown auto-filtered by grade (Arithmetic, Fractions, Algebra, Geometry, etc.).  
3. **Enter or Generate Question:**  
   - **Option A:** Type a custom problem.  
   - **Option B:** Click **“Generate a Question”** for an AI-generated example.  
4. **Submit:** Student clicks **“Start Practice”**.  
5. **AI Response:** **Detailed, multi-phase solution** showing:  
   - Understanding the problem  
   - Planning strategy  
   - Step-by-step solution with LaTeX math  
   - Verification and alternate approaches  
`![Structured Problem-Solving Practice](resources/S1.png)`

**Output:**  
An interactive, scrollable explanation with **expandable sections** and **KaTeX** rendering.

---

### ✏️ S2 AI-Powered Solution Feedback

**Purpose:**  
Allow students to upload or input their own solutions and receive precise feedback on errors, logic steps, and final answers.

**Workflow:**
1. **Input Question:** Paste text or upload (PDF/image with OCR support).  
2. **Upload Student Solution:** File upload for solution (PDF/image/text).  
3. **Select Feedback Mode:**  
   - **Get Answer with Hints** (default)  
   - **Get Direct Answer** (if enabled by Parent Portal)  
4. **AI Evaluation and Response:**  
   - Compares student work to the correct solution.  
   - Provides guided feedback highlighting missteps and missing logic.  

**Parent Controls:**  
Parents can toggle **Direct Answer** availability in their dashboard.  
`![AI-Powered Solution Feedback](resources/S2.png)`

---

### 📊 S3 Mathematical Quiz Generation

**Purpose:**  
Generate multiple-choice math quizzes with **misconception-based distractors** to test conceptual understanding.

**Workflow:**
1. **Select Grade:** Slider (1–12).  
2. **Select Topic:** Topics auto-populate by grade.  
3. **Select Number of Questions:** Default 3–15; **can be locked/preset by parents**.  
4. **Select Difficulty:** Easy | Medium | Hard — **can be fixed in Parent Portal**.  
5. **Generate Quiz:** System creates custom quiz.  
6. **Interactive Quiz:** A–D options with instant feedback and progress tracking.  
7. **Results Summary:** Score, correct/incorrect answers, and explanations.  
`![Mathematical Quiz Generation](resources/S3.png)`

---

## Parent Portal — Dashboard and Controls

**Purpose:** Enable parents to manage student access, monitor progress, and adjust learning parameters.

### Parent Dashboard Features

#### 1) Control Panel
- **Toggle Direct Answer Access** (for S2)  
- **Set Fixed Question Count** (for S3)  
- **Lock Difficulty Level** (for S3)  
- **Enable/Disable Question Generation** (in S1)  
- **Set Daily Practice Limits or Goals**  

#### 2) Student Progress Tracking
- **Performance Charts:** Scores & accuracy over time.  
- **Engagement Metrics:** Time spent per module (S1, S2, S3).  
- **Topic-wise Progress:** Strengths & weaknesses by concept.  
- **Report Export:** Downloadable progress reports (PDF/CSV).

#### 3) Notifications and Insights
- Alerts for completed quizzes and AI feedback.  
- Recommendations for improvement based on patterns.

- `![Parent Dashboard](resources/pdboard.png)`

---

## Technical Architecture

### Frontend (React 19)
- **Framework:** React + Hooks (`useState`, `useContext`, `useMemo`)  
- **Styling:** Responsive CSS / Tailwind CSS  
- **Math Rendering:** **KaTeX** for LaTeX support  
- **State Management:** Context API + `localStorage` sync  
- **Routing:** React Router (Login, Student, Parent)

### Backend (FastAPI)
- **Framework:** FastAPI with async endpoints  
- **AI Integration:** Groq API for generation and grading  
- **RAG Engine:** ChromaDB for contextual content retrieval  
- **Embeddings:** Sentence-Transformers  
- **Storage:** PostgreSQL (users, results, preferences)  
- **Auth:** JWT-based role authentication (student / parent)  
- **CORS:** Configured for frontend access

---

## Data Flow

| Phase         | Process                                                             |
| :------------ | :------------------------------------------------------------------ |
| Login         | Auth via JWT → role redirect (Student/Parent)                       |
| S1            | Grade + Topic + Question → RAG retrieval → AI step-by-step solution |
| S2            | Question + Student Answer → AI comparison → error feedback          |
| S3            | Parameters → Quiz generation → User attempt → Score + Explanation   |
| Parent Portal | Fetch controls & progress from DB → display charts                  |
# EduMate - Project Guide

## Overview

EduMate is a K-12 AI-powered math tutoring platform with three core learning modules and parent controls. This is a **clickthrough prototype** with hardcoded demo data and no backend integration.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 with custom EduMate theme
- **Math Rendering:** KaTeX for LaTeX equations
- **State Management:** React Context + localStorage
- **Data:** Mock JSON fixtures with simulated API latency

## Project Structure

\`\`\`
/app
  /login          - Role-based authentication (student/parent)
  /student        - Student dashboard
    /s1           - Structured Problem-Solving Practice
    /s2           - AI-Powered Solution Feedback
    /s3           - Mathematical Quiz Generation
  /parent         - Parent dashboard with controls & analytics
  /profile        - User profile and settings

/components
  /ui             - shadcn/ui components (Button, Card, Input, etc.)
  nav-bar.tsx     - Main navigation with user menu

/store
  app-context.tsx - Global state (user, parent controls)

/mocks
  mock-service.ts - Simulated API functions
  /fixtures       - JSON data files

/utils
  latex.tsx       - KaTeX rendering utility
\`\`\`

## Color System

The EduMate brand uses a clean, educational palette:

- **Primary (Blue):** `#4BA3E2` - CTAs, focus states, branding
- **Navy:** `#1E2A4A` - Headings, icons, text emphasis
- **Leaf Green:** `#7DBA4F` - Success states, progress indicators
- **Sky Blue:** `#A3D7F7` - Info chips, light accents
- **Golden Yellow:** `#F2C94C` - Warnings, attention badges
- **Gray Line:** `#E6E9EF` - Borders, dividers
- **White:** `#FFFFFF` - Primary background (most surfaces)

## Getting Started

### Installation

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Demo Login

Use **any email and password** to log in. Select your role (Student or Parent) before logging in.

**Student Account:**
- Email: `student@demo.com`
- Password: `demo`
- Grade: 8

**Parent Account:**
- Email: `parent@demo.com`
- Password: `demo`

## Module Walkthrough

### S1: Structured Problem-Solving Practice

**Purpose:** Master math concepts with step-by-step guided solutions.

**Features:**
- Grade selector (1-12) with topic dropdown
- Manual question entry or AI generation
- 5-phase solution breakdown:
  1. Understand the Problem
  2. Develop a Strategy
  3. Step-by-Step Solution
  4. Verify the Answer
  5. Alternate Methods
- LaTeX rendering for mathematical notation
- Copy and save functionality

**Demo Flow:**
1. Select grade level (e.g., Grade 8)
2. Choose topic (e.g., "Algebra")
3. Click "Generate Question" or type your own
4. Click "Start Practice"
5. Expand/collapse solution phases
6. Save session to localStorage

### S2: AI-Powered Solution Feedback

**Purpose:** Get instant feedback on your work with error detection.

**Features:**
- Dual input: Question and Your Solution
- File upload with OCR preview (simulated)
- Two feedback modes:
  - **Answer with Hints** (default)
  - **Direct Answer** (can be disabled by parent)
- Detailed error analysis with line-by-line feedback
- Correctness indicator (green/yellow banner)
- Hints for improvement
- Feedback history saved to localStorage

**Demo Flow:**
1. Enter or upload a question
2. Enter or upload your solution attempt
3. Select feedback mode
4. Click "Submit for Feedback"
5. Review error analysis and hints
6. Try another problem or download PDF (coming soon)

**Parent Controls:**
- Can disable "Direct Answer" mode

### S3: Mathematical Quiz Generation

**Purpose:** Practice with adaptive quizzes tailored to your level.

**Features:**
- Configurable: grade, topic, question count (3-15), difficulty
- Progress dots showing answered questions
- Multiple choice with A-D options
- "Check Answer" for instant feedback per question
- Full quiz submission with results view
- Detailed explanations for each question
- Review mode after completion

**Demo Flow:**
1. Configure quiz settings (grade, topic, count, difficulty)
2. Click "Generate Quiz"
3. Answer questions (navigate with Previous/Next)
4. Optionally check individual answers
5. Submit quiz when all questions answered
6. Review results with explanations
7. Create new quiz or review questions

**Parent Controls:**
- Can fix question count (locks the input)
- Can lock difficulty level (easy/medium/hard)

## Parent Dashboard

**Purpose:** Monitor student progress and manage learning controls.

**Features:**
- **Learning Controls Panel:**
  - Toggle: Allow Direct Answer (S2)
  - Toggle: Allow Question Generation (S1)
  - Fixed Question Count (S3) - enable/disable + number input
  - Lock Difficulty (S3) - None/Easy/Medium/Hard
  - Daily Goal (minutes)
- **Analytics Panel:**
  - Key metrics: Accuracy, Study Time, Problems Solved, Active Days
  - Topic performance bars with accuracy percentages
  - Recent activity feed with scores and modules
- All settings persist to localStorage and immediately affect student views

**Demo Flow:**
1. Log in as parent
2. Adjust learning controls
3. Click "Save Settings"
4. Log out and log in as student to see restrictions applied
5. View analytics and recent activity

## Mock Data System

All data is stored in `/mocks/fixtures/*.json` and served through `/mocks/mock-service.ts` with simulated latency (300-800ms).

**Available Fixtures:**
- `topics-by-grade.json` - Grade → Topics mapping
- `sample-problems.json` - Pre-written problems by grade/topic
- `s1-solutions.json` - 5-phase solution template
- `s2-feedback.json` - Error analysis template
- `quizzes.json` - Sample quiz with 5 questions

**Mock Service Functions:**
- `getTopics(grade)` - Returns topic list
- `generateQuestion(grade, topic)` - Returns random problem
- `solveS1(payload)` - Returns 5-phase solution
- `submitS2(payload)` - Returns feedback with error map
- `generateQuiz(payload)` - Returns quiz object
- `submitQuizAttempt(attempt)` - Scores quiz locally

## localStorage Keys

The app persists data to localStorage:

- `edumate_user` - Current user session
- `edumate_parent_controls` - Parent settings
- `edumate_s1_sessions` - S1 practice history (last 20)
- `edumate_s2_history` - S2 feedback history (last 20)

## Accessibility Features

- Keyboard navigation throughout
- Visible focus rings (2px primary color)
- ARIA labels for sliders, radio groups, progress dots
- Screen reader announcements via `#announcer` div
- Semantic HTML (main, nav, labels)
- Skip-to-content support

### Performance Tips

- **Slow loading:** Mock services have 300-800ms simulated latency. This is intentional to mimic real API calls.
- **Large localStorage:** Clear old sessions periodically (only last 20 are kept automatically).
- **Browser compatibility:** Tested on Chrome, Firefox, Safari. Use latest versions for best experience.

### Getting Help

1. Check the `[v0]` debug logs in browser console
2. Verify you're logged in with the correct role
3. Try clearing localStorage and starting fresh
4. Review the mock data files in `/mocks/fixtures/`
5. Check that all imports are resolving correctly

---

**Built with ❤️ for K-12 learners**

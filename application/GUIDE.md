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

**Parent Controls:**
- Can disable "Generate Question" button

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

## Customization Guide

### Adding New Topics

Edit `/mocks/fixtures/topics-by-grade.json`:

\`\`\`json
{
  "8": ["Algebra", "Linear Equations", "Geometry", "Your New Topic"]
}
\`\`\`

### Adding Sample Problems

Edit `/mocks/fixtures/sample-problems.json`:

\`\`\`json
{
  "8-Your New Topic": [
    "Problem 1 text here",
    "Problem 2 text here"
  ]
}
\`\`\`

### Changing Theme Colors

Edit `/app/globals.css`:

\`\`\`css
--color-primary: #4BA3E2; /* Change to your brand color */
\`\`\`

### Adjusting Parent Controls

Edit `/store/app-context.tsx` to modify `defaultParentControls`.

## Known Limitations (Prototype)

- No real authentication or user management
- No actual AI/LLM integration
- OCR is simulated with placeholder text
- PDF download is a placeholder
- No real-time analytics or database
- Single student per parent account
- No email verification or password reset
- Charts are static (not using real data visualization)

## Next Steps for Production

1. **Backend Integration:**
   - Replace mock services with real API endpoints
   - Implement authentication (JWT, OAuth)
   - Set up database (PostgreSQL, MongoDB)

2. **AI Integration:**
   - Connect to LLM API (OpenAI, Anthropic, etc.)
   - Implement RAG for problem-solving
   - Add real OCR service (Tesseract, Google Vision)

3. **Enhanced Features:**
   - Multi-student support for parents
   - Real-time progress tracking
   - Email notifications
   - PDF export functionality
   - Advanced analytics with charts (Recharts)
   - Mobile responsive design

4. **Testing:**
   - Unit tests (Jest, React Testing Library)
   - E2E tests (Playwright, Cypress)
   - Accessibility audits (axe, Lighthouse)

## Support

For questions or issues with this prototype, refer to the code comments or mock data files. All functionality is self-contained and runs entirely in the browser.

## Troubleshooting

### Student Modules Not Working

If the student modules (S1, S2, S3) are not functioning:

**1. Check Browser Console**

Open Developer Tools (F12) and look for `[v0]` debug logs:
- `[v0] S1/S2/S3 Page mounted` - Confirms page loaded
- `[v0] Loading topics for grade: X` - Topics being fetched
- `[v0] Question generated` / `[v0] Solution received` - Data loading
- Any error messages in red

**2. Verify Login Status**

- Make sure you're logged in as a **student** (not parent)
- Check localStorage: Open DevTools → Application → Local Storage → look for `edumate_user`
- If missing or role is "parent", log out and log back in as student

**3. Check Mock Data Loading**

Open browser console and run:
\`\`\`javascript
// Test if topics load
fetch('/api/topics').catch(() => console.log('Mock service working'))

// Check localStorage
console.log('User:', localStorage.getItem('edumate_user'))
console.log('Controls:', localStorage.getItem('edumate_parent_controls'))
\`\`\`

**4. Parent Controls Blocking Features**

If buttons are disabled:
- **S1 "Generate Question" disabled:** Parent has turned off question generation
- **S2 "Direct Answer" disabled:** Parent has restricted this mode
- **S3 inputs locked:** Parent has fixed question count or locked difficulty

To reset parent controls:
\`\`\`javascript
// Run in browser console
localStorage.removeItem('edumate_parent_controls')
// Then refresh the page
\`\`\`

**5. KaTeX Math Rendering Issues**

If math equations don't display properly:
- Check that `katex/dist/katex.min.css` is imported
- Look for KaTeX errors in console
- Verify LaTeX syntax uses `$$` for display math and `$` for inline

**6. Clear All Data and Start Fresh**

\`\`\`javascript
// Run in browser console to reset everything
localStorage.clear()
location.reload()
\`\`\`

### Common Issues

**Issue:** "Redirecting to login" message appears
- **Solution:** You're not logged in or session expired. Go to `/login` and log in again.

**Issue:** Topics dropdown is empty
- **Solution:** Check console for errors. The mock data should load from `topics-by-grade.json`.

**Issue:** Loading spinner never stops
- **Solution:** Check console for JavaScript errors. The mock service might have failed.

**Issue:** Parent controls don't affect student view
- **Solution:** Log out and log back in as student. Controls are loaded on login.

**Issue:** Math equations show as raw LaTeX
- **Solution:** KaTeX CSS might not be loaded. Check Network tab for 404 errors.

### Debug Commands

Run these in the browser console to diagnose issues:

\`\`\`javascript
// Check current user
console.log('Current user:', JSON.parse(localStorage.getItem('edumate_user') || 'null'))

// Check parent controls
console.log('Parent controls:', JSON.parse(localStorage.getItem('edumate_parent_controls') || 'null'))

// View S1 session history
console.log('S1 sessions:', JSON.parse(localStorage.getItem('edumate_s1_sessions') || '[]'))

// View S2 feedback history
console.log('S2 history:', JSON.parse(localStorage.getItem('edumate_s2_history') || '[]'))

// Test mock service
import { getTopics } from '@/mocks/mock-service'
getTopics(8).then(topics => console.log('Topics for grade 8:', topics))
\`\`\`

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

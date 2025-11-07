# EduMate Use Cases and Critical Paths

This document outlines the critical user paths that are covered by E2E tests.

## Overview

EduMate is an AI-powered learning platform for K-12 students with three main learning modules and separate portals for students and parents.

## Critical Paths Tested

### 1. Authentication Flow

**Use Case:** User registration and login

**Critical Paths:**
- Home page redirects to login
- Login page displays with role selection (Student/Parent)
- Role switching functionality
- Invalid credentials show error
- Navigation between login and signup
- Signup form validation
- Password mismatch validation
- Successful account creation redirects to login

**Test File:** `e2e/auth.spec.ts`

### 2. Student Dashboard

**Use Case:** Student accesses their dashboard and navigates to learning modules

**Critical Paths:**
- Unauthenticated users are redirected to login
- Authenticated students see dashboard with welcome message
- Three learning modules are displayed:
  - S1: Structured Problem-Solving Practice
  - S2: AI-Powered Solution Feedback
  - S3: Mathematical Quiz Generation
- Navigation to each module from dashboard
- Progress stats section displays
- Recent activity section displays

**Test File:** `e2e/student-dashboard.spec.ts`

### 3. S1 Module - Structured Problem-Solving Practice

**Use Case:** Student practices structured problem-solving with step-by-step guidance

**Critical Paths:**
- Module page loads correctly
- Topic selection dropdown is available
- Manual question entry is possible
- Generate question button is available
- Start practice button is available
- Error handling for empty question submission

**Test File:** `e2e/s1-module.spec.ts`

### 4. S2 Module - AI-Powered Solution Feedback

**Use Case:** Student submits their solution and receives AI-powered feedback

**Critical Paths:**
- Module page loads correctly
- Question input field is available
- Solution input field is available
- Both fields can be filled with content
- Feedback mode selection (hints vs direct answer)
- Submit for feedback button is available
- Generate question button is available
- Error handling for missing question or solution

**Test File:** `e2e/s2-module.spec.ts`

### 5. S3 Module - Mathematical Quiz Generation

**Use Case:** Student generates and takes adaptive quizzes

**Critical Paths:**
- Module page loads correctly
- Quiz configuration options are available:
  - Topic selector
  - Difficulty selector
  - Question count input
- Generate quiz button is available
- Configuration form is displayed

**Test File:** `e2e/s3-module.spec.ts`

### 6. Parent Dashboard

**Use Case:** Parent monitors student progress and manages settings

**Critical Paths:**
- Unauthenticated users are redirected to login
- Authenticated parents see dashboard
- Student management section is displayed
- Parent controls section is displayed

**Test File:** `e2e/parent-dashboard.spec.ts`

## Test Execution

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### Test Configuration

Tests are configured in `playwright.config.ts`:
- Base URL: `http://localhost:3000` (or `PLAYWRIGHT_TEST_BASE_URL` env var)
- Browser: Chromium
- Auto-starts dev server before tests
- Screenshots on failure
- Trace on retry

## Test Coverage

These E2E tests provide **minimal coverage** of critical paths as required. They focus on:

1. **Navigation flows** - Ensuring users can move between pages
2. **Form interactions** - Validating input fields and buttons work
3. **Authentication** - Verifying login/signup flows
4. **Module access** - Confirming all three learning modules are accessible
5. **Error handling** - Basic validation error checks

## Future Enhancements

Additional test scenarios that could be added:
- Full end-to-end flows (e.g., complete quiz from start to finish)
- API integration tests
- Cross-browser testing
- Performance testing
- Accessibility testing
- Visual regression testing


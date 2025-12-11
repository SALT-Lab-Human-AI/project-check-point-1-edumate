# E2E Tests

This directory contains end-to-end (E2E) tests for EduMate using Playwright.

## Test Structure

- `auth.spec.ts` - Authentication flow tests (login/signup)
- `student-dashboard.spec.ts` - Student dashboard navigation tests
- `s1-module.spec.ts` - S1 module (Structured Problem-Solving) tests
- `s2-module.spec.ts` - S2 module (Solution Feedback) tests
- `s3-module.spec.ts` - S3 module (Quiz Generation) tests
- `parent-dashboard.spec.ts` - Parent dashboard tests

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

3. Ensure the backend is running (if testing with real API):
   ```bash
   npm run backend
   ```

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL**: `http://localhost:3000` (or set `PLAYWRIGHT_TEST_BASE_URL` env var)
- **Browser**: Chromium (default)
- **Auto-start**: Dev server starts automatically before tests
- **Screenshots**: Captured on test failure
- **Traces**: Captured on retry

## Test Strategy

These tests provide **minimal coverage** of critical paths:

1. **Navigation** - Users can navigate between pages
2. **Authentication** - Login/signup flows work correctly
3. **Module Access** - All three learning modules are accessible
4. **Form Interactions** - Input fields and buttons function
5. **Error Handling** - Basic validation works

## Writing New Tests

When adding new tests:

1. Use descriptive test names that explain what is being tested
2. Group related tests using `test.describe()`
3. Use helper functions for common setup (e.g., login)
4. Use `page.waitForTimeout()` sparingly; prefer `waitFor` with selectors
5. Clean up state between tests (clear localStorage, etc.)

Example:
```typescript
test('should do something specific', async ({ page }) => {
  await page.goto('/some-page');
  await expect(page.locator('selector')).toBeVisible();
});
```

## Debugging Tests

1. Use `--debug` flag to step through tests
2. Use `--headed` to see the browser
3. Use `--ui` for interactive test runner
4. Check `test-results/` for screenshots and traces
5. Use `page.pause()` in test code to pause execution

## CI/CD Integration

For CI environments:
- Set `CI=true` environment variable
- Tests will retry twice on failure
- Use single worker for stability
- Screenshots and traces are saved for debugging


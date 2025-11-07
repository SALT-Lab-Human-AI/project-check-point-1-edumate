import { test, expect } from '@playwright/test';

/**
 * S1 Module E2E Tests
 * Tests critical paths for Structured Problem-Solving Practice
 */

test.describe('S1 Module - Structured Problem-Solving Practice', () => {
  // Helper function to login and navigate to S1
  async function navigateToS1(page: any) {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('edumate_user', JSON.stringify({
        id: 'test-student-id',
        email: 'student@demo.com',
        name: 'Test Student',
        role: 'student',
        grade: 8
      }));
    });
    await page.goto('/student/s1');
  }

  test('should display S1 module page', async ({ page }) => {
    await navigateToS1(page);
    
    // Check page loads
    await expect(page).toHaveURL(/.*\/student\/s1/);
    // Check for key elements (topic selector, question input, etc.)
    await expect(page.locator('label')).toContainText(/topic|grade/i, { timeout: 10000 });
  });

  test('should allow topic selection', async ({ page }) => {
    await navigateToS1(page);
    
    // Wait for topic selector to load
    const topicSelector = page.locator('select, [role="combobox"]').first();
    await expect(topicSelector).toBeVisible({ timeout: 10000 });
  });

  test('should allow manual question entry', async ({ page }) => {
    await navigateToS1(page);
    
    // Find question input (textarea)
    const questionInput = page.locator('textarea').first();
    await expect(questionInput).toBeVisible({ timeout: 10000 });
    
    // Enter a question
    await questionInput.fill('Solve for x: 2x + 5 = 15');
    await expect(questionInput).toHaveValue('Solve for x: 2x + 5 = 15');
  });

  test('should have generate question button', async ({ page }) => {
    await navigateToS1(page);
    
    // Look for generate question button
    const generateButton = page.getByRole('button', { name: /generate/i });
    await expect(generateButton).toBeVisible({ timeout: 10000 });
  });

  test('should have start practice button', async ({ page }) => {
    await navigateToS1(page);
    
    // Look for start practice/solve button
    const solveButton = page.getByRole('button', { name: /start|solve|practice/i });
    await expect(solveButton).toBeVisible({ timeout: 10000 });
  });

  test('should show error when submitting empty question', async ({ page }) => {
    await navigateToS1(page);
    
    // Try to submit without question
    const solveButton = page.getByRole('button', { name: /start|solve|practice/i });
    await solveButton.click();
    
    // Should show error (may take a moment)
    await expect(page.locator('text=/please.*question|enter.*question/i')).toBeVisible({ timeout: 5000 });
  });
});


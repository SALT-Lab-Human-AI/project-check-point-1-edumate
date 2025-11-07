import { test, expect } from '@playwright/test';

/**
 * S2 Module E2E Tests
 * Tests critical paths for AI-Powered Solution Feedback
 */

test.describe('S2 Module - AI-Powered Solution Feedback', () => {
  // Helper function to login and navigate to S2
  async function navigateToS2(page: any) {
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
    await page.goto('/student/s2');
  }

  test('should display S2 module page', async ({ page }) => {
    await navigateToS2(page);
    
    // Check page loads
    await expect(page).toHaveURL(/.*\/student\/s2/);
    // Check for key elements
    await expect(page.locator('label')).toContainText(/question|solution/i, { timeout: 10000 });
  });

  test('should have question input field', async ({ page }) => {
    await navigateToS2(page);
    
    // Find question textarea
    const questionInput = page.locator('textarea').first();
    await expect(questionInput).toBeVisible({ timeout: 10000 });
    
    // Should have default or placeholder text
    const value = await questionInput.inputValue();
    expect(value.length).toBeGreaterThan(0);
  });

  test('should have solution input field', async ({ page }) => {
    await navigateToS2(page);
    
    // Find solution textarea (should be second textarea)
    const textareas = page.locator('textarea');
    const solutionInput = textareas.nth(1);
    await expect(solutionInput).toBeVisible({ timeout: 10000 });
  });

  test('should allow entering question and solution', async ({ page }) => {
    await navigateToS2(page);
    
    const questionInput = page.locator('textarea').first();
    const solutionInput = page.locator('textarea').nth(1);
    
    await questionInput.fill('Solve for x: 3x + 7 = 22');
    await solutionInput.fill('3x = 15\nx = 5');
    
    await expect(questionInput).toHaveValue('Solve for x: 3x + 7 = 22');
    await expect(solutionInput).toContainText('x = 5');
  });

  test('should have feedback mode selection', async ({ page }) => {
    await navigateToS2(page);
    
    // Look for radio buttons or select for feedback mode
    const modeSelector = page.locator('input[type="radio"], [role="radiogroup"]').first();
    await expect(modeSelector).toBeVisible({ timeout: 10000 });
  });

  test('should have submit for feedback button', async ({ page }) => {
    await navigateToS2(page);
    
    // Look for submit button
    const submitButton = page.getByRole('button', { name: /submit|feedback/i });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
  });

  test('should show error when submitting without question or solution', async ({ page }) => {
    await navigateToS2(page);
    
    // Clear inputs
    await page.locator('textarea').first().clear();
    await page.locator('textarea').nth(1).clear();
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /submit|feedback/i });
    await submitButton.click();
    
    // Should show error
    await expect(page.locator('text=/please.*question|enter.*solution/i')).toBeVisible({ timeout: 5000 });
  });

  test('should have generate question button', async ({ page }) => {
    await navigateToS2(page);
    
    // Look for generate question button
    const generateButton = page.getByRole('button', { name: /generate/i });
    await expect(generateButton).toBeVisible({ timeout: 10000 });
  });
});


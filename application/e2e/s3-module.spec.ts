import { test, expect } from '@playwright/test';

/**
 * S3 Module E2E Tests
 * Tests critical paths for Mathematical Quiz Generation
 */

test.describe('S3 Module - Mathematical Quiz Generation', () => {
  // Helper function to login and navigate to S3
  async function navigateToS3(page: any) {
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
    await page.goto('/student/s3');
  }

  test('should display S3 module page', async ({ page }) => {
    await navigateToS3(page);
    
    // Check page loads
    await expect(page).toHaveURL(/.*\/student\/s3/);
    // Check for key elements
    await expect(page.locator('label')).toContainText(/topic|difficulty|question/i, { timeout: 10000 });
  });

  test('should have quiz configuration options', async ({ page }) => {
    await navigateToS3(page);
    
    // Check for topic selector
    const topicSelector = page.locator('select, [role="combobox"]').first();
    await expect(topicSelector).toBeVisible({ timeout: 10000 });
    
    // Check for difficulty selector
    const difficultySelector = page.locator('input[type="radio"], [role="radiogroup"]').first();
    await expect(difficultySelector).toBeVisible({ timeout: 10000 });
  });

  test('should allow selecting question count', async ({ page }) => {
    await navigateToS3(page);
    
    // Look for question count input (number input or slider)
    const questionCountInput = page.locator('input[type="number"], input[type="range"]').first();
    await expect(questionCountInput).toBeVisible({ timeout: 10000 });
  });

  test('should have generate quiz button', async ({ page }) => {
    await navigateToS3(page);
    
    // Look for generate quiz button
    const generateButton = page.getByRole('button', { name: /generate.*quiz|start.*quiz/i });
    await expect(generateButton).toBeVisible({ timeout: 10000 });
  });

  test('should display quiz configuration form', async ({ page }) => {
    await navigateToS3(page);
    
    // Check that we're in config view
    await expect(page.getByText(/topic|difficulty|questions/i)).toBeVisible({ timeout: 10000 });
  });
});


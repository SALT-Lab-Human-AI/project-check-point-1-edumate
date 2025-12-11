import { test, expect } from '@playwright/test';

/**
 * Student Dashboard E2E Tests
 * Tests critical paths for student dashboard navigation and module access
 */

test.describe('Student Dashboard', () => {
  // Helper function to login as student
  async function loginAsStudent(page: any) {
    await page.goto('/login');
    await page.evaluate(() => {
      // Mock login by setting user in localStorage
      localStorage.setItem('edumate_user', JSON.stringify({
        id: 'test-student-id',
        email: 'student@demo.com',
        name: 'Test Student',
        role: 'student',
        grade: 8
      }));
    });
    await page.goto('/student');
  }

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/student');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display student dashboard after login', async ({ page }) => {
    await loginAsStudent(page);
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.getByText('Structured Problem-Solving Practice')).toBeVisible();
    await expect(page.getByText('AI-Powered Solution Feedback')).toBeVisible();
    await expect(page.getByText('Mathematical Quiz Generation')).toBeVisible();
  });

  test('should display three learning modules', async ({ page }) => {
    await loginAsStudent(page);
    
    // Check all three modules are visible
    const modules = [
      'Structured Problem-Solving Practice',
      'AI-Powered Solution Feedback',
      'Mathematical Quiz Generation'
    ];
    
    for (const module of modules) {
      await expect(page.getByText(module)).toBeVisible();
    }
  });

  test('should navigate to S1 module from dashboard', async ({ page }) => {
    await loginAsStudent(page);
    
    // Click on S1 module
    await page.getByRole('link', { name: 'Start Practice' }).first().click();
    await expect(page).toHaveURL(/.*\/student\/s1/);
  });

  test('should navigate to S2 module from dashboard', async ({ page }) => {
    await loginAsStudent(page);
    
    // Click on S2 module (second "Start Practice" button)
    const s2Button = page.getByRole('link', { name: 'Start Practice' }).nth(1);
    await s2Button.click();
    await expect(page).toHaveURL(/.*\/student\/s2/);
  });

  test('should navigate to S3 module from dashboard', async ({ page }) => {
    await loginAsStudent(page);
    
    // Click on S3 module (third "Start Practice" button)
    const s3Button = page.getByRole('link', { name: 'Start Practice' }).nth(2);
    await s3Button.click();
    await expect(page).toHaveURL(/.*\/student\/s3/);
  });

  test('should display progress stats section', async ({ page }) => {
    await loginAsStudent(page);
    
    // Check for progress section
    await expect(page.getByText('Your Progress')).toBeVisible();
    // Stats may be loading or empty, but section should exist
    await expect(page.getByText('Total Quizzes')).toBeVisible({ timeout: 10000 });
  });

  test('should display recent activity section', async ({ page }) => {
    await loginAsStudent(page);
    
    // Check for recent activity section
    await expect(page.getByText('Recent Activity')).toBeVisible();
  });
});


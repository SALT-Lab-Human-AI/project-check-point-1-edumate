import { test, expect } from '@playwright/test';

/**
 * Parent Dashboard E2E Tests
 * Tests critical paths for parent dashboard
 */

test.describe('Parent Dashboard', () => {
  // Helper function to login as parent
  async function loginAsParent(page: any) {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('edumate_user', JSON.stringify({
        id: 'test-parent-id',
        email: 'parent@demo.com',
        name: 'Test Parent',
        role: 'parent'
      }));
    });
    await page.goto('/parent');
  }

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/parent');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display parent dashboard after login', async ({ page }) => {
    await loginAsParent(page);
    
    // Check dashboard loads
    await expect(page).toHaveURL(/.*\/parent/);
    // Check for key sections (may take time to load)
    await expect(page.locator('h1, h2')).toContainText(/parent|dashboard|student/i, { timeout: 10000 });
  });

  test('should display student management section', async ({ page }) => {
    await loginAsParent(page);
    
    // Look for student-related content
    await expect(page.locator('text=/student|linked|account/i')).toBeVisible({ timeout: 10000 });
  });

  test('should display parent controls section', async ({ page }) => {
    await loginAsParent(page);
    
    // Look for controls/settings
    await expect(page.locator('text=/control|setting|preference/i')).toBeVisible({ timeout: 10000 });
  });
});


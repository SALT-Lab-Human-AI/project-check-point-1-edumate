import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests critical paths for login and signup flows
 */

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should redirect from home to login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should display login page with role selection', async ({ page }) => {
    await page.goto('/login');
    
    // Check page elements
    await expect(page.locator('h1')).toContainText('Welcome to EduMate');
    await expect(page.getByRole('button', { name: 'Student' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Parent' })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should switch between student and parent roles', async ({ page }) => {
    await page.goto('/login');
    
    // Default should be student
    const studentButton = page.getByRole('button', { name: 'Student' });
    const parentButton = page.getByRole('button', { name: 'Parent' });
    
    await expect(studentButton).toHaveAttribute('class', /default/);
    
    // Switch to parent
    await parentButton.click();
    await expect(parentButton).toHaveAttribute('class', /default/);
    
    // Switch back to student
    await studentButton.click();
    await expect(studentButton).toHaveAttribute('class', /default/);
  });

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.locator('input[type="email"]').fill('invalid@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to signup page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.locator('h1')).toContainText('Create Account');
  });

  test('should display signup form with student and parent sections', async ({ page }) => {
    await page.goto('/signup');
    
    // Check student section
    await expect(page.locator('text=Student Account')).toBeVisible();
    await expect(page.locator('input[id="studentName"]')).toBeVisible();
    await expect(page.locator('input[id="studentEmail"]')).toBeVisible();
    await expect(page.locator('input[id="studentPassword"]')).toBeVisible();
    
    // Check parent section
    await expect(page.locator('text=Parent Account')).toBeVisible();
    await expect(page.locator('input[id="parentName"]')).toBeVisible();
    await expect(page.locator('input[id="parentEmail"]')).toBeVisible();
    await expect(page.locator('input[id="parentPassword"]')).toBeVisible();
  });

  test('should validate signup form fields', async ({ page }) => {
    await page.goto('/signup');
    
    // Try to submit empty form
    await page.getByRole('button', { name: 'Create Accounts' }).click();
    
    // Should show validation error
    await expect(page.locator('text=Please fill in all student fields')).toBeVisible();
  });

  test('should validate password mismatch in signup', async ({ page }) => {
    await page.goto('/signup');
    
    // Fill student fields with mismatched passwords
    await page.locator('input[id="studentName"]').fill('Test Student');
    await page.locator('input[id="studentEmail"]').fill('student@test.com');
    await page.locator('input[id="studentPassword"]').fill('password123');
    await page.locator('input[id="confirmStudentPassword"]').fill('password456');
    
    // Fill parent fields
    await page.locator('input[id="parentName"]').fill('Test Parent');
    await page.locator('input[id="parentEmail"]').fill('parent@test.com');
    await page.locator('input[id="parentPassword"]').fill('password123');
    await page.locator('input[id="confirmParentPassword"]').fill('password123');
    
    await page.getByRole('button', { name: 'Create Accounts' }).click();
    
    // Should show password mismatch error
    await expect(page.locator('text=Student passwords do not match')).toBeVisible();
  });

  test('should navigate back to login from signup', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/.*\/login/);
  });
});


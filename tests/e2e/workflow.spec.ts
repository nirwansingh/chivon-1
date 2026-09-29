import { test, expect } from '@playwright/test';

test.describe('Chivon Full E2E Workflow', () => {
  test('smoke test: login and navigate', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    // Using the seeded Super Admin user
    await page.fill('input[type="email"]', 'super.admin@chivon.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);

    // 2. Customer Page
    await page.click('text=Customers');
    await expect(page).toHaveURL(/.*\/dashboard\/customers/);
    await expect(page.locator('h1')).toContainText('Customers');

    // 3. Products Page
    await page.click('text=Catalog'); // Might be under a menu
    await page.click('text=Products');
    await expect(page).toHaveURL(/.*\/dashboard\/products/);
    
    // 4. Quotations Page
    await page.click('text=Quotations');
    await expect(page).toHaveURL(/.*\/dashboard\/quotations/);
  });
});

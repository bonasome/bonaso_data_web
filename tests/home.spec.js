import { test } from './playwright.setup'; // your extended test
import { expect } from '@playwright/test';  // expect comes from Playwright directly

test('login and visit homepage', async ({ authPage: page, resetDB }) => {
    await expect(page.getByRole('heading', { name: 'Welcome, admin!' })).toHaveText('Welcome, admin!');
});

test('can favorite item and appears on homepage', async ({ authPage: page, resetDB }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    await page.getByRole('heading', { name: 'Project Details' }).click();
    await page.locator('button[aria-label="favorite"]').click();
    await page.goto('/');
    await page.getByRole('button', { name: /I understand/i }).click();
    await expect(page.getByRole('heading', { name: 'Test Project (for Client Org)'})).toBeVisible();
});

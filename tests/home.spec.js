import { test } from './playwright.setup'; // your extended test
import { expect } from '@playwright/test';  // expect comes from Playwright directly

/*
Test home page (login and favorites)
*/
test('login and visit homepage', async ({ authPage: page, resetDB }) => {
    //confirm home name displays on login with username
    await expect(page.getByRole('heading', { name: 'Welcome, admin!' })).toHaveText('Welcome, admin!');
});

test('can favorite item and appears on homepage', async ({ resetDB, authPage: page}) => {
    //Favorite a project and confirm its on the home page
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    await page.getByRole('heading', { name: 'Project Details' }).click();
    await page.locator('button[aria-label="favorite"]').click();
    await page.goto('/');
    await page.getByRole('button', { name: /I understand/i }).click();
    //confirm this displays a link
    await expect(page.getByRole('link', { name: 'Test Project (for Client Org)' })).toHaveAttribute('href', /\/projects\/\d+/);
});

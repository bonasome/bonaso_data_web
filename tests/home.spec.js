import { test } from './playwright.setup'; // your extended test
import { expect } from '@playwright/test';  // expect comes from Playwright directly

test('login and visit homepage', async ({ authPage: page }) => {
    await expect(page.getByRole('heading', { name: 'Welcome, admin!' })).toHaveText('Welcome, admin!');
});

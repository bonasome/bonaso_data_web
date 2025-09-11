import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 

test('indicator flow', async ({ authToken: page, resetDB }) => {
    await page.goto('http://localhost:5173/indicators');
    await page.waitForSelector('h1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('All Indicators');

    const createButton = page.getByRole('button', { name: /Create a New Indicator/i });
    await createButton.click();

    await page.fill('#code', `TEST101`);
    await page.fill('#name', '');
    await page.fill('#description', 'This is a test.');
    await page.locator('label[for="require_numeric"]').click();
    await page.locator('label[for="require_subcategories"]').click();

    await page.getByLabel('1.').fill('Category 1');
    const addRowButton = page.getByRole('button', { name: /Add Row/i });
    await addRowButton.click();
    await page.getByLabel('2.').fill('Category 2');
    await addRowButton.click();
    await page.getByLabel('3.').fill('');

    await page.click('button[type=submit]');

    await expect(page.getByRole('listitem')).toHaveText('Required');
    await page.fill('#name', 'Test Indicator');
    await page.click('button[type=submit]');

    await expect(page.getByText('Row "" is invalid')).toBeVisible();
    await page.getByLabel('3.').fill('Category 3');

    await page.click('button[type=submit]');

    await page.waitForURL(/\/indicators\/\d+$/),
    await page.waitForSelector('h1');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('TEST101: Test Indicator');

    await expect(page.getByText('Active, Respondent, Requires a number')).toBeVisible();
    await expect(page.getByText('This is a test')).toBeVisible();
    await expect(page.getByText('Category 1')).toBeVisible();
    await expect(page.getByText('Category 2')).toBeVisible();
    await expect(page.getByText('Category 3')).toBeVisible();

    await page.locator('button[aria-label="editdetails"]').click();
    await page.getByRole('button', { name: 'Deprecate' }).nth(2).click();
    await page.click('button[type=submit]');

    await expect(page.getByText('Category 3')).not.toBeVisible();
});
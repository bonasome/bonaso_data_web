import { test } from './playwright.setup'; 
import { expect } from '@playwright/test'; 

test('create indicator standalone', async ({ authPage: page, resetDB }) => {
    await page.goto('/indicators');
    await expect(page.getByRole('heading', { name: 'All Indicators' })).toBeVisible();

    await page.getByRole('button', { name: /Create a New Indicator/i }).click();

    await page.fill('#code', `C100`);
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
    await page.fill('#name', 'Test Create Indicator');
    await page.click('button[type=submit]');

    await expect(page.getByText('Row "" is invalid')).toBeVisible();
    await page.getByLabel('3.').fill('Category 3');

    await page.click('button[type=submit]');

    await page.waitForURL(/\/indicators\/\d+$/),
    await expect(page.getByRole('heading', { name: 'C100: Test Create Indicator' })).toBeVisible();

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

test('create indicator prereqs', async ({ authPage: page, resetDB }) => {
    await page.goto('/indicators');
    await expect(page.getByRole('heading', { name: 'All Indicators' })).toBeVisible();

    await page.getByRole('button', { name: /Create a New Indicator/i }).click();

    await page.fill('#code', `C101`);
    await page.fill('#name', 'Dependent Test');
    await page.fill('#description', 'This is a test.');

    await page.getByRole('button', { name: 'Select new items for Prerequisite Indicators', exact: true }).click();
    await page.getByRole('button', { name: 'Select T101: Test 1'}).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();

    await page.locator('label', { hasText: 'T101: Test 1' }).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click(); 

    await page.waitForURL(/\/indicators\/\d+$/),
    await expect(page.getByRole('heading',  { name: 'C101: Dependent Test' })).toBeVisible();

    await expect(page.getByText('Active, Respondent')).toBeVisible();
    await expect(page.getByText(/matched with T101/i)).toBeVisible();
    await expect(page.getByText('Cat 1')).toBeVisible();
    await expect(page.getByText('Cat 2')).toBeVisible();
    await expect(page.getByText('Cat 3')).toBeVisible();
});
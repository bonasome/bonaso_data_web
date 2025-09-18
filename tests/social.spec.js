import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a social post', async({ authPage: page, resetDB }) => {
    await page.goto('/social');
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible();

    await page.getByRole('button', { name: /Record a New Post/i }).click();
    await expect(page.getByRole('heading', { name: 'New Post' })).toBeVisible();

    await page.locator('#name').fill('Test Post Create');
    await page.getByRole('button', { name: /Select new items for Post/i}).click();
    await page.getByRole('button', { name: 'Select S101: Social' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();

    await page.locator('div[aria-label="anotherplatform"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Required', {exact: true})).toBeVisible();

    await page.locator('div[aria-label="facebook"]').click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Test Post Create' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('On Platform: Facebook')).toBeVisible();
    await page.locator('button[aria-label="editmetrics"]').click();
    await page.locator('#comments').fill('6');
    await page.locator('#views').fill('9');
    await page.locator('button[aria-label="savechanges"]').click();
    await expect(page.getByText('15')).toBeVisible();
});
import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a social post', async({ authPage: page, resetDB }) => {
    //test creating a social post and adding metrics
    await page.goto('/social');
    //go to page and click buttom
    await expect(page.getByRole('heading', { name: /Posts/i })).toBeVisible();
    await page.getByRole('button', { name: /Record a New Post/i }).click();
    await expect(page.getByRole('heading', { name: 'New Post' })).toBeVisible();
    //fill out fields and select a related task
    await page.locator('#name').fill('Test Post Create');
    await page.getByRole('button', { name: /Select new items for Post/i}).click();
    await page.getByRole('button', { name: 'Select S101: Social' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    //quick aside here to confirm that selecting other option will show a required text input that must be completed
    await page.locator('div[aria-label="anotherplatform"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Required', {exact: true})).toBeVisible(); //because no other was provided

    await page.locator('div[aria-label="facebook"]').click(); //select main platform

    await page.getByRole('button', { name: 'Save', exact: true }).click(); //save should work since other text input is no longer required
    //check detail page renders next
    await expect(page.getByRole('heading', { name: 'Test Post Create' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('On Platform: Facebook')).toBeVisible(); //with correct platform
    // edit the metrics here
    await page.locator('button[aria-label="editmetrics"]').click();
    await page.locator('#comments').fill('6');
    await page.locator('#views').fill('9');
    await page.locator('button[aria-label="savechanges"]').click();
    //expect total engagement to be visible
    await expect(page.getByText('15')).toBeVisible();
});
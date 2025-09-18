import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';

test('create a dashboard and TWO chart', async({ authPage: page, resetDB }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /New Dashboard/i })).toBeVisible();

    await page.locator('#name').fill('Test Dashboard');
    await page.getByRole('button', { name: 'Choose a new Project' }).click();
    await page.getByRole('button', { name: 'Test Project' }).click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await expect(page.getByRole('heading', { name: /New Dashboard/i })).not.toBeVisible();
    await page.getByRole('heading', { name: 'Test Dashboard' }).click();
    await expect(page.getByText('No charts yet. Add one!')).toBeVisible();

    //start by testing a chart with two indicators sbs
    await page.locator('button[aria-label="addchart"]').click();
    await page.getByRole('button', { name: /Select new items/i }).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    await page.getByRole('button', { name: 'Select T102: Test Dep' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    await page.locator('div[aria-label="linechart"]').click();
    await page.locator('label[for="axis__quarter"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click(); 
    await expect(page.getByRole('heading', { name: /Tracking Indicators T101: Test 1, T102: Test Dep/i })).toBeVisible({ timeout: 10000 });

    await page.locator('button[aria-label="addchart"]').click();
    await page.getByRole('button', { name: /Select new items/i }).click();
    await page.getByRole('button', { name: 'Select T103: Test Numeric Subcats' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    await page.locator('#name').fill('Numbers and Stuff')
    await page.locator('div[aria-label="barchart"]').click();
    await page.locator('label[for="axis__month"]').click();
    await page.locator('label[for="legend__subcategory"]').click();
    await page.locator('label[for="tabular"]').click();
    
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Numbers and Stuff/i })).toBeVisible({ timeout: 10000 });
    const container = await page.locator('#numbersandstuff')
    await container.getByRole('heading', { name: 'Show Filters' }).click();
    await container.getByRole('heading', { name: 'Age Range' }).click();
    await container.locator('label[for="age_range-1_4"]').click();
    await expect(container.getByText(/No data yet/i)).toBeVisible({ timeout: 10000 });
    await container.getByRole('heading', { name: 'Age Range' }).click();
    await container.locator('label[for="age_range-25_29"]').click();
    await expect(container.getByRole('cell', { name: '10', timeout: 10000 })).toBeVisible();
});

test('create a pivot table', async({ authPage: page, resetDB }) => {
    await page.goto('/analytics/tables');
    await expect(page.getByRole('heading', { name: /Pivot Table Settings/i })).toBeVisible();
    await page.getByRole('button', { name: 'Choose a new Indicator' }).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    await page.locator('label[for="param_names-sex"]').click();
    await page.locator('label[for="param_names-subcategory"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('heading', { name: /Pivot Table for Indicator T101/i }).click();
    await expect(page.getByRole('cell', { name: '1', exact: true, timeout: 10000 })).toBeVisible();
});

test('create a line list', async({ authPage: page, resetDB }) => {
    await page.goto('/analytics/lists');
    await expect(page.getByRole('heading', { name: /Line List Settings/i })).toBeVisible();
    await page.locator('#name').fill('Test Line List');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('heading', { name: /Test Line List/i }).click();
    await expect(page.getByRole('cell', { name: '1', exact: true, timeout: 10000 })).toBeVisible();
    const row = await page.getByText('Female', {exact: true}); 
    await expect(row).toHaveCount(3);
});
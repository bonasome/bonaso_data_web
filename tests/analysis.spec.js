import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';

/*
Basic tests that handle the analysis segment (dashboards, pivot tables, line lists)
*/

test('create a dashboard and TWO chart', async({ authPage: page, resetDB }) => {
    await page.goto('/analytics');
    await expect(page.getByRole('heading', { name: /New Dashboard/i })).toBeVisible();
    //create dashboard
    await page.locator('#name').fill('Test Dashboard');
    await page.getByRole('button', { name: 'Choose a new Project' }).click();
    await page.getByRole('button', { name: 'Test Project' }).click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();

    //click on dashboard, confirm it displays placeholder text
    await expect(page.getByRole('heading', { name: /New Dashboard/i })).not.toBeVisible();
    await page.getByRole('heading', { name: 'Test Dashboard' }).click();
    await expect(page.getByText('No charts yet. Add one!')).toBeVisible();

    //start by testing a line chart with two indicators sbs
    await page.locator('button[aria-label="addchart"]').click();
    await page.getByRole('button', { name: /Select new items/i }).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    await page.getByRole('button', { name: 'Select T102: Test Dep' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    await page.locator('div[aria-label="linechart"]').click();
    await page.locator('label[for="axis__quarter"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click(); 
    //confirm chart exists (no name should default to this)
    await expect(page.getByRole('heading', { name: /Tracking Indicators T101: Test 1, T102: Test Dep/i })).toBeVisible({ timeout: 10000 });

    //try creating bar chart with axis/legend
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

    //confirm chart exists (given name should be displayed)
    await expect(page.getByRole('heading', { name: /Numbers and Stuff/i })).toBeVisible({ timeout: 10000 });
    // try basic filters
    const container = await page.locator('#numbersandstuff')
    await container.getByRole('heading', { name: 'Show Filters' }).click();
    await container.getByRole('heading', { name: 'Age Range' }).click();
    await container.locator('label[for="age_range-1_4"]').click();
    await expect(container.getByText(/No data yet/i)).toBeVisible({ timeout: 10000 }); //based on wiped DB this should return no data, which should display no data
    await container.getByRole('heading', { name: 'Age Range' }).click();
    await container.locator('label[for="age_range-25_29"]').click(); //this should have a valid interaction and display a 10 in the data table
    await expect(container.getByRole('cell', { name: '10', timeout: 10000 })).toBeVisible();
});

test('create a pivot table', async({ authPage: page, resetDB }) => {
    //test creating a pivot table
    await page.goto('/analytics/tables');
    await expect(page.getByRole('heading', { name: /Pivot Table Settings/i })).toBeVisible();
    await page.getByRole('button', { name: 'Choose a new Indicator' }).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    //test with two params
    await page.locator('label[for="param_names-sex"]').click();
    await page.locator('label[for="param_names-subcategory"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('heading', { name: /Pivot Table for Indicator T101/i }).click();
    // test DB should have one result for this
    await expect(page.getByRole('cell', { name: '1', exact: true, timeout: 10000 })).toBeVisible();
});

test('create a line list', async({ authPage: page, resetDB }) => {
    //test creating a list list
    await page.goto('/analytics/lists');
    await expect(page.getByRole('heading', { name: /Line List Settings/i })).toBeVisible();
    await page.locator('#name').fill('Test Line List');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.getByRole('heading', { name: /Test Line List/i }).click();
    await expect(page.getByRole('cell', { name: '1', exact: true, timeout: 10000 })).toBeVisible();
    //confirm three rows (all are female/anon)
    const row = await page.getByText('Female', {exact: true}); 
    await expect(row).toHaveCount(3);
});
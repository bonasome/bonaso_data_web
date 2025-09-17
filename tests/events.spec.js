import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create an event', async({ authPage: page, resetDB }) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();

    await page.getByRole('button', { name: /Create a New Event/i }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();

    await page.locator('#name').fill('Test Event Create');
    await page.locator('#start').fill('2025-04-01');
    await page.locator('#end').fill('2025-04-01');
    await page.locator('#location').fill('Da Place');
    await page.getByRole('button', { name: 'Choose a new Host'}).click();
    await page.getByRole('button', { name: 'Select Parent Org' }).click();
    await page.locator(`label[for="status__completed"]`).click();
    await page.locator(`label[for="event_type__walkathon"]`).click();

    await page.getByRole('button', { name: 'Select new items for Linked to Tasks'}).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    await page.getByRole('button', { name: 'Select T102: Test Dep' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Test Event Create' })).toBeVisible({ timeout: 10000 });
});

test('can create count w/ appropriate flags' ,async({ authPage: page, resetDB}) => {
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();
    await page.getByRole('link', { name: `Test Event` }).click();
    await expect(page.getByRole('heading', { name: 'Select a task to start adding counts.'})).toBeVisible();
    const taskSelect = page.getByRole('combobox', { name: 'Select a Task' });
    console.log(await page.locator('select >> option').allInnerTexts());
    await expect(taskSelect).toBeVisible();
    await taskSelect.selectOption({ label: 'T101: Test 1 (Parent Org, Test Project (for Client Org))' });

    // Now wait for the form label
    const sexLabel = page.locator('label[for="sex"]');
    await expect(sexLabel).toBeVisible();
    await sexLabel.click();
    await page.locator(`label[for="age_range"]`).click();
    await page.locator('#0').fill('8');
    await page.locator('#10').fill('9');
    await page.locator('#20').fill('10');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Counts for T101: Test 1' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'By Age Range, Sex, Subcategory'})).toBeVisible({ timeout: 10000});

    await page.selectOption('select#task', { label: 'T102: Test Dep (Parent Org, Test Project (for Client Org))' });
    await page.locator(`label[for="sex"]`).click();
    await page.locator(`label[for="age_range"]`).click();
    await page.locator('#0').fill('10');
    await page.locator('#10').fill('8');
    await page.locator('#20').fill('9');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Counts for T102: Test Dep' })).toBeVisible({ timeout: 10000 });
    await page.getByRole('heading', { name: 'Counts for T102: Test Dep' }).click();
    const container = await page.locator('#t102:testdep(parentorg,testproject(forclientorg))')
    await expect(container.getByRole('heading', { name: 'FLAGGED' })).toBeVisible();
    await container.getByRole('strong', { name: '11' }).click();
    await page.getByRole('heading', { name: 'Flag on Event Count 11' }).click();
    await expect(page.getByText(/The amount of this count is greater than its corresponding prerequisite/i)).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click();
    await container.locator('button[aria-label="edit"]').nth(1).click();
    await page.locator('#0').fill('7');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('This interaction has had flags in the past. You can view flag history by clicking on a number below.')).toBeVisible();

})
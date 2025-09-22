import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';

/*
Test event and count creation/flagging.
*/

test('create an event', async({ authPage: page, resetDB }) => {
    //test creating an event
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();

    await page.getByRole('button', { name: /Create a New Event/i }).click();
    await expect(page.getByRole('heading', { name: 'New Event' })).toBeVisible();
    //fill out fields
    await page.locator('#name').fill('Test Event Create');
    await page.locator('#start').fill('2025-04-01');
    await page.locator('#end').fill('2025-04-01');
    await page.locator('#location').fill('Da Place');
    await page.getByRole('button', { name: 'Choose a new Host'}).click();
    await page.getByRole('button', { name: 'Select Parent Org' }).click();
    await page.locator(`label[for="status__completed"]`).click();
    await page.locator(`label[for="event_type__walkathon"]`).click();
    //add two tasks
    await page.getByRole('button', { name: 'Select new items for Linked to Tasks'}).click();
    await page.getByRole('button', { name: 'Select T101: Test 1' }).click();
    await page.getByRole('button', { name: 'Select T102: Test Dep' }).click();
    await page.getByRole('button', { name: 'Done Selecting' }).click();
    
    // confirm that the user was redirected to the detail page
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Test Event Create' })).toBeVisible({ timeout: 10000 });
});

test('can create count w/ appropriate flags' ,async({ authPage: page, resetDB}) => {
    //test creating counts and confirm that flags work
    //FYI, this test is flaky with the loading screens, could probably be improved
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();
    await page.getByRole('link', { name: `Test Event` }).click();
    await expect(page.getByRole('heading', { name: 'Select a task to start adding counts.'})).toBeVisible();
    //select a task
    //this is awful code, but the filter will reset this in the miliseconds after load, setting it multiple times works
    await page.selectOption('select#task', { label: 'T101: Test 1 (Parent Org, Test Project (for Client Org))' });
    await page.selectOption('select#task', { label: 'T101: Test 1 (Parent Org, Test Project (for Client Org))' });
    await page.selectOption('select#task', { label: 'T101: Test 1 (Parent Org, Test Project (for Client Org))' });
    await expect(page.locator('select#task')).toHaveValue('1');
    await expect(page.getByText('Sex')).toBeVisible({ timeout: 15000 })
    // select sex and age range breakdowns
    const sexLabel = page.locator('label[for="sex"]');
    await expect(sexLabel).toBeVisible();
    await sexLabel.click();
    await page.locator(`label[for="age_range"]`).click();
    //fill three random inputs
    await page.locator('[id="0"]').fill('8');
    await page.locator('[id="10"]').fill('9');
    await page.locator('[id="20"]').fill('10');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //check for api to refresh and display loading then disappear
    await expect(page.getByRole('heading', { name: /loading data/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /loading data/i })).toBeHidden({ timeout: 20000 });
    //confirm count was created
    await expect(page.getByRole('heading', { name: 'Counts for T101: Test 1' })).toBeVisible();

    //select another task & confirm value (should have the prior task as prereq for verifying flags)
    await page.selectOption('select#task', { label: 'T102: Test Dep (Parent Org, Test Project (for Client Org))' });
    await expect(page.locator('select#task')).toHaveValue('2');
    //select same breakdowns as above (age range and sex)
    await page.locator(`label[for="sex"]`).click();
    await page.locator(`label[for="age_range"]`).click();
    //fill random values, make sure the 0 index is higher than the 0 index in the previous task to trigger a flag
    await page.locator('[id="0"]').fill('10');
    await page.locator('[id="10"]').fill('8');
    await page.locator('[id="20"]').fill('9');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //same drill
    await expect(page.getByText(/loading data/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /loading data/i })).toBeHidden({ timeout: 20000 });
    await expect(page.getByRole('heading', { name: 'Counts for T102: Test Dep' })).toBeVisible({ timeout: 10000 });

    //expand the task segment
    await page.getByRole('heading', { name: 'Counts for T102: Test Dep' }).click();
    //localize searches to correct count div
    const container = page.locator('[id="t102:testdep(parentorg,testproject(forclientorg))"]');
    //confirm that a flagged warning appears
    await expect(container.getByRole('heading', { name: 'FLAGGED' })).toBeVisible();
    //click this cell to expand flag details
    await container.getByText('10', { exact: true }).click();
    //confirm correct flag heading/reason
    await page.getByRole('heading', { name: /Flag on Event Count 10/i }).click();
    await expect(page.getByText(/The amount of this count is greater than its corresponding prerequisite/i)).toBeVisible();
    await page.getByRole('button', { name: 'Close' }).click(); //close modal
    await expect(page.getByText(/loading data/i)).toBeVisible(); //this will refresh the API (consider updating this)
    await expect(page.getByRole('heading', { name: /loading data/i })).toBeHidden({ timeout: 20000 });
    await page.getByRole('heading', { name: 'Counts for T102: Test Dep' }).click();

    //edit the count and reduce the number in cell 0 to resolve the flag (less than cell 0 of the prerequsiite count)
    await container.locator('button[aria-label="edit"]').click();
    await page.locator('[id="0"]').fill('6');
    await page.getByRole('button', { name: 'Save', exact: true }).click({ timeout: 20000 });
    await expect(page.getByText(/loading data/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /loading data/i })).toBeHidden({ timeout: 20000 });
    await page.getByRole('heading', { name: 'Counts for T102: Test Dep' }).click();
    //click and confirm the flag was resolved
    await expect(page.getByText('This interaction has had flags in the past. You can view flag history by clicking on a number below.')).toBeVisible();

})
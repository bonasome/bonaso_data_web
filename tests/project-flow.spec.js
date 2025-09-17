import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a project', async({ authPage: page, resetDB }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();

    await page.getByRole('button', { name: /Create New Project/i }).click();
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    await page.locator('#name').fill('Test Project Create');
    await page.locator('#description').fill('This is a test.');
    await page.locator('#start').fill('2024-01-01');
    await page.locator('#end').fill('2024-12-31');
    await page.locator(`label[for="status__Active"]`).click();

    await page.getByRole('button', { name: 'Choose a New Client'}).click();

    await page.getByRole('button', { name: 'Select Client Org'}).click();

    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Test Project Create' })).toBeVisible();
    console.log('Project created.')
});

const goToOrg = async(page, org='Parent Org', proj='Test Project') => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    //navigate to project page
    await page.getByRole('link', { name: `${proj}` }).click();
    await page.getByRole('heading', { name: 'Organizations' }).click();
    await page.getByRole('link', { name: `${org}` }).click();
    await expect(page.getByRole('heading', { name: `Viewing Page for ${org} for ${proj}` })).toBeVisible();
}

test('assign an org to a project and navigate to org page', async({ authPage: page, resetDB }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
    //navigate to project page
    await page.getByRole('link', { name: 'Test Project' }).click();
    await page.getByRole('heading', { name: 'Organizations' }).click();
    await page.getByRole('button', {name: 'Add Organization(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Test Project'}).click();
    await page.getByRole('button', {name: 'Select Unassigned Org'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Organization(s)'}).click();
    await page.getByRole('link', { name: 'Unassigned Org' }).click();
    await expect(page.getByRole('heading', { name: 'Viewing Page for Unassigned Org for Test Project' })).toBeVisible();
});

test('assign a task to an org', async({ authPage: page, resetDB }) => {
    await goToOrg(page, 'Other Org')
    await page.getByRole('heading', { name: 'Tasks for Other Org' }).click();
    await page.getByRole('button', {name: 'Assign New Task(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click();
    await page.getByRole('button', {name: 'Select T102: Test Dep'}).click();
    await page.getByRole('button', {name: 'Select T103: Test Numeric Subcats'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Task(s)'}).click();
    await expect(page.getByText('Successfully assigned 2 new tasks to Other Org!')).toBeVisible({ timeout: 10000 });
    const container = page.locator('#tasks');
    await expect(container).toContainText(/T102: Test Dep/i);
    await expect(container).toContainText(/T103: Test Numeric Subcats/i);
});

test('create targets', async({ authPage: page, resetDB }) => {
    await goToOrg(page);
    await page.getByRole('heading', { name: 'Targets' }).click();
    await page.getByRole('button', {name: 'New Target'}).click();
    await expect(page.getByRole('heading', { name: 'New Target' })).toBeVisible();
    await page.getByRole('button', {name: 'Choose a new Task'}).click();
    await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
    await page.locator('#amount').fill('100');
    await page.locator('label[for="date_type__quarter"]').click();
    await page.locator('label[for="quarter__Q1 2025"]').click();
    await page.getByRole('button', {name: 'Save and Create Another', exact: true}).click();

    await expect(page.getByText('Target created successfuly!')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', {name: 'Choose a new Task'}).click();
    await page.getByRole('button', {name: 'Select T102: Test Dep'}).click();
    await page.locator('label[for="as_percentage"]').click();
    await page.getByRole('button', {name: 'Choose a new Related To'}).click();
    await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
    await page.locator('#percentage_of_related').fill('75');
    await page.locator('label[for="date_type__quarter"]').click();
    await page.locator('label[for="quarter__Q1 2025"]').click();
    await page.getByRole('button', {name: 'Save', exact: true}).click();

    await page.getByRole('heading', { name: 'Targets' }).click();
    const container = page.locator('#targets');
    await expect(container).toContainText(/T101: Test 1/i);
    await container.getByRole('heading', { name: /T101: Test 1/i }).click();
    await expect(container).toContainText(/1 of 100/i);
    await expect(container).toContainText(/T102: Test Dep/i);
    await container.getByRole('heading', { name: /T102: Test Dep/i }).click();
    await expect(container).toContainText(/1 of 1/i); 
    await expect(container).toContainText('Measured as 75% of T101: Test 1')
})

test('assign a subgrantee to an org', async({ authPage: page, resetDB }) => {
    await goToOrg(page, 'Other Org')
    await page.getByRole('heading', { name: 'Subgrantees' }).click();
    await page.getByRole('button', {name: 'Assign New Subgrantee(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click({ timeout: 10000 });
    await page.getByRole('button', {name: 'Add an Organization'}).click();
    await expect(page.getByRole('heading', { name: 'New Organization' })).toBeVisible();
    await page.locator('#name').fill('New Subgrantee');
    await page.getByRole('button', {name: 'Save', exact: true}).click({ timeout: 10000 });
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click({ timeout: 10000 });
    await page.getByRole('button', {name: 'Select New Subgrantee'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Subgrantee(s)'}).click();
    await expect(page.getByText('Successfully assigned 1 new subgrantees.')).toBeVisible();
});

test('create project activity', async({ authPage: page, resetDB }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    await page.getByRole('heading', { name: 'Activities' }).click();
    await page.getByRole('button', {name: 'New Activity'}).click();
    await page.locator('#name').fill('Test Activity');
    await page.locator('#start').fill('2025-03-01');
    await page.locator('#end').fill('2025-03-05');
    await page.locator('label[for="status__Completed"]').click();
    await page.locator('label[for="category__general"]').click();
    await page.locator('label[for="visible_to_all"]').click();
    await page.getByRole('button', {name: 'Save'}).click();
    await page.getByRole('heading', { name: 'Activities' }).click({ timeout: 10000 });
    await page.getByRole('heading', { name: 'Test Activity' }).click();
    await expect(page.getByText('March 1, 2025 to March 5, 2025')).toBeVisible();
});

test('create project deadline', async({ authPage: page, resetDB }) => {
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    await page.getByRole('heading', { name: 'Deadlines' }).click();
    await page.getByRole('button', {name: 'New Deadline'}).click();
    await page.locator('#name').fill('Test Deadline');
    await page.locator('#deadline_date').fill('2025-03-30');
    await page.locator('label[for="visible_to_all"]').click();
    await page.getByRole('button', {name: 'Save'}).click();
    await page.getByRole('heading', { name: 'Deadlines' }).click({ timeout: 10000 });
    await page.getByRole('heading', { name: 'Test Deadline' }).click();
    await expect(page.getByText('Due: March 30, 2025')).toBeVisible();
});
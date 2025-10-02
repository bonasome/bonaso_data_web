import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';

const changeAccounts = async (page, username='manager', password='testpass123') => {
    const tab = await page.getByRole('link', { name: /admin/i });
    await tab.hover();
    await page.getByRole('link', { name: /logout/i }).click();
    await expect(page.getByRole('heading', {name: 'Welcome Back'})).toBeVisible();
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.getByRole('button', {name: 'Login'}).click({ timeout: 20000 });

    await page.getByRole('button', { name: /I understand/i }).click({ timeout: 30000 });
}

test('test m&e/manager user creation', async({ resetDB, authPage: page }) => {
    await changeAccounts(page, 'manager')
    //test general user creation/activation
     await page.goto('/profiles');
    //go to user page
    await expect(page.getByRole('heading', { name: /Team/i })).toBeVisible({ timeout: 15000 });
    //click the add user button
    await page.getByRole('button', { name: /Add New Team Member/i }).click();
    //should be on create page
    await expect(page.getByRole('heading', { name: 'New User' })).toBeVisible();
    //fill out the form
    await page.locator('#username').fill('Test Event Create');
    await page.locator('#password').fill('testpass123');
    await page.locator('#confirm_password').fill('testpass123');
    await page.locator('#first_name').fill('Quackadily');
    await page.locator('#last_name').fill('Blip');
    //click through admin/meofficer/manager roles and confirm they show warnings
    await page.locator(`label[for="role__meofficer"]`).click();
    await expect(page.getByText(/You are about to make this user a Monitoring and Evaluation Officer/i)).toBeVisible();
    await expect(page.getByText(/Site Administrator/i)).not.toBeVisible();
    await page.getByRole('button', { name: 'Choose a new Organization'}).click();
    await expect(page.getByRole('heading', { name: 'Parent Org' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Child Org' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Other Org' })).not.toBeVisible();
    await page.getByRole('button', { name: 'Select Child Org' }).click();
    //try saving
    await page.getByRole('button', { name: 'Save', exact: true }).click({ timeout: 25000 });
    //should be on the detail page
    await expect(page.getByRole('heading', { name: 'Quackadily Blip' })).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('User is inactive')).toBeVisible(); //users should be inactive by default
    await expect(page.locator('button[aria-label="activateuser"]')).toHaveCount(0);
    await expect(page.locator('button[aria-label="resetuserpassword"]')).toHaveCount(0);
});

const projectNav = async (page) => {
    await changeAccounts(page, 'manager');
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: 'Test Project' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Normies Should Not See This' })).not.toBeVisible();
    await page.getByRole('heading', { name: 'Test Project' }).click();

    await page.getByRole('heading', { name: 'Organizations' }).click();
}

test('test m&e/manager self project view', async({ resetDB, authPage: page }) => {
    await projectNav(page);
    await expect(page.getByRole('heading', { name: 'Other Org' })).not.toBeVisible();
    await page.getByRole('heading', { name: 'Parent Org' }).click();
    await page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project'});
    await page.getByRole('heading', { name: 'Tasks for Parent Org' }).click();
    await expect(page.getByRole('heading', { name: 'T101: Test 1 (Parent Org, Test Project (for Client Org))'})).toBeVisible();
    await expect(page.getByRole('button', {name: 'Assign New Task(s)'})).not.toBeVisible();

    await page.getByRole('heading', { name: 'Targets for Parent Org' }).click();
    await expect(page.getByText('No targets yet.')).toBeVisible();
    await expect(page.getByRole('button', {name: 'New Target'})).not.toBeVisible();

    await page.getByRole('heading', { name: 'Subgrantees' }).click();
    await expect(page.getByRole('heading', {name: 'Child Org'})).toBeVisible();
    await page.getByRole('button', {name: 'Assign New Subgrantee(s)'}).click();
    await page.getByRole('button', {name: 'Select New items for Parent Org'}).click();
    await expect(page.getByRole('heading', { name: 'Unassigned Org'})).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Other Org'})).not.toBeVisible();
    await page.getByRole('button', {name: 'Select Unassigned Org'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Subgrantee(s)'}).click();
    //confirm they were assigned and a message confirms success
    await expect(page.getByText('Successfully assigned 1 new subgrantees.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Unassigned Org'})).toBeVisible();
});
    
test('test m&e/manager subgrantee project view + assign task', async({ resetDB, authPage: page }) => {
    await projectNav(page);
    await page.getByRole('heading', { name: 'Parent Org' }).click();
    await page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project'});
    await page.getByRole('heading', { name: 'Subgrantees' }).click();
    await page.getByRole('heading', {name: 'Child Org'}).click();
    await page.getByRole('heading', { name: 'Viewing Page for Child Org for Test Project'});

    await expect(page.getByRole('heading', { name: 'Subgrantee'})).not.toBeVisible();
    await page.getByRole('heading', { name: 'Tasks for Child Org'}).click();
    await page.getByRole('button', {name: 'Assign New Task(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Child Org'}).click();
    await page.getByRole('button', {name: 'Select T102: Test Dep'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Task(s)'}).click();
    //conform message displays on completion
    await expect(page.getByText('Successfully assigned 1 new tasks to Child Org!')).toBeVisible({ timeout: 10000 });
    const container = page.locator('#tasks');
    //confirm the two new tasks now appear in section
    await expect(container).toContainText(/T102: Test Dep/i);
});

test('test m&e/manager subgrantee project view + assign target', async({ resetDB, authPage: page }) => {
    await projectNav(page);
    await page.getByRole('heading', { name: 'Parent Org' }).click();
    await page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project'});
    await page.getByRole('heading', { name: 'Subgrantees' }).click();
    await page.getByRole('heading', {name: 'Child Org'}).click();
    await page.getByRole('heading', { name: 'Viewing Page for Child Org for Test Project'});
    
    await expect(page.getByRole('heading', { name: 'Subgrantee'})).not.toBeVisible();
    await page.getByRole('heading', { name: 'Targets for Child Org'}).click();
    await page.getByRole('button', {name: 'New Target'}).click();
    await expect(page.getByRole('heading', { name: 'New Target' })).toBeVisible();
    //fill out the fields
    await page.getByRole('button', {name: 'Choose a new Task'}).click();
    await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
    await page.locator('#amount').fill('100');
    await page.locator('label[for="date_type__quarter"]').click();
    await page.locator('label[for="quarter__Q1 2025"]').click();
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    //reexpand target section
    await page.getByRole('heading', { name: 'Targets' }).click();
    const container = page.locator('#targets');
    //it should contain targets for two new tasks
    await expect(container).toContainText(/T101: Test 1/i);
});

test('test m&e/manager interaction view', async ({ resetDB, authPage: page }) => {
    await changeAccounts(page, 'manager');
    await page.goto('/respondents');

    await page.getByRole('heading', { name: 'Anonymous' }).click();
    const container = page.locator('#previous-interactions');
    await container.getByText('T102: Test Dep').click();
    const card = await page.locator('div', { hasText: 'T102: Test Dep' })
    //click edit button
    const edit = await card.locator('button[aria-label="editdetails"]');
    await edit.click();
    //add a subcategory that us not selected in the prereq
    await page.locator('label[for="subcategories_data-2"]').click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    //expect a flag to be created
    await expect(container).toContainText('This interaction has active flags.', { timeout: 10000 });
});
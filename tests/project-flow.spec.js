import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';


test('create a project', async({ authPage: page, resetDB }) => {
    //test that a project can be created
    await page.goto('/projects');
    //click the create button after the page loads
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
    await page.getByRole('button', { name: /Create New Project/i }).click();
    await expect(page.getByRole('heading', { name: 'New Project' })).toBeVisible();

    //fill required fields (plus description)
    await page.locator('#name').fill('Test Project Create');
    await page.locator('#description').fill('This is a test.');
    await page.locator('#start').fill('2024-01-01');
    await page.locator('#end').fill('2024-12-31');
    await page.locator(`label[for="status__Active"]`).click();

    //select a client
    await page.getByRole('button', { name: 'Choose a New Client'}).click();
    await page.getByRole('button', { name: 'Select Client Org'}).click();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    //confirm redirect
    await expect(page.getByRole('heading', { name: 'Test Project Create' })).toBeVisible();
});

const goToOrg = async(page, org='Parent Org', proj='Test Project') => {
    /*
    Helper function that navigates to a project organization page fiven an organization and a project name
    */
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    //navigate to project page
    await page.getByRole('link', { name: `${proj}` }).click();
    await page.getByRole('heading', { name: 'Organizations' }).click();
    //navigate to org detail page
    await page.getByRole('link', { name: `${org}` }).click();
    await expect(page.getByRole('heading', { name: `Viewing Page for ${org} for ${proj}` })).toBeVisible();
}

test('assign an org to a project and navigate to org page', async({ authPage: page, resetDB }) => {
    //test that an organization can be assigned and that it creates a link that navigates to the detail page
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
    //navigate to project page
    await page.getByRole('link', { name: 'Test Project' }).click();
    //open orgs section
    await page.getByRole('heading', { name: 'Organizations' }).click();
    //click the add button and select the organization
    await page.getByRole('button', {name: 'Add Organization(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Test Project'}).click();
    await page.getByRole('button', {name: 'Select Unassigned Org'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Organization(s)'}).click();
    //click the link to the org that was just created
    await page.getByRole('link', { name: 'Unassigned Org' }).click();
    //confirm redirect was successful
    await expect(page.getByRole('heading', { name: 'Viewing Page for Unassigned Org for Test Project' })).toBeVisible();
});

test('assign a task to an org', async({ authPage: page, resetDB }) => {
    //test that a task can be assigned to an organization
    await goToOrg(page, 'Other Org'); //navigate to org
    //open tasks section
    await page.getByRole('heading', { name: 'Tasks for Other Org' }).click();
    //click the add task button and add two more tasks
    await page.getByRole('button', {name: 'Assign New Task(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click();
    await page.getByRole('button', {name: 'Select T102: Test Dep'}).click();
    await page.getByRole('button', {name: 'Select T103: Test Numeric Subcats'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Task(s)'}).click();
    //conform message displays on completion
    await expect(page.getByText('Successfully assigned 2 new tasks to Other Org!')).toBeVisible({ timeout: 10000 });
    const container = page.locator('#tasks');
    //confirm the two new tasks now appear in section
    await expect(container).toContainText(/T102: Test Dep/i);
    await expect(container).toContainText(/T103: Test Numeric Subcats/i);
});

test('create targets', async({ authPage: page, resetDB }) => {
    //test that targets (both raw amount and relative can be created)
    await goToOrg(page); //go to parent org project page 
    //click button to navigate to target form
    await page.getByRole('heading', { name: 'Targets' }).click();
    //check that redirect page has loaded
    await page.getByRole('button', {name: 'New Target'}).click();
    await expect(page.getByRole('heading', { name: 'New Target' })).toBeVisible();
    //fill out the fields
    await page.getByRole('button', {name: 'Choose a new Task'}).click();
    await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
    await page.locator('#amount').fill('100');
    await page.locator('label[for="date_type__quarter"]').click();
    await page.locator('label[for="quarter__Q1 2025"]').click();
    //save and test the create another process (same across most forms)
    await page.getByRole('button', {name: 'Save and Create Another', exact: true}).click();
    //check that a message displays so the user knows that data was saved
    await expect(page.getByText('Target created successfuly!')).toBeVisible({ timeout: 10000 });

    //fill out the form again
    await page.getByRole('button', {name: 'Choose a new Task'}).click();
    await page.getByRole('button', {name: 'Select T102: Test Dep'}).click();
    //this time measure it relative to another task
    await page.locator('label[for="as_percentage"]').click();
    await page.getByRole('button', {name: 'Choose a new Related To'}).click();
    await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
    await page.locator('#percentage_of_related').fill('75');
    await page.locator('label[for="date_type__quarter"]').click();
    await page.locator('label[for="quarter__Q1 2025"]').click();
    await page.getByRole('button', {name: 'Save', exact: true}).click();
    //reexpand target section
    await page.getByRole('heading', { name: 'Targets' }).click();
    const container = page.locator('#targets');
    //it should contain targets for two new tasks
    await expect(container).toContainText(/T101: Test 1/i);
    await container.getByRole('heading', { name: /T101: Test 1/i }).click();
    await expect(container).toContainText(/1 of 100/i); //we set a raw amount as 100
    await expect(container).toContainText(/T102: Test Dep/i);
    await container.getByRole('heading', { name: /T102: Test Dep/i }).click();
    await expect(container).toContainText(/1 of 1/i);  //this should be the number of achievement for T101
    await expect(container).toContainText('Measured as 75% of T101: Test 1'); //test that relative measurement text appears
})

test('assign a subgrantee to an org', async({ authPage: page, resetDB }) => {
    //test the process of assigning a subgrantee (including the auto redirect for creation)
    await goToOrg(page, 'Other Org'); //go to other org page
    //expand subgrantees section
    await page.getByRole('heading', { name: 'Subgrantees' }).click();
    await page.getByRole('button', {name: 'Assign New Subgrantee(s)'}).click();
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click({ timeout: 10000 });
    //create a new organization when given the option from the select modal
    await page.getByRole('button', {name: 'Add an Organization'}).click();
    //wait for form to load and fill it out
    await expect(page.getByRole('heading', { name: 'New Organization' })).toBeVisible();
    await page.locator('#name').fill('New Subgrantee');
    await page.getByRole('button', {name: 'Save', exact: true}).click({ timeout: 10000 });
    //expect this to be visible
    await page.getByRole('button', {name: 'Select new items for Other Org'}).click({ timeout: 10000 });
    //select the org we just created
    await page.getByRole('button', {name: 'Select New Subgrantee'}).click();
    await page.getByRole('button', {name: 'Done Selecting'}).click();
    await page.getByRole('button', {name: 'Confirm Selection & Assign Subgrantee(s)'}).click();
    //confirm they were assigned and a message confirms success
    await expect(page.getByText('Successfully assigned 1 new subgrantees.')).toBeVisible();
    await expect(page).toContainText(/New Subgrantee/i);
});

test('create project activity', async({ authPage: page, resetDB }) => {
    //simple test to create a project activity
    await page.goto('/projects');
    //go to existing project
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    //expand section
    await page.getByRole('heading', { name: 'Activities' }).click();
    //click button for new activity
    await page.getByRole('button', {name: 'New Activity'}).click();
    //fill out fields
    await page.locator('#name').fill('Test Activity');
    await page.locator('#start').fill('2025-03-01');
    await page.locator('#end').fill('2025-03-05');
    await page.locator('label[for="status__Completed"]').click();
    await page.locator('label[for="category__general"]').click();
    await page.locator('label[for="visible_to_all"]').click();
    await page.getByRole('button', {name: 'Save'}).click();
    //conform this was created
    await page.getByRole('heading', { name: 'Activities' }).click({ timeout: 10000 }); //expand section again
    await page.getByRole('heading', { name: 'Test Activity' }).click();
    await expect(page.getByText('March 1, 2025 to March 5, 2025')).toBeVisible(); //confirm dates
});

test('create project deadline', async({ authPage: page, resetDB }) => {
    //test deadline creation
    await page.goto('/projects');
    //go to existing project page
    await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible({ timeout: 10000 });
    await page.getByRole('link', { name: `Test Project` }).click();
    //expand deadlines secton
    await page.getByRole('heading', { name: 'Deadlines' }).click();
    //click create button and navigate to form page
    await page.getByRole('button', {name: 'New Deadline'}).click();
    //fill out form
    await page.locator('#name').fill('Test Deadline');
    await page.locator('#deadline_date').fill('2025-03-30');
    await page.locator('label[for="visible_to_all"]').click();
    await page.getByRole('button', {name: 'Save'}).click();
    //expect deadline to be visible after expanding the section
    await page.getByRole('heading', { name: 'Deadlines' }).click({ timeout: 10000 });
    await page.getByRole('heading', { name: 'Test Deadline' }).click();
    await expect(page.getByText('Due: March 30, 2025')).toBeVisible();
});
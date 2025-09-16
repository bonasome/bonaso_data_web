import { test } from './playwright.setup';
import { expect } from '@playwright/test';
import { resetDB } from './helpers/helpers';

test.describe('Project flows', () => {
    test.beforeAll(async ({ request }) => {
        await resetDB(request);
    });

    test('create a project', async({ authPage: page }) => {
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

    test('assign an org to a project and navigate to org page', async({ authPage: page }) => {
        await page.goto('/projects');
        await expect(page.getByRole('heading', { name: /Projects/i })).toBeVisible();
        //navigate to project page
        await page.getByRole('link', { name: 'Test Project Create' }).click();
        await page.getByRole('heading', { name: 'Organizations' }).click();
        await page.getByRole('button', {name: 'Add Organization(s)'}).click();
        await page.getByRole('button', {name: 'Select new items for Test Project Create'}).click();
        await page.getByRole('button', {name: 'Select Parent Org'}).click();
        await page.getByRole('button', {name: 'Done Selecting'}).click();
        await page.getByRole('button', {name: 'Confirm Selection & Assign Organization(s)'}).click();
        await page.getByRole('link', { name: 'Parent Org' }).click();
        await expect(page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project Create' })).toBeVisible();
    });

    test('assign a task to an org', async({ authPage: page }) => {
        await page.goto('/projects/2/organizations/2');
        await expect(page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project Create' })).toBeVisible();
        await page.getByRole('heading', { name: 'Tasks for Parent Org' }).click();
        await page.getByRole('button', {name: 'Assign New Task(s)'}).click();
        await page.getByRole('button', {name: 'Select new items for Parent Org'}).click();
        await page.getByRole('button', {name: 'Select T101: Test 1'}).click();
        await page.getByRole('button', {name: 'Done Selecting'}).click();
        await page.getByRole('button', {name: 'Confirm Selection & Assign Task(s)'}).click();
        await expect(page.getByText('Successfully assigned 1 new tasks to Parent Org!')).toBeVisible();
    });

    test('assign a subgrantee to an org', async({ authPage: page }) => {
        await page.goto('/projects/2/organizations/2');
        await expect(page.getByRole('heading', { name: 'Viewing Page for Parent Org for Test Project Create' })).toBeVisible();
        await page.getByRole('heading', { name: 'Subgrantees' }).click();
        await page.getByRole('button', {name: 'Assign New Subgrantee(s)'}).click();
        await page.getByRole('button', {name: 'Select new items for Parent Org'}).click();
        await page.getByRole('button', {name: 'Add an Organization'}).click();
        await expect(page.getByRole('heading', { name: 'New Organization' })).toBeVisible();
        await page.locator('#name').fill('New Subgrantee');
        await page.getByRole('button', {name: 'Save', exact: true}).click();
        await page.getByRole('button', {name: 'Select new items for Parent Org'}).click();
        await page.getByRole('button', {name: 'Select New Subgrantee'}).click();
        await page.getByRole('button', {name: 'Done Selecting'}).click();
        await page.getByRole('button', {name: 'Confirm Selection & Assign Subgrantee(s)'}).click();
        await expect(page.getByText('Successfully assigned 1 new subgrantees.')).toBeVisible();
    });
});